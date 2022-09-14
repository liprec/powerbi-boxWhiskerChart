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
import { Selection } from "d3-selection";
import { ScaleLinear } from "d3-scale";

import { ReferenceLine } from "./enums";

import DataViewObject = powerbi.DataViewObject;
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

export interface BoxWhiskerChartConstructorOptions {
    svg?: Selection<any, any, any, any>;
    margin?: IMargin;
}

export interface IBoxWhiskerChartDatapoint {
    min: number;
    max: number;
    median: number;
    quartile1: number;
    quartile3: number;
    average: number;
    samples: number;
    category: number;
    color?: string;
    fillColor?: string;
    label?: string;
    highlight: boolean;
    outliers: IBoxWhiskerChartOutlier[];
    dataLabels: IBoxWhiskerDataLabel[];
    selectionId: ISelectionId;
    tooltipInfo?: VisualTooltipDataItem[];
    x: number;
    y: number;
}

export interface IBoxWhiskerChartOutlier {
    category: number;
    color?: string;
    value: number;
    highlight: boolean;
    selectionId: ISelectionId;
    tooltipInfo?: VisualTooltipDataItem[];
}

export interface IBoxWhiskerChartReferenceLine extends DataViewObject {
    selector: ISelectionId;
    type: string;
    show: boolean;
    displayName: string;
    value: number;
    lineColor: string;
    transparency: number;
    style: ReferenceLine.Style;
    position: ReferenceLine.Position;
    showLabel: boolean;
    labelColor: string;
    labelFontSize: number;
    labelFontFamily: string;
    labelType: ReferenceLine.LabelType;
    hPosition: ReferenceLine.HPosition;
    vPosition: ReferenceLine.VPosition;
    labelDisplayUnits: number;
    labelPrecision: number;
    x: number;
    y: number;
}

export interface IBoxWhiskerChartData {
    dataPoints: IBoxWhiskerChartDatapoint[][];
    dataPointLength: number;
    categories: string[];
    isHighLighted: boolean;
    referenceLines: IBoxWhiskerChartReferenceLine[];
}

export interface IBoxWhiskerDataLabel {
    value: number;
    y: number;
    x: number;
    visible: number;
}

export interface IBoxWhiskerAxisOptions {
    max: number;
    min: number;
    ticks: number;
    tickSize: number;
}

export interface IBoxWhiskerAxisSettings {
    axisScaleCategory: ScaleLinear<number, number>;
    axisCategoryHeight: number;
    axisCategoryWidth: number;
    axisLabelSizeCategory: number;
    axisAngleCategory: number;
    axisValueHeight: number;
    axisValueWidth: number;
    axisLabelSizeValue: number;
    axisScaleValue: ScaleLinear<number, number>;
    axisOptions: IBoxWhiskerAxisOptions;
    drawScaleCategory: ScaleLinear<number, number>;
    drawScaleValue: ScaleLinear<number, number>;
}


// rebuild
export interface BoxWhiskerChartDataSerie {
    dataPoints: IBoxWhiskerChartDatapoint[];
    referenceLines?: IBoxWhiskerChartReferenceLine[];
}
export interface BoxWhiskerChartModel {
    series: BoxWhiskerChartDataSerie[];
    seriesMax: number;
}