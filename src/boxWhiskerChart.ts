/*
 *
 * Copyright (c) 2019 Jan Pieter Posthuma / DataScenarios
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
import powerbi from "powerbi-visuals-api";
import { valueFormatter as ValueFormatter, textMeasurementService as TextMeasurementService } from "powerbi-visuals-utils-formattingutils/lib/src";
import { dataViewObjects as DataViewObjectsModule } from "powerbi-visuals-utils-dataviewutils";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { ITooltipServiceWrapper, createTooltipServiceWrapper, TooltipEventArgs } from "powerbi-visuals-utils-tooltiputils";
import { valueType } from "powerbi-visuals-utils-typeutils";
import { Selection, selection, max as d3Max, layout as d3Layout, select as d3Select } from "d3";

import DataView = powerbi.DataView;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import PrimitiveValue = powerbi.PrimitiveValue;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import VisualDataChangeOperationKind = powerbi.VisualDataChangeOperationKind;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import Selector = powerbi.data.Selector;
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import TooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import IValueFormatter = ValueFormatter.IValueFormatter;
import valueFormatter = ValueFormatter.valueFormatter;
import ValueType = valueType.ValueType;
import TextProperties = TextMeasurementService.TextProperties;
import textMeasurementService = TextMeasurementService.textMeasurementService;
import Update = selection.Update;

import { syncSelectionState, drawChart } from "./boxWhiskerChartDraw";
import { drawReferenceLines, referenceLineReadDataView, referenceLineEnumerateObjectInstances } from "./boxWhiskerRefLineHelper";
import { calcAxisSettings, drawAxis } from "./boxWhiskerChartAxis";
import { dataPointEnumerateObjectInstances } from "./boxWhiskerDataPointHelper";
import { PerfTimer } from "./perfTimer";
import { ChartOrientation, QuartileType, WhiskerType } from "./enums";
import { BoxWhiskerChartSettings } from "./settings";
import { BoxWhiskerCssConstants } from "./cssConstants";
import { IBoxWhiskerAxisSettings, IBoxWhiskerChartDatapoint, IBoxWhiskerChartData, IBoxWhiskerChartOutlier, IBoxWhiskerChartReferenceLine } from "./interfaces";

import Visual = BoxWhiskerCssConstants.Visual;
import ChartMain = BoxWhiskerCssConstants.ChartMain;
import Chart = BoxWhiskerCssConstants.Chart;
import ChartNode = BoxWhiskerCssConstants.ChartNode;
import Axis = BoxWhiskerCssConstants.Axis;
import AxisX = BoxWhiskerCssConstants.AxisX;
import AxisY = BoxWhiskerCssConstants.AxisY;
import AxisXLabel = BoxWhiskerCssConstants.AxisXLabel;
import AxisYLabel = BoxWhiskerCssConstants.AxisYLabel;
import AxisMajorGrid = BoxWhiskerCssConstants.AxisMajorGrid;
import AxisMinorGrid = BoxWhiskerCssConstants.AxisMinorGrid;
import Text = BoxWhiskerCssConstants.Text;
import WarningText = BoxWhiskerCssConstants.WarningText;
import InfoText = BoxWhiskerCssConstants.InfoText;
import ChartReferenceLineFrontNode = BoxWhiskerCssConstants.ChartReferenceLineFrontNode;
import ChartReferenceLineBackNode = BoxWhiskerCssConstants.ChartReferenceLineBackNode;

import "../style/visual.less";

export interface ISQExpr extends powerbi.data.ISQExpr {
    ref: string;
}

export class BoxWhiskerChart implements IVisual {

    public static formatStringProp: DataViewObjectPropertyIdentifier = {
        objectName: "general",
        propertyName: "formatString",
    };

    // Trace messages
    private traceEvents = {
        convertor: "BoxWhiskerChart1455240051538: Convertor method",
        update: "BoxWhiskerChart1455240051538: Update method",
        drawChart: "BoxWhiskerChart1455240051538: DrawChart method",
        drawAxis: "BoxWhiskerChart1455240051538: DrawAxis method"
    };

    private root: HTMLElement;
    private svg: Selection<any>;
    private axis: Selection<any>;
    private chartMainGroup: Selection<any>;
    private chartMain: Selection<any>;
    private settings: BoxWhiskerChartSettings;
    private axisSettings: IBoxWhiskerAxisSettings;
    private chart: Selection<any>;
    private chartSelection: Update<IBoxWhiskerChartDatapoint[]>;
    private axisX: Selection<any>;
    private axisY: Selection<any>;
    private axisXLabel: Selection<any>;
    private axisYLabel: Selection<any>;
    private axisMajorGrid: Selection<any>;
    private axisMinorGrid: Selection<any>;

    private warningText: Selection<any>;
    private infoText: Selection<any>;

    private mainGroupElement: Selection<any>;
    private colorPalette: ISandboxExtendedColorPalette;
    private selectionIdBuilder: ISelectionIdBuilder;
    private selectionManager: ISelectionManager;
    private allowInteractions: boolean;
    private hostServices: IVisualHost;
    private dataView: DataView;
    private data: IBoxWhiskerChartData;
    private tooltipServiceWrapper: ITooltipServiceWrapper;

    private dataType: ValueType;

    public converter(dataView: DataView, colors: ISandboxExtendedColorPalette): IBoxWhiskerChartData {
        let timer = PerfTimer.start(this.traceEvents.convertor, this.settings.general.telemetry);
        if (!this.checkFullDataset(dataView)) {
            return {
                dataPoints: [],
                dataPointLength: 0,
                categories: [],
                referenceLines: [],
                isHighLighted: false
            };
        }

        let valueSource = dataView.categorical.values[0].source;
        let hasHighlight = this.settings.shapes.highlight && dataView.categorical.values[0].highlights !== undefined;
        // New dataViewMapping
        // let rawValues = dataView.categorical.values[0].values;
        let rawValues = dataView.categorical.values;
        let rawHighlightValues = dataView.categorical.values[0].highlights || [];
        let rawCategories = dataView.categorical.categories[0].source.roles.Samples === true ?
                dataView.categorical.categories[0].values.map(() => { return valueSource.displayName; }) :
                dataView.categorical.categories[0].values;
        let categories: any[] = [];
        let sampleValues: any[] = [];
        let highlightValues: any[] = [];

        // New dataViewMapping
        // rawValues.map((value: PrimitiveValue, index: number) => {
        //     if (categories.indexOf(rawCategories[index]) === -1) {
        //         categories.push(rawCategories[index]);
        //         sampleValues.push([]);
        //         if (hasHighlight) {
        //             highlightValues.push([]);
        //         }
        //     }
        //     let i = categories.indexOf(rawCategories[index]);
        //     if (this.settings.chartOptions.includeEmpty || value !== null) {
        //         sampleValues[i].push(value);
        //     }
        //     if (hasHighlight && rawHighlightValues[index] !== null) {
        //         highlightValues[i].push(rawHighlightValues[index]);
        //     }
        // });
        rawValues.map((valueArray) => {
            valueArray.values.map((value: PrimitiveValue, index: number) => {
                if (categories.indexOf(rawCategories[index]) === -1) {
                    categories.push(rawCategories[index]);
                    sampleValues.push([]);
                    if (hasHighlight) {
                        highlightValues.push([]);
                    }
                }
                let i = categories.indexOf(rawCategories[index]);
                if (this.settings.chartOptions.includeEmpty || value !== null) {
                    sampleValues[i].push(value);
                }
                if (hasHighlight && rawHighlightValues[index] !== null) {
                    highlightValues[i].push(rawHighlightValues[index]);
                }
            });
        });
        let dataPoints: IBoxWhiskerChartDatapoint[][] = [];
        let referenceLines: IBoxWhiskerChartReferenceLine[] = referenceLineReadDataView(dataView.metadata.objects, colors);
        let selectedIds = [];
        // let maxPoints = this.settings.general.maxPoints;
        let queryName = valueSource.queryName || "";
        let types = hasHighlight ? 2 : 1;
        this.settings.xAxis.defaultTitle = dataView.metadata.columns.filter((d) => { return d.index === 1; })[0].displayName;
        this.settings.yAxis.defaultTitle = dataView.metadata.columns.filter((d) => { return d.index === 0; })[0].displayName;
        let categoriesLabels = [];

        let sampleLabels = dataView.metadata.columns.filter((d) => d.roles.Samples === true ).map((d) => { return d.displayName; });

        let maxValue = d3Max(sampleValues, (sampleValue) => d3Max(sampleValue));

        this.settings.formatting.valuesFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(valueSource),
            precision: this.settings.yAxis.labelPrecision,
            value: this.settings.yAxis.labelDisplayUnits || maxValue,
            cultureSelector: this.settings.general.locale
        });

        this.settings.formatting.categoryFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(dataView.categorical.categories[0].source),
            precision: this.settings.xAxis.labelPrecision,
            value: this.settings.xAxis.labelDisplayUnits || categories[0].value,
            cultureSelector: this.settings.general.locale
        });

        this.settings.formatting.labelFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(valueSource),
            precision: this.settings.labels.labelPrecision,
            value: this.settings.labels.labelDisplayUnits || maxValue,
            cultureSelector: this.settings.general.locale
        });

        this.settings.formatting.toolTipFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(valueSource),
            precision: this.settings.toolTip.labelPrecision,
            value: this.settings.toolTip.labelDisplayUnits || maxValue,
            cultureSelector: this.settings.general.locale
        });

        this.dataType = ValueType.fromDescriptor(valueSource.type);

        // let categoryIdentities = categories.map((category) => {
        //     let sqlExpr = powerbi["data"].SQExprBuilder.equal(dataView.metadata.columns[0].expr, powerbi["data"].SQExprBuilder.text(category));
        //     return powerbi["data"].createDataViewScopeIdentity(sqlExpr);
        // });
        let categoryIdentities: any[] = [];
        let category = {
            source: dataView.categorical.categories[0].source,
            values: categories,
            identity: categoryIdentities
        };

        if (this.settings.dataPoint.oneFill === undefined) {
            this.settings.dataPoint.oneFill = this.getColumnColorByIndex(category, -1, "", colors);
        }

        for (let t = 0; t < types; t++) {
            for (let i = 0, iLen = categories.length; i < iLen && i < 100; i++) {
                let values = t === 1 ? highlightValues[i] : sampleValues[i];
                if ((t === 0) && ((values.length !== 0) || this.settings.shapes.fixedCategory)) {
                    categoriesLabels.push(this.settings.formatting.categoryFormatter.format(categories[i]));
                }

                if (values.length !== 0) {
                    let selectionId = null; // new SelectionId({ data: [ categoryIdentities[i] ] }, false);
                    let sortedValue = values.sort((n1: any, n2: any) => n1 - n2);

                    // Exclusive / Inclusive array correction
                    let corr = this.settings.chartOptions.quartile === QuartileType.Exclusive ? 1 : -1;
                    let corr1 = this.settings.chartOptions.quartile === QuartileType.Exclusive ? 0 : 1;
                    let q1 = (0.25 * (sortedValue.length + corr)) + corr1;
                    let m  = (0.50 * (sortedValue.length + corr)) + corr1;
                    let q3 = (0.75 * (sortedValue.length + corr)) + corr1;
                    let q1l = Math.floor(q1);
                    let ml  = Math.floor(m);
                    let q3l = Math.floor(q3);
                    let quartile1 = sortedValue[q1l - 1] + (q1 - q1l) * (sortedValue[q1l] - sortedValue[q1l - 1]);
                    let median    = sortedValue[ml - 1] + (m - ml) * (sortedValue[ml] - sortedValue[ml - 1]);
                    let quartile3 = sortedValue[q3l - 1] + (q3 - q3l) * (sortedValue[q3l] - sortedValue[q3l - 1]);

                    let ttl: number = 0;
                    sortedValue.forEach((value: any) => { ttl += value; });
                    let avgvalue = ttl / sortedValue.length;

                    let minValue: number, maxValue: number, IQR: number,
                        minValueLabel: string, maxValueLabel: string,
                        quartileValue: string, whiskerValue: string,
                        whiskerType: WhiskerType = this.settings.chartOptions.whisker;

                    if (!quartile1 || !quartile3) {
                        whiskerType = WhiskerType.MinMax;
                    }

                    switch (whiskerType) {
                        case WhiskerType.Standard:
                            IQR = quartile3 - quartile1;
                            minValue = sortedValue.filter((value: any) => value >= quartile1 - (1.5 * IQR))[0];
                            maxValue = sortedValue.filter((value: any) => value <= quartile3 + (1.5 * IQR)).reverse()[0];
                            minValueLabel = "Minimum";
                            maxValueLabel = "Maximum";
                            quartileValue = this.settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive" ;
                            whiskerValue = "< 1.5IQR";
                            break;
                        case WhiskerType.IQR:
                            IQR = quartile3 - quartile1;
                            minValue = quartile1 - (1.5 * IQR);
                            maxValue = quartile3 + (1.5 * IQR);
                            minValueLabel = "Q1 - 1.5 x IQR";
                            maxValueLabel = "Q3 + 1.5 x IQR";
                            quartileValue = this.settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive" ;
                            whiskerValue = "= 1.5IQR";
                            break;
                        case WhiskerType.Custom:
                            let lower = Math.max(this.settings.chartOptions.lower || 0, Math.ceil(100 / (sortedValue.length + 1)));
                            let higher = Math.min(this.settings.chartOptions.higher || 100, Math.floor(100 - (100 / (sortedValue.length + 1))));
                            let xl = ((lower / 100.) * (sortedValue.length + corr)) + corr1;
                            let xh = ((higher / 100.) * (sortedValue.length + corr)) + corr1;
                            let il = Math.floor(xl);
                            let ih = Math.floor(xh);
                            let high = sortedValue[ih - 1] + (xh - ih) * ((sortedValue[ih] || 0) - sortedValue[ih - 1]); // Escape index out of bound
                            let low = sortedValue[il - 1] + (xl - il) * ((sortedValue[il] || 0) - sortedValue[il - 1]);  // Escape index out of bound
                            minValue = low;
                            maxValue = high;
                            minValueLabel = "Lower: " + lower.toString() + "%";
                            maxValueLabel = "Higher: " + higher.toString() + "%";
                            quartileValue = this.settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive" ;
                            whiskerValue = "Custom";
                            break;
                        case WhiskerType.MinMax:
                        default:
                            minValue = sortedValue[0];
                            maxValue = sortedValue[sortedValue.length - 1];
                            minValueLabel = "Minimum";
                            maxValueLabel = "Maximum";
                            quartileValue = this.settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive" ;
                            whiskerValue = "Min/Max";
                            break;
                    }

                    let dataPointColor: string = this.getColumnColorByIndex(category, i, i.toString(), colors);

                    let outliers: IBoxWhiskerChartOutlier[] = this.settings.chartOptions.outliers ?
                        sortedValue
                            .filter((value: any) => value < minValue || value > maxValue) // Filter outliers
                            .filter((value: any, index: any, self: any) => self.indexOf(value) === index) // Make unique
                            .map((value: any) => {
                                return <IBoxWhiskerChartOutlier>{
                                    category: i,
                                    color: dataPointColor,
                                    value: value,
                                    highlight: t === 0 && hasHighlight ? false : t === 1 ? true : undefined,
                                    selectionId: null,
                                    tooltipInfo: [
                                        {
                                            displayName: "Category",
                                            value: categories[0].value === undefined
                                                ? dataView.matrix.valueSources[0].displayName
                                                : this.settings.formatting.categoryFormatter.format(categories[i]),
                                        },
                                        {
                                            displayName: "Value",
                                            value: this.settings.formatting.toolTipFormatter.format(value)
                                        }
                                    ]
                                };
                            })
                        : [];

                    let dataPoint: IBoxWhiskerChartDatapoint = {
                        x: 0,
                        y: 0,
                        min: minValue,
                        max: maxValue,
                        quartile1: quartile1,
                        quartile3: quartile3,
                        median: median,
                        average: avgvalue,
                        samples: sortedValue.length,
                        category: i,
                        outliers: outliers,
                        dataLabels: (this.settings.labels.show) ?
                            [maxValue, minValue, avgvalue, median, quartile1, quartile3]
                                .filter((value) => { return value != null; }) // Remove empties
                                .map((dataPoint) => { return { value: dataPoint, x: 0, y: 0, visible: 1 }; })
                                .concat(outliers.map((outlier) => { return { value: outlier.value, x: 0, y: 0, visible: 1 }; }))
                                .filter((value, index, self) => self.indexOf(value) === index) // Make unique
                            : [],
                        label: this.settings.formatting.categoryFormatter.format(categories[i]),
                        highlight: t === 1 || !hasHighlight,
                        selectionId: selectionId,
                        color: dataPointColor,
                        fillColor: this.colorPalette.isHighContrast ? this.colorPalette.background.value : dataPointColor,
                        tooltipInfo: (t === 0 && hasHighlight) ? undefined : [
                            {
                                displayName: "Category",
                                value: this.settings.formatting.categoryFormatter.format(categories[i]),
                            },
                            {
                                displayName: "Quartile Calculation",
                                value: quartileValue
                            },
                            {
                                displayName: "Whisker Type",
                                value: whiskerValue
                            },
                            {
                                displayName: "# Samples",
                                value: valueFormatter.format(sortedValue.length, "d", false),
                            },
                            {
                                displayName: "Sampling",
                                value: sampleLabels.join(",\n")
                            },
                            {
                                displayName: maxValueLabel,
                                value: this.settings.formatting.toolTipFormatter.format(maxValue),
                            },
                            {
                                displayName: "Quartile 3",
                                value: this.settings.formatting.toolTipFormatter.format(quartile3),
                            },
                            {
                                displayName: "Median",
                                value: this.settings.formatting.toolTipFormatter.format(median),
                            },
                            {
                                displayName: "Average",
                                value: this.settings.formatting.toolTipFormatter.format(avgvalue),
                            },
                            {
                                displayName: "Quartile 1",
                                value: this.settings.formatting.toolTipFormatter.format(quartile1),
                            },
                            {
                                displayName: minValueLabel,
                                value: this.settings.formatting.toolTipFormatter.format(minValue),
                            }]
                    };
                    let updated = false;
                    dataPoints.forEach((dp: IBoxWhiskerChartDatapoint[], index: number) => {
                        if ((dataPoint.category === dp[0].category) && (dataPoint.average === dp[0].average)) {
                            dataPoints[index][0] = dataPoint;
                            updated = true;
                        }
                    });
                    if (!updated) {
                        dataPoints.push([dataPoint]);
                    }
                }
            }
        }
        timer();
        return {
            dataPoints: dataPoints,
            dataPointLength: (this.settings.shapes.highlight || this.settings.shapes.fixedCategory) ? categories.length : dataPoints.length,
            categories: categoriesLabels,
            referenceLines: referenceLines,
            isHighLighted: hasHighlight
        };
    }

    constructor(options: VisualConstructorOptions) {
        if (options.element) {
            this.root = options.element;
        }
        let element = options.element;
        this.hostServices = options.host;
        this.colorPalette = options.host.colorPalette;
        this.selectionIdBuilder = options.host.createSelectionIdBuilder();
        this.selectionManager = options.host.createSelectionManager();
        this.allowInteractions = options.host.allowInteractions;
        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.hostServices.tooltipService, options.element);

        this.settings = BoxWhiskerChart.parseSettings(this.dataView);
        this.settings.general.locale = options.host.locale;

        this.selectionManager.registerOnSelectCallback(() => {
            syncSelectionState(this.chartSelection, this.selectionManager.getSelectionIds() as ISelectionId[]);
        });

        this.warningText = d3Select(this.root)
            .append("text")
            .classed(Text.className, true)
            .classed(WarningText.className, true);

        this.infoText = d3Select(this.root)
            .append("text")
            .classed(Text.className, true)
            .classed(InfoText.className, true);

        if (!this.svg) {
            this.svg = d3Select(this.root)
                .append("svg")
                .classed(Visual.className, true);
        }

        this.svg.on("click", () => {
            if (this.allowInteractions) {
                this.selectionManager
                    .clear()
                    .then(() => {
                        syncSelectionState(this.chartSelection, []);
                    });
            }
        });

        this.mainGroupElement = this.svg.append("g");

        this.axis = this.mainGroupElement
            .append("g")
            .classed(Axis.className, true);

        this.axisX = this.axis
            .append("g")
            .classed(AxisX.className, true);

        this.axisMajorGrid = this.axis
            .append("g")
            .classed(AxisMajorGrid.className, true);

        this.axisMinorGrid = this.axis
            .append("g")
            .classed(AxisMinorGrid.className, true);

        this.axisY = this.axis
            .append("g")
            .classed(AxisY.className, true);

        this.axisXLabel = this.axis
            .append("text")
            .classed(AxisXLabel.className, true);

        this.axisYLabel = this.axis
            .append("text")
            .classed(AxisYLabel.className, true);

        this.chartMainGroup = this.mainGroupElement
            .append("g");

        this.chartMain = this.chartMainGroup
            .append("svg")
            .classed(ChartMain.className, true);

        let backRefLine = this.chartMain
            .append("g")
            .classed(ChartReferenceLineBackNode.className, true);

        this.chart = this.chartMain
            .append("g")
            .classed(Chart.className, true);

        let frontRefLine = this.chartMain
            .append("g")
            .classed(ChartReferenceLineFrontNode.className, true);
        }

    public update(options: VisualUpdateOptions): void {
        let timer = PerfTimer.start(this.traceEvents.update, this.settings.general.telemetry);
        if (!options ||
            !options.dataViews ||
            !options.dataViews[0] ||
            !options.viewport) {
            return;
        }
        this.dataView = options.dataViews ? options.dataViews[0] : undefined;
        if (!this.dataView) {
            return;
        }

        let dataView = this.dataView = options.dataViews[0],
            firstCall = options.operationKind === VisualDataChangeOperationKind.Create,
            lastCall = (dataView.metadata.segment) ? false : true,
            validDataset = this.checkFullDataset(this.dataView);

        this.settings = BoxWhiskerChart.parseSettings(this.dataView);

        if (firstCall) {
            this.warningText
                .style("color", null)
                .style("background", null)
                .text("");
        }

        if (validDataset && !lastCall && this.settings.dataLoad.enablePaging) {
            if (this.settings.dataLoad.showProgress) {
                this.infoText
                    .style("color", this.settings.dataLoad.progressColor)
                    .style("background", this.settings.dataLoad.backgroundColor)
                    .text(this.settings.dataLoad.progressText);
            }
            let moreData: boolean = this.hostServices.fetchMoreData();
            if ((moreData)) {
                return;
            } else {
                if (this.settings.dataLoad.showWarning) {
                    this.warningText
                        .style("color", this.settings.dataLoad.warningColor)
                        .style("background", this.settings.dataLoad.backgroundColor)
                        .text(this.settings.dataLoad.warningText);
                }
            }
        }

        this.infoText
            .style("color", null)
            .style("background", null)
            .text("");

        let data = this.data = this.converter(dataView, this.colorPalette),
            dataPoints = data.dataPoints;

        this.settings.general.viewport = {
            height: options.viewport.height > 0 ? options.viewport.height : 0,
            width: options.viewport.width > 0 ? options.viewport.width : 0
        };

        this.axisSettings = calcAxisSettings(this.settings, this.data);
        this.svg
            .attr({
                "height": this.settings.general.viewport.height,
                "width": this.settings.general.viewport.width
            });

        this.settings.general.margin.top = this.settings.formatting.valuesFormatter ?
        textMeasurementService.measureSvgTextHeight(
            this.settings.yAxis.axisTextProperties,
            this.settings.formatting.valuesFormatter.format(this.axisSettings.axisOptions.max || 0)
        ) / 2. : 5;

        // Overwrite High Contrast colors
        this.settings.xAxis.fontColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.xAxis.fontColor;
        this.settings.yAxis.fontColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.yAxis.fontColor;
        this.settings.gridLines.majorGridColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.gridLines.majorGridColor;
        this.settings.gridLines.minorGridColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.gridLines.minorGridColor;
        this.settings.dataPoint.meanColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.dataPoint.meanColor;
        this.settings.dataPoint.medianColor = this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : this.settings.dataPoint.medianColor;
        this.settings.shapes.dotRadius = this.colorPalette.isHighContrast ? 6 : this.settings.shapes.dotRadius;

        // Create ChartNodes
        let stack = d3Layout.stack();
        let layers = stack(dataPoints);

        this.chartSelection = <Update<IBoxWhiskerChartDatapoint[]>>this.chartMain
            .selectAll(ChartNode.selectorName)
            .data(layers);

        this.chartSelection
            .enter()
            .append("g")
            .classed(ChartNode.className, true);

        let timerAxis = PerfTimer.start(this.traceEvents.drawAxis, this.settings.general.telemetry);
        drawAxis(
            this.axis,
            this.settings,
            this.data,
            this.axisSettings);
        timerAxis();
        this.setChartDimensions();
        drawReferenceLines(
            this.svg,
            this.settings,
            this.data.referenceLines,
            this.axisSettings,
            false);
        let timerChart = PerfTimer.start(this.traceEvents.drawChart, this.settings.general.telemetry);
        drawChart(
            this.chart,
            this.chartSelection,
            this.settings,
            this.selectionManager,
            this.allowInteractions,
            this.tooltipServiceWrapper,
            this.data,
            this.axisSettings);
        syncSelectionState(this.chartSelection, this.selectionManager.getSelectionIds() as ISelectionId[]);
        timerChart();
        drawReferenceLines(
            this.svg,
            this.settings,
            this.data.referenceLines,
            this.axisSettings,
            true);
        this.chartSelection
            .exit()
            .remove();
        timer();
    }

    private setChartDimensions() {
        this.axisSettings.drawScaleCategory = this.axisSettings.axisScaleCategory.copy()
            .range([0, this.axisSettings.axisScaleCategory.range()[1] - this.axisSettings.axisScaleCategory.range()[0]]);
        this.axisSettings.drawScaleValue = this.axisSettings.axisScaleValue.copy()
            .range([this.axisSettings.axisScaleValue(this.axisSettings.axisOptions.min) - this.axisSettings.axisScaleValue(this.axisSettings.axisOptions.max), 0]);
        let chartX = this.axisSettings.axisScaleCategory.range()[0],
            chartY = this.axisSettings.axisScaleValue(this.axisSettings.axisOptions.max),
            chartWidth = this.axisSettings.axisScaleCategory.range()[1] - this.axisSettings.axisScaleCategory.range()[0],
            chartHeight = this.axisSettings.axisScaleValue(this.axisSettings.axisOptions.min) - chartY;
        this.chartMainGroup
            .attr({
                "transform": `translate(${chartX}, ${chartY})`,
            });
        this.chartMain
            .attr({
                "height": chartHeight,
                "width": chartWidth,
            });
    }

    public checkFullDataset(dataView: DataView) {
        return !(
            !dataView ||
            !dataView.categorical ||
            !dataView.categorical.categories ||
            !dataView.categorical.categories[0] ||
            !dataView.categorical.categories[0].values ||
            !(dataView.categorical.categories[0].values.length > 0) ||
            !dataView.categorical.values ||
            !dataView.categorical.values[0] ||
            !dataView.categorical.values[0].values ||
            !(dataView.categorical.values[0].values.length > 0)
        );
    }
    public getColumnColorByIndex(category: DataViewCategoryColumn, index: number, queryName: string, colorPalette: ISandboxExtendedColorPalette): string {
        if (colorPalette.isHighContrast) {
            return colorPalette.foreground.value;
        }
        if (index === -1) {
            if (this.settings.dataPoint.oneFill) {
                return this.settings.dataPoint.oneFill;
            }
            return colorPalette.getColor("0").value;
        }

        let objects = this.dataView.metadata.objects;
        if (objects) {
            let dataPoint = DataViewObjectsModule.getObject(objects, "dataPoint");
            if (dataPoint) {
                dataPoint = dataPoint.$instances;
                if (dataPoint) {
                    let dataPointSetting: any = dataPoint[index];
                    if (dataPointSetting) {
                        return dataPointSetting.fill.solid.color;
                    }
                }
            }
        }
        if (this.settings.general.dataPointColors) {
            let colors = this.settings.general.dataPointColors.split(",");
            if (colors[index] !== "") {
                return colors[index];
            }
        }
        return colorPalette.getColor(queryName).value;
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const instanceEnumeration: VisualObjectInstanceEnumeration = BoxWhiskerChartSettings.enumerateObjectInstances(
            this.settings || BoxWhiskerChartSettings.getDefault(),
            options);
        let instances: VisualObjectInstance[] = [];

        switch (options.objectName) {
            case "general":
                this.removeEnumerateObject(instanceEnumeration, "dataPointColors");
                break;
            case "chartOptions":
                this.removeEnumerateObject(instanceEnumeration, "orientation");
                switch (this.settings.chartOptions.whisker) {
                    case WhiskerType.MinMax:
                        this.removeEnumerateObject(instanceEnumeration, "outliers");
                    case WhiskerType.IQR:
                    case WhiskerType.Standard:
                        this.removeEnumerateObject(instanceEnumeration, "lower");
                        this.removeEnumerateObject(instanceEnumeration, "higher");
                }
                break;
            case "shapes":
                if (this.settings.shapes.highlight) {
                    this.removeEnumerateObject(instanceEnumeration, "fixedCategory");
                }
                break;
            case "xAxis":
                if (this.settings.chartOptions.orientation === ChartOrientation.Vertical) {
                    this.removeEnumerateObject(instanceEnumeration, "labelDisplayUnits");
                    this.removeEnumerateObject(instanceEnumeration, "labelPrecision");
                }
                if (!this.settings.xAxis.showTitle) {
                    this.removeEnumerateObject(instanceEnumeration, "title");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontColor");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontSize");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontFamily");
                    this.removeEnumerateObject(instanceEnumeration, "titleAlignment");
                }
                break;
            case "yAxis":
                if (this.settings.chartOptions.orientation === ChartOrientation.Horizontal) {
                    this.removeEnumerateObject(instanceEnumeration, "labelDisplayUnits");
                    this.removeEnumerateObject(instanceEnumeration, "labelPrecision");
                }
                if (!this.settings.yAxis.showTitle) {
                    this.removeEnumerateObject(instanceEnumeration, "title");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontColor");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontSize");
                    this.removeEnumerateObject(instanceEnumeration, "titleFontFamily");
                    this.removeEnumerateObject(instanceEnumeration, "titleAlignment");
                }
                break;
            case "dataPoint":
                if (this.settings.dataPoint.showAll) {
                    this.removeEnumerateObject(instanceEnumeration, "oneFill");
                    instances = dataPointEnumerateObjectInstances(this.data.dataPoints, this.colorPalette, this.settings.dataPoint.showAll);
                }
                break;
            case "dataLoad":
                if (!this.settings.dataLoad.showProgress) {
                    this.removeEnumerateObject(instanceEnumeration, "progressColor");
                    this.removeEnumerateObject(instanceEnumeration, "progressText");
                }
                if (!this.settings.dataLoad.showWarning) {
                    this.removeEnumerateObject(instanceEnumeration, "warningColor");
                    this.removeEnumerateObject(instanceEnumeration, "warningText");
                }
                break;
            case "y1AxisReferenceLine":
                instances = referenceLineEnumerateObjectInstances(this.data.referenceLines, this.colorPalette);
                break;
        }
        instances.forEach((instance: VisualObjectInstance) => { this.addAnInstanceToEnumeration(instanceEnumeration, instance); });
        return instanceEnumeration;
    }

    public addAnInstanceToEnumeration(instanceEnumeration: VisualObjectInstanceEnumeration, instance: VisualObjectInstance): void {
        if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
            (instanceEnumeration as VisualObjectInstanceEnumerationObject)
                .instances
                .push(instance);
        } else {
            (instanceEnumeration as VisualObjectInstance[]).push(instance);
        }
    }

    public removeEnumerateObject(instanceEnumeration: VisualObjectInstanceEnumeration, objectName: string): void {
        if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
            delete (instanceEnumeration as VisualObjectInstanceEnumerationObject)
                .instances[0].properties[objectName];
        } else {
            delete (instanceEnumeration as VisualObjectInstance[])[0].properties[objectName];
        }
    }

    public destroy(): void {
    }

    private static parseSettings(dataView: DataView): BoxWhiskerChartSettings {
        let settings: BoxWhiskerChartSettings = BoxWhiskerChartSettings.parse<BoxWhiskerChartSettings>(dataView);
        settings.yAxis.axisTextProperties = {
            fontFamily: settings.yAxis.fontFamily,
            fontSize: settings.yAxis.fontSize + "px"
        };
        settings.yAxis.titleTextProperties = {
            fontFamily: settings.yAxis.titleFontFamily,
            fontSize: settings.yAxis.titleFontSize + "px"
        };
        settings.xAxis.axisTextProperties = {
            fontFamily: settings.xAxis.fontFamily,
            fontSize: settings.xAxis.fontSize + "px"
        };
        settings.xAxis.titleTextProperties = {
            fontFamily: settings.xAxis.titleFontFamily,
            fontSize: settings.xAxis.titleFontSize + "px"
        };
        settings.labels.axisTextProperties = {
            fontFamily: settings.labels.fontFamily,
            fontSize: settings.labels.fontSize + "px"
        };

        // if (settings.yAxis.start >= Number.MAX_VALUE) settings.yAxis.start = Number.MAX_VALUE;
        // if (settings.yAxis.end >= Number.MAX_VALUE) settings.yAxis.end = Number.MAX_VALUE;
        // if (settings.yAxis.start <= Number.MIN_VALUE) settings.yAxis.start = Number.MIN_VALUE;
        // if (settings.yAxis.end <= Number.MIN_VALUE) settings.yAxis.end = Number.MIN_VALUE;

        if (settings.chartOptions.higher > 100) { settings.chartOptions.higher = 100; }
        if (settings.chartOptions.higher < 75) { settings.chartOptions.higher = 75; }
        if (settings.chartOptions.lower > 25) { settings.chartOptions.lower = 25; }
        if (settings.chartOptions.lower < 0) { settings.chartOptions.lower = 0; }

        if (settings.xAxis.labelPrecision > 30) { settings.xAxis.labelPrecision = 30; }
        if (settings.yAxis.labelPrecision > 30) { settings.yAxis.labelPrecision = 30; }
        if (settings.toolTip.labelPrecision > 30) { settings.toolTip.labelPrecision = 30; }
        if (settings.labels.labelPrecision > 30) { settings.labels.labelPrecision = 30; }

        if (dataView &&
            dataView.categorical &&
            dataView.categorical.categories &&
            dataView.categorical.categories[0].objects &&
            !(dataView.metadata.objects && dataView.metadata.objects.dataPoint && dataView.metadata.objects.dataPoint.showAll !== undefined)) {
                settings.dataPoint.showAll = true;
                settings.general.dataPointColors = dataView.categorical.categories[0].objects.map((object: any) => { return object.dataPoint ? object.dataPoint.fill.solid.color : ""; }).toString();
        }
        return settings;
    }
}
