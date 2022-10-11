/*
 *
 * Copyright (c) 2021 Jan Pieter Posthuma / DataScenarios
 *
 * All rights reserved.
 *
 * MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";
import "core-js/stable";
import "regenerator-runtime/runtime";
import "./../style/visual.less";

import powerbi from "powerbi-visuals-api";
import { ITooltipServiceWrapper, createTooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import { getObject } from "powerbi-visuals-utils-dataviewutils/lib/dataViewObjects";
import { select, Selection, selectAll } from "d3-selection";
import { isEqual } from "lodash";

import DataView = powerbi.DataView;
import DataViewPropertyValue = powerbi.DataViewPropertyValue;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IViewport = powerbi.IViewport;
import IVisual = powerbi.extensibility.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import Selector = powerbi.data.Selector;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualUpdateType = powerbi.VisualUpdateType;

import { PerfTimer } from "./perfTimer";
import { ChartOrientation, Orientation, TraceEvents, WhiskerType } from "./enums";
import { BoxPlot, BoxWhiskerChartData, Legend, SinglePoint } from "./data";
import { Settings } from "./settings";
import { syncSelectionState } from "./syncSelectionState";
import { Selectors } from "./selectors";
import { converter } from "./convertor";
import { calculateAxis } from "./calculateAxis";
import { calculateData } from "./calculateData";
import { calculatePlot } from "./calculatePlot";
import { calculateScale } from "./calculateScale";
import { drawAxis } from "./drawAxis";
// import { drawGridLines } from "./drawGridLines";
import { drawLegend } from "./drawLegend";
import { drawPlot } from "./drawPlot";
import { BaseType } from "d3";
import { referenceLineEnumerateObjectInstances } from "./refLines";

export class BoxWhiskerChart implements IVisual {
    private target: HTMLElement;
    private border: Selection<BaseType, any, BaseType, any>;
    private svg: Selection<BaseType, any, BaseType, any>;
    private plotArea: Selection<BaseType, any, BaseType, any>;
    private axis: Selection<BaseType, any, BaseType, any>;
    private axisCategory: Selection<BaseType, any, BaseType, any>;
    private axisValue: Selection<BaseType, any, BaseType, any>;
    private axisCategoryLabel: Selection<BaseType, any, BaseType, any>;
    private axisValueLabel: Selection<BaseType, any, BaseType, any>;
    private grid: Selection<BaseType, any, BaseType, any>;
    private series: Selection<BaseType, any, BaseType, any>;
    private backRefLine: Selection<BaseType, any, BaseType, any>;
    private frontRefLine: Selection<BaseType, any, BaseType, any>;
    private warningText: Selection<BaseType, any, any, any>;
    private infoText: Selection<BaseType, any, any, any>;
    private legendArea: Selection<BaseType, unknown, BaseType, unknown>;
    private legendBorder: Selection<BaseType, unknown, BaseType, unknown>;
    private legend: Selection<BaseType, unknown, BaseType, unknown>;
    private locale: string;
    private data: BoxWhiskerChartData;

    private events: IVisualEventService;
    private settings: Settings;
    private dataView: DataView;
    private viewPort: IViewport;
    private colorPalette: ISandboxExtendedColorPalette;
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private allowInteractions: boolean;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private renderTimeoutId: number | undefined;
    private colorConfig: any[];
    private styleConfig: any[];

    constructor(options?: VisualConstructorOptions) {
        if (!options) return;
        const timer = PerfTimer.START(TraceEvents.constructor, true);
        this.events = options.host.eventService;
        this.locale = options.host.locale;
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();
        this.selectionManager.registerOnSelectCallback(() => {
            syncSelectionState(
                this.svg.selectAll(Selectors.BoxPlot.selectorName),
                <ISelectionId[]>this.selectionManager.getSelectionIds()
            );
        });
        this.allowInteractions = <boolean>options.host.hostCapabilities.allowInteractions;
        this.tooltipServiceWrapper = createTooltipServiceWrapper(options.host.tooltipService, options.element);
        this.colorPalette = options.host.colorPalette;
        this.target = options.element;
        this.border = select(options.element).append("div").classed("border", true);
        this.warningText = select(this.target)
            .append("text")
            .classed(Selectors.Text.className, true)
            .classed(Selectors.WarningText.className, true);

        this.infoText = select(this.target)
            .append("text")
            .classed(Selectors.Text.className, true)
            .classed(Selectors.InfoText.className, true);
        this.svg = this.border.append("svg").classed(Selectors.Svg.className, true);
        this.svg.on("click", () => {
            if (this.allowInteractions) {
                this.selectionManager.clear().then(() => {
                    syncSelectionState(this.svg.selectAll(Selectors.BoxPlot.selectorName), []);
                });
            }
        });
        this.plotArea = this.svg.append("g").classed(Selectors.PlotArea.className, true);
        this.axis = this.svg.append("g").classed(Selectors.Axis.className, true);
        this.legendArea = this.svg.append("g").classed(Selectors.LegendArea.className, true);

        this.grid = this.plotArea.append("g").classed(Selectors.Grid.className, true);
        this.backRefLine = this.plotArea.append("g").classed(Selectors.ReferenceLinesBack.className, true);
        this.series = this.plotArea.append("g").classed(Selectors.Series.className, true).attr("fill", "none");
        this.frontRefLine = this.plotArea.append("g").classed(Selectors.ReferenceLinesFront.className, true);

        this.axisCategory = this.axis.append("g").classed(Selectors.AxisCategory.className, true);
        this.axisValue = this.axis.append("g").classed(Selectors.AxisValue.className, true);
        this.axisCategoryLabel = this.axisCategory.append("text").classed(Selectors.AxisCategoryLabel.className, true);
        this.axisValueLabel = this.axis.append("g").classed(Selectors.AxisValueLabel.className, true);

        this.legendBorder = this.legendArea.append("rect").classed(Selectors.LegendBorder.className, true);
        this.legend = this.legendArea.append("g").classed(Selectors.Legend.className, true);

        timer();
    }

    update(options: VisualUpdateOptions): void {
        const timer = PerfTimer.START(TraceEvents.update, true);
        this.events.renderingStarted(options);

        if (
            isEqual(this.dataView, options && options.dataViews && options.dataViews[0]) &&
            isEqual(this.viewPort, options && options.viewport)
        ) {
            this.events.renderingFinished(options);
            timer();
            return;
        }
        this.viewPort = options && options.viewport;
        this.dataView = options && options.dataViews && options.dataViews[0];

        this.data = <BoxWhiskerChartData>(
            converter(this.dataView, options.viewport, this.host, this.colorPalette, this.locale)
        );

        if (!this.data) {
            this.grid.selectAll("*").remove();
            this.backRefLine.selectAll("*").remove();
            this.frontRefLine.selectAll("*").remove();
            this.series.selectAll("*").remove();

            this.axisCategory.selectAll("*").remove();
            this.axisValue.selectAll("*").remove();
            this.axisCategoryLabel.selectAll("*").remove();
            this.axisValueLabel.selectAll("*").remove();

            this.legend.selectAll("*").remove();

            this.events.renderingFinished(options);
            timer();
            return;
        }

        this.settings = this.data.settings;

        this.svg.attr("viewBox", `0,0,${options.viewport.width},${options.viewport.height}`);

        calculatePlot(this.data, this.settings);
        calculateAxis(this.data, this.settings);
        calculateScale(this.data, this.settings);
        calculateData(this.data, this.settings);

        if (this.settings.dataPoint.persist) {
            this.settings.dataPoint.persist = false;
            this.host.persistProperties({
                merge: [
                    {
                        objectName: "dataPoint",
                        selector: <Selector>(<unknown>null),
                        properties: {
                            persist: false,
                            colorConfig: this.settings.dataPoint.colorConfig,
                        },
                    },
                ],
            });
        }

        drawAxis(this.axis, this.data, this.settings, (event: MouseEvent) => {});

        drawPlot(this.series, this.data, this.settings, (event: MouseEvent, boxPlot: BoxPlot) => {
            const isShiftPressed: boolean = event.shiftKey;
            if (!boxPlot.selectionId) return;
            this.processClickEvent(
                event,
                isShiftPressed && boxPlot.seriesSelectionId ? boxPlot.seriesSelectionId : boxPlot.selectionId
            );
        });

        drawLegend(this.legend, this.data, this.settings, (event: MouseEvent, legend: Legend) => {
            if (!legend.selectionId) return;
            this.processClickEvent(event, legend.selectionId);
        });

        this.tooltipServiceWrapper.addTooltip(
            this.plotArea.selectAll(Selectors.MainBox.selectorName),
            (boxPlot: BoxPlot) => (boxPlot.tooltip ? boxPlot.tooltip(this.settings) : <any>null),
            (boxPlot: BoxPlot) => (boxPlot.selectionId ? <ISelectionId>boxPlot.selectionId : [])
        );

        this.tooltipServiceWrapper.addTooltip(
            this.plotArea.selectAll(Selectors.InnerPoint.selectorName),
            (point: SinglePoint) => (point.singlePointtooltip ? point.singlePointtooltip(this.settings) : <any>null),
            (point: SinglePoint) => (point.selectionId ? <ISelectionId>point.selectionId : [])
        );

        this.tooltipServiceWrapper.addTooltip(
            this.plotArea.selectAll(Selectors.Outlier.selectorName),
            (point: SinglePoint) => (point.singlePointtooltip ? point.singlePointtooltip(this.settings) : <any>null),
            (point: SinglePoint) => (point.selectionId ? <ISelectionId>point.selectionId : [])
        );

        this.events.renderingFinished(options);
        timer();
    }

    private processClickEvent(event: MouseEvent, selectionId: ISelectionId) {
        const isCtrlPressed: boolean = event.ctrlKey;

        const currentSelectedIds = this.selectionManager.getSelectionIds()[0];
        if (!selectionId) return;
        if (selectionId !== currentSelectedIds && !isCtrlPressed) {
            this.selectionManager.clear();
        }
        this.selectionManager.select(selectionId, isCtrlPressed).then((ids: ISelectionId[]) => {
            syncSelectionState(this.series.selectAll(Selectors.BoxPlot.selectorName), ids);
        });

        event.stopPropagation();
    }

    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions
    ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        let instanceEnumeration: VisualObjectInstanceEnumeration = Settings.enumerateObjectInstances(
            this.settings || Settings.getDefault(),
            options
        );

        let instances: VisualObjectInstance[] = [];
        let beginning: number | undefined;

        switch (options.objectName) {
            case "general":
                return [];
            case "chartOptions":
                this.removeEnumerateObject(instanceEnumeration, "outliers"); // Old setting
                switch (this.settings.chartOptions.whisker) {
                    case WhiskerType.MinMax:
                    case WhiskerType.IQR:
                    case WhiskerType.Standard:
                        this.removeEnumerateObject(instanceEnumeration, "lower");
                        this.removeEnumerateObject(instanceEnumeration, "higher");
                }
                if (!this.settings.general.hasSeries) this.removeEnumerateObject(instanceEnumeration, "internalMargin");
                break;
            case "xAxis":
                if (this.settings.chartOptions.orientation === ChartOrientation.Horizontal) {
                    this.removeEnumerateObject(instanceEnumeration, "labelAlignment");
                    this.removeEnumerateObject(instanceEnumeration, "orientation");
                }
                if (this.settings.chartOptions.orientation === ChartOrientation.Vertical) {
                    this.removeEnumerateObject(instanceEnumeration, "maxArea");
                    this.removeEnumerateObject(instanceEnumeration, "titleOrientation");
                }
                if (this.settings.xAxis.titleOrientation === Orientation.Horizontal) {
                    this.removeEnumerateObject(instanceEnumeration, "titleAlignment");
                }
                if (!this.settings.xAxis.showTitle) {
                    this.removeEnumerateObject(instanceEnumeration, "title");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontColor");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontSize");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontFamily");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontStyle");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontWeight");
                    this.removeEnumerateObject(instanceEnumeration, "titleAlignment");
                    this.removeEnumerateObject(instanceEnumeration, "titleOrientation");
                }
                break;
            case "yAxis":
                if (this.settings.chartOptions.orientation === ChartOrientation.Vertical) {
                    this.removeEnumerateObject(instanceEnumeration, "labelAlignment");
                    this.removeEnumerateObject(instanceEnumeration, "orientation");
                }
                if (!this.settings.yAxis.showTitle) {
                    this.removeEnumerateObject(instanceEnumeration, "title");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontColor");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontSize");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontFamily");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontStyle");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontWeight");
                    this.removeEnumerateObject(instanceEnumeration, "titleAlignment");
                }
                break;
            case "dataPoint":
                this.removeEnumerateObject(instanceEnumeration, "oneFill"); // Old setting
                this.removeEnumerateObject(instanceEnumeration, "showAll"); // Old setting
                if (this.settings.dataPoint.colorConfig === "[]") {
                    this.removeEnumerateObject(instanceEnumeration, "colorConfig");
                }
                instances = this.colorEnumerateObjectInstances(this.data.legend);
                beginning = 1;
                break;
            case "shapes":
                if (this.settings.chartOptions.whisker === WhiskerType.MinMax) {
                    this.removeEnumerateObject(instanceEnumeration, "showOutliers");
                    this.removeEnumerateObject(instanceEnumeration, "outlierRadius");
                }
                if (!this.settings.shapes.showPoints) {
                    this.removeEnumerateObject(instanceEnumeration, "pointRadius");
                    this.removeEnumerateObject(instanceEnumeration, "pointFill");
                }
                if (!this.settings.shapes.showOutliers) {
                    this.removeEnumerateObject(instanceEnumeration, "outlierRadius");
                    this.removeEnumerateObject(instanceEnumeration, "outlierFill");
                }
                if (!this.settings.shapes.showMean) this.removeEnumerateObject(instanceEnumeration, "dotRadius");
                break;
            // case "y1AxisReferenceLine":
            //     instances = referenceLineEnumerateObjectInstances(this.data.referenceLines, this.colorPalette);
            //     break;
        }

        this.addInstancesToEnumeration(instanceEnumeration, instances, beginning);

        return instanceEnumeration;
    }

    public addInstancesToEnumeration(
        instanceEnumeration: VisualObjectInstanceEnumeration,
        instances: VisualObjectInstance[],
        beginning?: number
    ): void {
        if (instances.length === 0) return;
        let enumeration = (<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances
            ? (<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances
            : <VisualObjectInstance[]>instanceEnumeration;
        if (enumeration.length === 1 && beginning && beginning > 0) {
            const bProperties = Object.assign(
                {},
                ...Object.keys(enumeration[0].properties).map((k, i) => {
                    if (i <= beginning) return { [k]: enumeration[0].properties[k] };
                })
            );
            const eProperties = Object.assign(
                {},
                ...Object.keys(enumeration[0].properties).map((k, i) => {
                    if (i > beginning) return { [k]: enumeration[0].properties[k] };
                })
            );
            const returnEnumeration = enumeration.concat(instances).concat(Object.assign({}, enumeration[0]));
            returnEnumeration[0].properties = bProperties;
            returnEnumeration[returnEnumeration.length - 1].properties = eProperties;
            (<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances = returnEnumeration;
        }
    }

    public removeEnumerateObject(instanceEnumeration: VisualObjectInstanceEnumeration, objectName: string): void {
        if ((<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete (<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances[0].properties[objectName];
        } else {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete (<VisualObjectInstance[]>instanceEnumeration)[0].properties[objectName];
        }
    }

    public colorEnumerateObjectInstances(legend: Legend[] | undefined): VisualObjectInstance[] {
        const instances: VisualObjectInstance[] = [];
        legend?.forEach((legend: Legend, index: number) => {
            instances.push({
                displayName: legend.legend,
                objectName: "dataPoint",
                selector: { id: index.toString(), metadata: undefined },
                properties: {
                    fill: { solid: { color: legend.color } },
                },
            });
        });
        return instances;
    }
}
