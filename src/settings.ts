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
import { IMargin } from "powerbi-visuals-utils-svgutils";
import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import { interfaces, valueFormatter } from "powerbi-visuals-utils-formattingutils";

import DataView = powerbi.DataView;
import IViewport = powerbi.IViewport;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

import IValueFormatter = valueFormatter.IValueFormatter;
import TextProperties = interfaces.TextProperties;

import { AxisDimensions, LegendDimensions, PlotDimensions, Scales } from "./data";
import {
    ChartOrientation,
    QuartileType,
    WhiskerType,
    MarginType,
    Orientation,
    FontWeight,
    FontStyle,
    LegendPosition,
} from "./enums";

const fontFamily: string = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";

export class Settings extends DataViewObjectsParser {
    public general: GeneralSettings = new GeneralSettings();
    public formatting: FormattingSettings = new FormattingSettings();

    public chartOptions: ChartOptionsSettings = new ChartOptionsSettings();
    public legend: LegendSettings = new LegendSettings();
    public xAxis: XAxisSettings = new XAxisSettings();
    public yAxis: YAxisSettings = new YAxisSettings();
    public dataPoint: DataPointSettings = new DataPointSettings();
    public toolTip: ToolTipSettings = new ToolTipSettings();
    public shapes: ShapeSettings = new ShapeSettings();
    public gridLines: GridLinesSettings = new GridLinesSettings();
    public labels: LabelsSettings = new LabelsSettings();
    public dataLoad: DataLoadSettings = new DataLoadSettings();

    public y1AxisReferenceLine: Y1AxisReferenceLineSettings = new Y1AxisReferenceLineSettings();
}

class GeneralSettings {
    public padding: number = 5;
    public x: number = this.padding;
    public y: number = this.padding;
    public width: number;
    public height: number;
    public legendDimensions: LegendDimensions;
    public axisDimensions: AxisDimensions;
    public telemetry: boolean = false;
    public locale: string = "1033";
    public scales: Scales;
    public orientation: ChartOrientation = ChartOrientation.Vertical;
    public axisTitleOrientation: Orientation = Orientation.Vertical;
    public hasSeries: boolean = false;

    public get plotDimensions(): PlotDimensions {
        return {
            x1:
                this.x +
                (this.axisTitleOrientation === Orientation.Vertical
                    ? this.orientation === ChartOrientation.Vertical
                        ? <number>this.axisDimensions.valueAxisTitle.width
                        : <number>this.axisDimensions.categoryAxisTitle.width
                    : 0) +
                (this.orientation === ChartOrientation.Vertical
                    ? <number>this.axisDimensions.valueAxisLabel.width
                    : <number>this.axisDimensions.categoryAxisLabel.width),
            x2:
                this.width -
                this.padding -
                (this.orientation === ChartOrientation.Vertical
                    ? 0
                    : (<number>this.axisDimensions.valueAxisLabel.width +
                          <number>this.axisDimensions.valueAxisTitle.width) /
                      2),
            y1:
                this.y +
                (this.legendDimensions?.topHeight || 0) +
                (this.axisTitleOrientation === Orientation.Horizontal
                    ? this.orientation === ChartOrientation.Vertical
                        ? <number>this.axisDimensions.valueAxisTitle.height
                        : <number>this.axisDimensions.categoryAxisTitle.height
                    : 0) +
                (this.orientation === ChartOrientation.Vertical
                    ? (<number>this.axisDimensions.valueAxisLabel.height +
                          <number>this.axisDimensions.valueAxisTitle.height) /
                      2
                    : 0),
            y2:
                this.y +
                this.height -
                (this.legendDimensions?.bottomHeight || 0) -
                (this.orientation === ChartOrientation.Vertical
                    ? <number>this.axisDimensions.categoryAxisLabel.height +
                      <number>this.axisDimensions.categoryAxisTitle.height
                    : <number>this.axisDimensions.valueAxisLabel.height +
                      <number>this.axisDimensions.valueAxisTitle.height),
        };
    }

    // old settings
    public viewport: IViewport;
    public margin: IMargin = {
        top: 5,
        bottom: 5,
        right: 5,
        left: 5,
    };
    public formatString: string = "";
    public duration: number = 100;
    public defaultColor: string = "#01B8AA";
    public get ColorProperties(): DataViewObjectPropertyIdentifier {
        return {
            objectName: "dataPoint",
            propertyName: "fill",
        };
    }
    public maxPoints: number = 30000;
    public dataPointColors: string;
}

class FormattingSettings {
    public seriesFormatter: IValueFormatter;
    public valuesFormatter: IValueFormatter;
    public categoryFormatter: IValueFormatter;
    public labelFormatter: IValueFormatter;
    public toolTipFormatter: IValueFormatter;
}

// Formatting pane

class ChartOptionsSettings {
    public orientation: ChartOrientation = ChartOrientation.Vertical;
    public quartile: QuartileType = QuartileType.Inclusive;
    public includeEmpty: boolean = false;
    public whisker: WhiskerType = WhiskerType.MinMax;
    public lower: number | null = null;
    public higher: number | null = null;
    public categoryLegend: boolean = false;
    public margin: MarginType = MarginType.Medium;
    public internalMargin: MarginType = MarginType.Medium;
}

