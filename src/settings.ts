/*
*
* Copyright (c) 2017 Jan Pieter Posthuma / DataScenarios
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

module powerbi.extensibility.visual {
 
    // utils.formatting
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    // utils.dataview
    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;
    // utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    
    export class BoxWhiskerChartSettings extends DataViewObjectsParser {

        public general: GeneralSettings = new GeneralSettings();
        public axis: AxisSettings = new AxisSettings();
        public formatting: FormattingSettings = new FormattingSettings();
        public chartOptions: ChartOptionsSettings = new ChartOptionsSettings();
        public xAxis: XAxisSettings = new XAxisSettings();
        public yAxis: YAxisSettings = new YAxisSettings();
        public dataPoint: DataPointSettings = new DataPointSettings();
        public gridLines: GridLinesSettings = new GridLinesSettings();
        public labels: LabelsSettings = new LabelsSettings();
    }

    class GeneralSettings {
        public viewport: IViewport;
        public margin: IMargin = {
            top: 5,
            bottom: 5,
            right: 5,
            left: 5
        };
        public formatString: string = "";
        public duration: number = 0;
        public defaultColor: string = "#01B8AA"
        public ColorProperties: DataViewObjectPropertyIdentifier = {
            objectName: "dataPoint",
            propertyName: "fill"
        };
    }

    class AxisSettings {
        public axisSizeY: number = 0;
        public axisSizeX: number = 0;
        public axisLabelSizeY: number = 0;
        public axisLabelSizeX: number = 0;
        public axisOptions: BoxWhiskerAxisOptions;
    }

    class FormattingSettings {
        public valuesFormatter: IValueFormatter;
        public categoryFormatter: IValueFormatter;
        public labelFormatter: IValueFormatter;
    }

    class ChartOptionsSettings {
        public orientation: BoxWhiskerEnums.ChartOrientation = BoxWhiskerEnums.ChartOrientation.Vertical;
        public quartile: BoxWhiskerEnums.QuartileType = BoxWhiskerEnums.QuartileType.Inclusive;
        public whisker: BoxWhiskerEnums.WhiskerType = BoxWhiskerEnums.WhiskerType.MinMax;
        public outliers: boolean = false;
        public margin: BoxWhiskerEnums.MarginType = BoxWhiskerEnums.MarginType.Medium;
    }

    class DataPointSettings {
        public meanColor: string = "#212121";
        public medianColor: string = "#212121";
        public oneColor: boolean = false;
    }

    class XAxisSettings {
        public show: boolean = true;
        public fontColor: string = "#212121"
        public fontSize: number = 11;
        public fontFamily: string = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
        public labelDisplayUnits: number = 0;
        public labelPrecision: number = undefined;
        public showTitle: boolean = false;
        public title: string = undefined;
        public axisTextProperties: TextProperties = {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize + "px"
        };
    }

    class YAxisSettings {
        public show: boolean = true;
        public fontColor: string = "#212121"
        public fontSize: number = 11;
        public fontFamily: string = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
        public labelDisplayUnits: number = 0;
        public labelPrecision: number = undefined;
        public showTitle: boolean = false;
        public title: string = undefined;
        public axisTextProperties: TextProperties = {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize + "px"
        };
    }

    class GridLinesSettings {
        public show: boolean = true;
        public majorGridSize: number = 1;
        public majorGridColor: string = "#666666";
        public minorGrid: boolean = false;
        public minorGridSize: number = 1;
        public minorGridColor: string = "#9c9c9c";
    }

    class LabelsSettings {
        public show:boolean = false;
        public fontColor: string = "#212121"
        public fontSize: number = 11;
        public fontFamily: string = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
        public labelDisplayUnits: number = 0;
        public labelPrecision: number = undefined;
        public axisTextProperties: TextProperties = {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize + "px"
        };
    }
}