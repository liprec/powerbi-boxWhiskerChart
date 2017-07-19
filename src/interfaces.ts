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

    // utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;

    // powerbi.extensibility
    import TooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;    

    // d3
    import Selection = d3.Selection;        
    
    export interface BoxWhiskerChartConstructorOptions {
        svg?: Selection<any>;
        margin?: IMargin;
    }

    export interface BoxWhiskerChartDatapoint {
        min: number;
        max: number;
        median: number;
        quartile1: number;
        quartile3: number;
        average: number;
        samples: number;
        category: number;
        color?: string;
        label?: string;
        outliers: BoxWhiskerChartOutlier[];
        dataLabels: BoxWhiskerDataLabel[];
        selectionId: SelectionId;
        identifyId: powerbi.visuals.ISelectionId;
        tooltipInfo?: TooltipDataItem[];
        x: number;
        y: number;
    }

    export interface BoxWhiskerChartOutlier {
        category: string,
        color?: string,
        value: number
        tooltipInfo?: TooltipDataItem[];
    }

    export interface BoxWhiskerChartReferenceLine extends DataViewObject {
        selector: ISelectionId;
        type: string;       
        show: boolean;
        displayName: string;
        value: number;
        lineColor: string;
        transparency: number;
        style: BoxWhiskerEnums.ReferenceLine.Style;
        position: BoxWhiskerEnums.ReferenceLine.Position;
        showLabel: boolean;
        labelColor: string;
        labelFontSize: number;
        labelFontFamily: string;
        labelType: BoxWhiskerEnums.ReferenceLine.LabelType;
        hPosition: BoxWhiskerEnums.ReferenceLine.HPosition;
        vPosition: BoxWhiskerEnums.ReferenceLine.VPosition;
        labelDisplayUnits: number;
        labelPrecision: number;
        x: number;
        y: number;
    }

    export interface BoxWhiskerChartData {
        dataPoints: BoxWhiskerChartDatapoint[][];
        referenceLines: BoxWhiskerChartReferenceLine[]
    }

    export interface BoxWhiskerDataLabel {
        value: number;
        y: number;
        x: number;
    }

    export interface BoxWhiskerAxisOptions {
        max: number;
        min: number;
        ticks: number;
        tickSize: number;
    }
}