class LegendSettings {
    public show = true;
    public position: LegendPosition = LegendPosition.TopLeft;
    public fontColor = "#666666";
    public fontSize = 11;
    public fontFamily: string = fontFamily;
    public fontStyle: number = FontStyle.Normal;
    public fontWeight: number = FontWeight.Normal;
    public get FontStyle(): string {
        switch (this.fontStyle) {
            default:
            case FontStyle.Normal:
                return "Normal";
            case FontStyle.Italic:
                return "Italic";
        }
    }
    public get FontSize(): string {
        return `${this.fontSize}pt`;
    }
    public get TextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.FontSize,
            fontStyle: this.FontStyle,
            fontWeight: this.fontWeight.toString(),
        };
    }
}

// Category Axis
class XAxisSettings {
    public show: boolean = true;
    public fontColor: string = "#777";
    public fontSize: number = 11;
    public fontFamily: string = fontFamily;
    public fontStyle: number = FontStyle.Normal;
    public fontWeight: number = FontWeight.Normal;
    public labelAlignment: string = "center";
    public orientation: Orientation = Orientation.Horizontal;
    public maxArea: number = 25;
    public showTitle: boolean = false;
    public title: string | null = null;
    public defaultTitle: string | null = null;
    public titleFontColor: string = "#777";
    public titleFontSize: number = 11;
    public titleFontFamily: string = fontFamily;
    public titleFontStyle: number = FontStyle.Normal;
    public titleFontWeight: number = FontWeight.Normal;
    public titleAlignment: string = "center";
    public titleOrientation: Orientation = Orientation.Vertical;

    public get FontStyle(): string {
        switch (this.fontStyle) {
            default:
            case FontStyle.Normal:
                return "Normal";
            case FontStyle.Italic:
                return "Italic";
        }
    }
    public get TitleFontStyle(): string {
        switch (this.titleFontStyle) {
            default:
            case FontStyle.Normal:
                return "Normal";
            case FontStyle.Italic:
                return "Italic";
        }
    }
    public get FontSize(): string {
        return `${this.fontSize}pt`;
    }
    public get TitleFontSize(): string {
        return `${this.titleFontSize}pt`;
    }
    public get TextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.FontSize,
            fontStyle: this.FontStyle,
            fontWeight: this.fontWeight.toString(),
        };
    }
    public get TitleTextProperties(): TextProperties {
        return {
            fontFamily: this.titleFontFamily,
            fontSize: this.TitleFontSize,
            fontStyle: this.TitleFontStyle,
            fontWeight: this.titleFontWeight.toString(),
        };
    }

    // old
    public get axisTextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize + "px",
        };
    }
    public get titleTextProperties(): TextProperties {
        return {
            fontFamily: this.titleFontFamily,
            fontSize: this.titleFontSize + "px",
        };
    }
}

// Value Axis
class YAxisSettings {
    public show: boolean = true;
    public scaleType: number = 0;
    public start: number | null | undefined = null;
    public end: number | null = null;
    public fontColor: string = "#777";
    public fontSize: number = 11;
    public fontFamily: string = fontFamily;
    public fontStyle: number = FontStyle.Normal;
    public fontWeight: number = FontWeight.Normal;
    public labelDisplayUnits: number = 0;
    public labelPrecision: number | null = null;
    public showTitle: boolean = false;
    public title: string | null = null;
    public defaultTitle: string | null = null;
    public titleFontColor: string = "#777";
    public titleFontSize: number = 11;
    public titleFontFamily: string = fontFamily;
    public titleFontStyle: number = FontStyle.Normal;
    public titleFontWeight: number = FontWeight.Normal;
    public titleAlignment: string = "center";
    public titleOrientation: Orientation = Orientation.Vertical;

    public get FontStyle(): string {
        switch (this.fontStyle) {
            default:
            case FontStyle.Normal:
                return "Normal";
            case FontStyle.Italic:
                return "Italic";
        }
    }
    public get TitleFontStyle(): string {
        switch (this.titleFontStyle) {
            default:
            case FontStyle.Normal:
                return "Normal";
            case FontStyle.Italic:
                return "Italic";
        }
    }
    public get FontSize(): string {
        return `${this.fontSize}pt`;
    }
    public get TitleFontSize(): string {
        return `${this.titleFontSize}pt`;
    }
    public get TextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.FontSize,
            fontStyle: this.FontStyle,
            fontWeight: this.fontWeight.toString(),
        };
    }
    public get TitleTextProperties(): TextProperties {
        return {
            fontFamily: this.titleFontFamily,
            fontSize: this.TitleFontSize,
            fontStyle: this.TitleFontStyle,
            fontWeight: this.titleFontWeight.toString(),
        };
    }

    // old
    public get axisTextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize + "px",
        };
    }
    public get titleTextProperties(): TextProperties {
        return {
            fontFamily: this.titleFontFamily,
            fontSize: this.titleFontSize + "px",
        };
    }
}

