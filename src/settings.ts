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

    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;
    // utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    
    export class BoxWhiskerChartSettings extends DataViewObjectsParser {

        public general: GeneralSettings = new GeneralSettings();
        public chartOptions: ChartOptionsSettings = new ChartOptionsSettings();
//        public dataPoint: DataPointSettings = new DataPointSettings();
        public xAxis: XAxisSettings = new XAxisSettings();
        public yAxis: YAxisSettings = new YAxisSettings();
        public gridLines: GridLinesSettings = new GridLinesSettings();
        public labels: LabelsSettings = new LabelsSettings();
    }

    
    class GeneralSettings {
        public formatString: string = "";
        public margin: IMargin = {
            top: 5,
            bottom: 5,
            right: 5,
            left: 5
        };
    }

    class ChartOptionsSettings {
        public whisker: BoxWhiskerEnums.ChartType = BoxWhiskerEnums.ChartType.MinMax;
        public outliers: boolean = false;
        public margin: BoxWhiskerEnums.MarginType = BoxWhiskerEnums.MarginType.Medium;
    }

    // class DataPointSettings {
    //     public fill: string = undefined;
    // }

    class XAxisSettings {
        public fontSize: number = 11;
    }

    class YAxisSettings {
        public fontSize: number = 11;
    }

    class GridLinesSettings {
        public majorGrid: boolean = true;
        public majorGridSize: number = 1;
        public majorGridColor: string = "#666666";
        public minorGrid: boolean = false;
        public minorGridSize: number = 1;
        public minorGridColor: string = "#9c9c9c";
    }

    class LabelsSettings {
        public show:boolean = false;
        public fontSize: number = 11;

    }
}