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
import powerbi from "powerbi-visuals-api";
import { ScaleContinuousNumeric, ScaleBand } from "d3-scale";

import { ReferenceLine } from "./enums";
import { Settings } from "./settings";

import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

export interface BoxLabels {
    sampleColumns: string[];
    minValueLabel: string;
    maxValueLabel: string;
    quartileValue: string;
    whiskerValue: string;
}

export interface BoxValues {
    max: number;
    min: number;
    mean: number;
    median: number;
    samples: number;
    total: number;
    quartile1: number;
    quartile3: number;
}

export interface BoxWhiskerChartData {
    categories: string[];
    dataRange: number[];
    legend: Legend[];
    referenceLines?: ReferenceLine[];
    series: BoxPlotSeries[];
    settings: Settings;
}

export interface BoxPlotSeries {
    key: number;
    name: string;
    boxPlots: BoxPlot[];
    selectionId?: ISelectionId;
}

export interface BoxPlot {
    key: number;
    boxLabels: BoxLabels;
    boxValues: BoxValues;
    color: string;
    dataLabels: DataLabel[];
    dataPoint?: DataPoint;
    fillColor: string;
    isHighlight: boolean;
    label?: string;
    legendselectionId?: ISelectionId;
    name: string;
    outliers: Outlier[];
    parent?: string;
    selectionId: ISelectionId;
    seriesSelectionId?: ISelectionId;
    tooltip?: (this: BoxPlot, settings: Settings) => VisualTooltipDataItem[];
}

export interface DataPoint {
    start: number;
    middle: number;
    end: number;
    min: number;
    q1: number;
    q3: number;
    max: number;
    median: number;
    mean: number;
    r: number;
    horizontal: boolean;
}

export interface Legend {
    index: number;
    legend: string;
    color: string;
    selectionId?: ISelectionId;
}

export interface LegendDimensions {
    topHeight?: number;
    bottomHeight?: number;
}

export interface Outlier {
    key: number;
    color: string;
    value: number;
    dataPoint?: OutlierDataPoint;
    isHighlight: boolean;
    selectionId?: ISelectionId;
    tooltip?: () => VisualTooltipDataItem[];
}

export interface OutlierDataPoint {
    value: number;
    middle: number;
    r: number;
    horizontal: boolean;
}

export interface DataLabel {
    value: number;
    visible: number;
}

export interface ReferenceLine {
    displayName: string;
    hPosition: ReferenceLine.HPosition;
    labelColor: string;
    labelDisplayUnits: number;
    labelFontFamily: string;
    labelFontSize: number;
    labelPrecision: number;
    labelType: ReferenceLine.LabelType;
    lineColor: string;
    position: ReferenceLine.Position;
    show: boolean;
    showLabel: boolean;
    style: ReferenceLine.Style;
    tooltip?: () => VisualTooltipDataItem[];
    transparency: number;
    type: string; // tslint:disable-line: no-reserved-keywords
    value: number;
    vPosition: ReferenceLine.VPosition;
    x: number;
    y: number;
}

export interface LookupColor {
    name: string;
    color: string;
}

export interface Scales {
    categoryScale: ScaleBand<string>;
    subCategoryScale: ScaleBand<string>;
    valueScale: ScaleContinuousNumeric<number, number>;
}

export interface AxisDimensions {
    categoryAxisLabel: Dimensions;
    valueAxisLabel: Dimensions;
}

export interface Dimensions {
    height?: number;
    width?: number;
}

export interface PlotDimensions {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

export interface ValueAxisOptions {
    max: number;
    min: number;
    ticks: number;
    tickSize: number;
}
