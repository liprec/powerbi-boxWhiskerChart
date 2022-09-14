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

export interface BaseValues {
    max: number;
    min: number;
    average: number;
    median: number;
    total: number;
    quartile1: number;
    quartile3: number;
    quartileCorrection: number[];
}

export interface BoxValues {
    IQR?: number;
    minValue: number;
    maxValue: number;
    minValueLabel: string;
    maxValueLabel: string;
    quartileValue: string;
    whiskerValue: string;
}

export interface BoxWhiskerChartData {
    boxPlots: BoxPlot[];
    referenceLines?: ReferenceLine[];
    dataRange: number[];
    settings: Settings;
}

export interface BoxPlot {
    name: string;
    parent?: string;
    dataPoint?: Datapoint;
    dataPointHightlight?: Datapoint;
    selectionId: ISelectionId;
}

export interface Datapoint {
    average: number;
    color?: string;
    dataLabels: DataLabel[];
    fillColor?: string;
    label?: string;
    max: number;
    median: number;
    min: number;
    outliers: Outlier[];
    quartile1: number;
    quartile3: number;
    samples: number;
    tooltip?: () => VisualTooltipDataItem[];
}

export interface Outlier {
    category: number;
    color?: string;
    value: number;
    highlight: boolean;
    selectionId: ISelectionId;
    tooltip?: () => VisualTooltipDataItem[];
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

export interface Scales {
    categoryScale: ScaleBand<string>;
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
