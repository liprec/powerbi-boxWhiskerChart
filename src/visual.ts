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
import { select, Selection, selectAll } from "d3-selection";
import { isEqual } from "lodash";

import DataView = powerbi.DataView;
import DataViewPropertyValue = powerbi.DataViewPropertyValue;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IViewPort = powerbi.IViewport;
import IVisual = powerbi.extensibility.visual.IVisual;
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
import { TraceEvents } from "./enums";
import { BoxPlot, BoxWhiskerChartData } from "./data";
import { Settings } from "./settings";
import { syncSelectionState } from "./syncSelectionState";
import { Selectors } from "./selectors";
import { converter } from "./convertor";
import { calculateAxis } from "./calculateAxis";
import { calculateScale } from "./calculateScale";
import { drawAxis } from "./drawAxis";
import { drawGridLines } from "./drawGridLines";

export class BoxWhiskerChart implements IVisual {
    private target: HTMLElement;
    private border: Selection<any, any, any, any>;
    private svg: Selection<any, any, any, any>;
    private plotArea: Selection<any, any, any, any>;
    private axis: Selection<any, any, any, any>;
    private axisCategory: Selection<any, any, any, any>;
    private axisValue: Selection<any, any, any, any>;
    private axisCategoryLabel: Selection<any, any, any, any>;
    private axisValueLabel: Selection<any, any, any, any>;
    private grid: Selection<any, any, any, any>;
    private boxes: Selection<any, any, any, any>;
    private backRefLine: Selection<any, any, any, any>;
    private frontRefLine: Selection<any, any, any, any>;
    private warningText: Selection<any, any, any, any>;
    private infoText: Selection<any, any, any, any>;
    private locale: string;
    private data: BoxWhiskerChartData;

    private settings: Settings;
    private dataView: DataView;
    private viewPort: IViewPort;
    private colorPalette: ISandboxExtendedColorPalette;
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private allowInteractions: boolean;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private renderTimeoutId: number | undefined;
    private colorConfig: any[];
    private styleConfig: any[];

    constructor(options: VisualConstructorOptions) {
        const timer = PerfTimer.START(TraceEvents.constructor, true);
        this.locale = options.host.locale;
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();
        this.selectionManager.registerOnSelectCallback(() => {
            syncSelectionState(
                this.svg.selectAll(Selectors.ChartNode.selectorName),
                this.selectionManager.getSelectionIds() as ISelectionId[]
            );
        });
        this.allowInteractions = options.host.allowInteractions;
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
                    syncSelectionState(this.svg.selectAll(Selectors.ChartNode.selectorName), []);
                });
            }
        });
        this.plotArea = this.svg.append("g").classed(Selectors.PlotArea.className, true);
        this.axis = this.svg.append("g").classed(Selectors.Axis.className, true);

        this.grid = this.plotArea.append("g").classed(Selectors.Grid.className, true);
        this.backRefLine = this.plotArea.append("g").classed(Selectors.ChartReferenceLineBackNode.className, true);
        this.boxes = this.plotArea.append("g").classed(Selectors.ChartNode.className, true).attr("fill", "none");
        this.frontRefLine = this.plotArea.append("g").classed(Selectors.ChartReferenceLineFrontNode.className, true);

        this.axisCategory = this.axis.append("g").classed(Selectors.AxisCategory.className, true);
        this.axisValue = this.axis.append("g").classed(Selectors.AxisValue.className, true);
        this.axisCategoryLabel = this.axis.append("g").classed(Selectors.AxisCategoryLabel.className, true);
        this.axisValueLabel = this.axis.append("g").classed(Selectors.AxisValueLabel.className, true);

        timer();
    }

    update(options: VisualUpdateOptions): void {
        const timer = PerfTimer.START(TraceEvents.update, true);
        if (
            isEqual(this.dataView, options && options.dataViews && options.dataViews[0]) &&
            isEqual(this.viewPort, options && options.viewport)
        ) {
            timer();
            return;
        }
        this.viewPort = options && options.viewport;
        this.dataView = options && options.dataViews && options.dataViews[0];
        this.data = converter(
            this.dataView,
            options.viewport,
            this.host,
            this.colorPalette,
            this.locale
        ) as BoxWhiskerChartData;
        if (!this.data) {
            timer();
        }
        this.settings = this.data.settings;
        this.settings = calculateAxis(this.data, this.settings);
        this.settings = calculateScale(this.data, this.settings);
        // this.data = calculateData(this.data, this.settings);

        this.svg.attr("viewBox", `0,0,${options.viewport.width},${options.viewport.height}`);

        drawAxis(this.axis, this.settings, (event: MouseEvent, boxPlotName: string) => {
            const currentBoxPlot = this.data.boxPlots.filter((boxPlot: BoxPlot) => boxPlot.name === boxPlotName);
            if (currentBoxPlot.length === 0 || !currentBoxPlot[0].selectionId) return;
            this.processClickEvent(event, currentBoxPlot[0].selectionId);
        });
        drawGridLines(this.grid, this.settings);

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
            syncSelectionState(this.boxes.selectAll(Selectors.ChartNode.selectorName), ids);
        });

        event.stopPropagation();
    }

    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions
    ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        const instanceEnumeration: VisualObjectInstanceEnumeration = Settings.enumerateObjectInstances(
            this.settings || Settings.getDefault(),
            options
        );

        let instances: VisualObjectInstance[] = [];

        switch (options.objectName) {
            case "general":
                return [];
            case "xAxis":
                if (!this.settings.xAxis.showTitle) {
                    this.removeEnumerateObject(instanceEnumeration, "title");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontColor");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontSize");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontFamily");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontStyle");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontWeight");
                    this.removeEnumerateObject(instanceEnumeration, "titleAlignment");
                }
                break;
            case "yAxis":
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
        }

        instances.forEach((instance: VisualObjectInstance) => {
            this.addAnInstanceToEnumeration(instanceEnumeration, instance);
        });
        return instanceEnumeration;
    }

    public addAnInstanceToEnumeration(
        instanceEnumeration: VisualObjectInstanceEnumeration,
        instance: VisualObjectInstance
    ): void {
        if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
            (instanceEnumeration as VisualObjectInstanceEnumerationObject).instances.push(instance);
        } else {
            (instanceEnumeration as VisualObjectInstance[]).push(instance);
        }
    }

    public removeEnumerateObject(instanceEnumeration: VisualObjectInstanceEnumeration, objectName: string): void {
        if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
            delete (instanceEnumeration as VisualObjectInstanceEnumerationObject).instances[0].properties[objectName];
        } else {
            delete (instanceEnumeration as VisualObjectInstance[])[0].properties[objectName];
        }
    }
}
