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
import { valueFormatter as ValueFormatter, textMeasurementService as TextMeasurementService } from "powerbi-visuals-utils-formattingutils/lib/src";

import IViewport = powerbi.IViewport;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import IValueFormatter = ValueFormatter.IValueFormatter;
import TextProperties = TextMeasurementService.TextProperties;

import { ChartOrientation, QuartileType, WhiskerType, MarginType, LabelOrientation } from "./enums";

const fontFamily: string = "wf_standard-font, helvetica, arial, sans-serif";

export class BoxWhiskerChartSettings extends DataViewObjectsParser {

    public general: GeneralSettings = new GeneralSettings();
    public formatting: FormattingSettings = new FormattingSettings();
    public chartOptions: ChartOptionsSettings = new ChartOptionsSettings();
    public xAxis: XAxisSettings = new XAxisSettings();
    public yAxis: YAxisSettings = new YAxisSettings();
    public dataPoint: DataPointSettings = new DataPointSettings();
    public toolTip: ToolTipSettings = new ToolTipSettings();
    public shapes: ShapeSettings = new ShapeSettings();
    public gridLines: GridLinesSettings = new GridLinesSettings();
    public labels: LabelsSettings = new LabelsSettings();
    public dataLoad: DataLoadSettings = new DataLoadSettings();
}

class GeneralSettings {
    public viewport: IViewport;
    public margin: IMargin = {
        top: 5,
        bottom: 5,
        right: 5,
        left: 5
    };
    public locale: string = undefined;
    public formatString: string = "";
    public duration: number = 100;
    public defaultColor: string = "#01B8AA";
    public get ColorProperties(): DataViewObjectPropertyIdentifier {
        return {
            objectName: "dataPoint",
            propertyName: "fill"
        };
    }
    public telemetry: boolean = false;
    public maxPoints: number = 30000;
    public dataPointColors: string;
}

class FormattingSettings {
    public valuesFormatter: IValueFormatter;
    public categoryFormatter: IValueFormatter;
    public labelFormatter: IValueFormatter;
    public toolTipFormatter: IValueFormatter;
}

class ChartOptionsSettings {
    public orientation: ChartOrientation = ChartOrientation.Vertical;
    public quartile: QuartileType = QuartileType.Inclusive;
    public includeEmpty: boolean = false;
    public whisker: WhiskerType = WhiskerType.MinMax;
    public lower: number = null;
    public higher: number = null;
    public outliers: boolean = false;
    public margin: MarginType = MarginType.Medium;
}

class XAxisSettings {
    public show: boolean = true;
    public fontColor: string = "#777";
    public fontSize: number = 11;
    public fontFamily: string = fontFamily;
    public labelDisplayUnits: number = 0;
    public labelPrecision: number = null;
    public orientation: LabelOrientation = LabelOrientation.Horizontal;
    public showTitle: boolean = false;
    public title: string = null;
    public defaultTitle: string = null;
    public titleFontColor: string = "#777";
    public titleFontSize: number = 11;
    public titleFontFamily: string = fontFamily;
    public titleAlignment: string = "center";
    public get axisTextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize + "px"
        };
    }
    public get titleTextProperties(): TextProperties {
        return {
            fontFamily: this.titleFontFamily,
            fontSize: this.titleFontSize + "px"
        };
    }
}

class YAxisSettings {
    public show: boolean = true;
    public scaleType: number = 0;
    public start: number = null;
    public end: number = null;
    public fontColor: string = "#777";
    public fontSize: number = 11;
    public fontFamily: string = fontFamily;
    public labelDisplayUnits: number = 0;
    public labelPrecision: number = null;
    public showTitle: boolean = false;
    public title: string = null;
    public defaultTitle: string = null;
    public titleFontColor: string = "#777";
    public titleFontSize: number = 11;
    public titleFontFamily: string = fontFamily;
    public titleAlignment: string = "center";
    public get axisTextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize + "px"
        };
    }
    public get titleTextProperties(): TextProperties {
        return {
            fontFamily: this.titleFontFamily,
            fontSize: this.titleFontSize + "px"
        };
    }
}

class DataPointSettings {
    public meanColor: string = "#111";
    public medianColor: string = "#111";
    public oneFill: string = null;
    public showAll: boolean = true;
}

class ToolTipSettings {
    public labelDisplayUnits: number = 0;
    public labelPrecision: number = null;
}

class LabelsSettings {
    public show: boolean = false;
    public fontColor: string = "#777";
    public fontSize: number = 11;
    public fontFamily: string = fontFamily;
    public labelDisplayUnits: number = 0;
    public labelPrecision: number = null;
    public get axisTextProperties(): TextProperties {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize + "px"
        };
    }
}

class ShapeSettings {
    public showMean: boolean = true;
    public showMedian: boolean = true;
    public dotRadius: number = 4;
    public highlight: boolean = true;
    public fixedCategory: boolean = true;
}

class GridLinesSettings {
    public show: boolean = true;
    public majorGridSize: number = 1;
    public majorGridColor: string = "#DDD";
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