class DataPointSettings {
    public meanColor: string = "#111";
    public medianColor: string = "#111";
    public oneFill: string | null = null;
    public showAll: boolean = true;
    public persist = false;
    public colorConfig = "[]";
}

class ToolTipSettings {
    public labelDisplayUnits: number = 0;
    public labelPrecision: number | null = null;
}

class LabelsSettings {
    public show: boolean = false;
    public fontColor: string = "#777";
    public fontSize: number = 11;
    public fontFamily: string = fontFamily;
    public labelDisplayUnits: number = 0;
    public labelPrecision: number | null = null;
    public get axisTextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize + "px",
        };
    }
}

class ShapeSettings {
    public boxFill: boolean = true;
    public showPoints: boolean = false;
    public pointRadius: number = 4;
    public pointFill: boolean = true;
    public showOutliers: boolean = false;
    public outlierRadius: number = 4;
    public outlierFill: boolean = true;
    public showMean: boolean = true;
    public dotRadius: number = 4;
    public showMedian: boolean = true;
    public highlight: boolean = true;
    public fixedCategory: boolean = true;
}

class GridLinesSettings {
    public show: boolean = true;
    public majorGridSize: number = 1;
    public majorGridColor: string = "#DDD";
    public zeroColor: string = "#777";
    public minorGrid: boolean = false;
    public minorGridSize: number = 1;
    public minorGridColor: string = "#EEE";
}

class DataLoadSettings {
    public enablePaging: boolean = true;
    public showProgress: boolean = true;
    public progressColor: string = "#777";
    public progressText: string = "Data loading in progress";
    public showWarning: boolean = true;
    public warningColor: string = "#FF7900";
    public warningText: string = "Not all datapoints could be loaded";
    public backgroundColor: string = "#FFF";
}

class Y1AxisReferenceLineSettings {
    public show: boolean = true;
    public displayName: string | null = null;
    public value: number | null = null;
}

export function parseSettings(dataView: DataView): Settings {
    migrateOldSettings(dataView);
    const settings = <Settings>Settings.parse(dataView);

    // Correct % inputs (high)
    if (settings.chartOptions.higher && settings.chartOptions.higher > 100) {
        settings.chartOptions.higher = 100;
    }
    if (settings.chartOptions.higher && settings.chartOptions.higher < 75) {
        settings.chartOptions.higher = 75;
    }
    // Correct % inputs (low)
    if (settings.chartOptions.lower && settings.chartOptions.lower > 25) {
        settings.chartOptions.lower = 25;
    }
    if (settings.chartOptions.lower && settings.chartOptions.lower < 0) {
        settings.chartOptions.lower = 0;
    }
    // Correct % maxArea
    if (settings.xAxis.maxArea > 50) {
        settings.xAxis.maxArea = 50;
    }
    // if (settings.xAxis.maxArea < 15) {
    //     settings.xAxis.maxArea = 15;
    // }
    // Reset out of bound percisions
    if (settings.yAxis.labelPrecision && settings.yAxis.labelPrecision > 30) {
        settings.yAxis.labelPrecision = 30;
    }
    if (settings.toolTip.labelPrecision && settings.toolTip.labelPrecision > 30) {
        settings.toolTip.labelPrecision = 30;
    }
    if (settings.labels.labelPrecision && settings.labels.labelPrecision > 30) {
        settings.labels.labelPrecision = 30;
    }

    return settings;
}

function migrateOldSettings(dataView: DataView) {
    if (dataView && dataView.metadata && dataView.metadata.objects) {
        let chartOptions = dataView.metadata.objects["chartOptions"];
        let dataPoint = dataView.metadata.objects["dataPoint"];
        let shapes = dataView.metadata.objects["shapes"];

        if (chartOptions) {
            const outliers = chartOptions.outliers;

            if (!shapes) {
                dataView.metadata.objects["shapes"] = {};
                shapes = dataView.metadata.objects["shapes"];
            }
            if (outliers !== undefined) {
                shapes.showOutliers = outliers;
                delete chartOptions.outliers;
            }
        }

        if (dataPoint) {
            if (!chartOptions) {
                dataView.metadata.objects["chartOptions"] = {};
                chartOptions = dataView.metadata.objects["chartOptions"];
            }
            const showAll = <boolean>(dataPoint.showAll === undefined ? true : dataPoint.showAll);
            const oneFill = <string>(<any>dataPoint.oneFill).solid.color;

            if (!showAll) {
                chartOptions.categoryLegend = showAll;
                if (!dataPoint.$instances) {
                    dataPoint.$instances = {};
                }
                if (!dataPoint.$instances["0"]) {
                    dataPoint.$instances["0"] = { fill: { solid: { color: oneFill } } };
                }
                delete dataPoint.showAll;
                delete dataPoint.oneFill;
            }

            // oneFill is not used
            if (oneFill && showAll) {
                delete dataPoint.oneFill;
            }
        }
    }
}
