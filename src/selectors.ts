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
import { CssConstants } from "powerbi-visuals-utils-svgutils";

import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;

export module BoxWhiskerCssConstants {
    export const Visual: ClassAndSelector = createClassAndSelector("boxWhiskerChart");

    export const Text: ClassAndSelector = createClassAndSelector("text");
    export const WarningText: ClassAndSelector = createClassAndSelector("warning");
    export const InfoText: ClassAndSelector = createClassAndSelector("info");

    export const Axis: ClassAndSelector = createClassAndSelector("axis");
    export const AxisX: ClassAndSelector = createClassAndSelector("axisX");
    export const AxisY: ClassAndSelector = createClassAndSelector("axisY");
    export const AxisXLabel: ClassAndSelector = createClassAndSelector("axisXLabel");
    export const AxisYLabel: ClassAndSelector = createClassAndSelector("axisYLabel");
    export const AxisMajorGrid: ClassAndSelector = createClassAndSelector("axisMajorGrid");
    export const AxisMinorGrid: ClassAndSelector = createClassAndSelector("axisMinorGrid");
    export const ChartMain: ClassAndSelector = createClassAndSelector("chartMain");
    export const Chart: ClassAndSelector = createClassAndSelector("chart");
    export const ChartNode: ClassAndSelector = createClassAndSelector("chartNode");
    export const ChartNodeOutliers: ClassAndSelector = createClassAndSelector("chartNodeOutliers");
    export const ChartNodeHighLight: ClassAndSelector = createClassAndSelector("chartNodeHighLight");
    export const ChartQuartileBox: ClassAndSelector = createClassAndSelector("chartQuartileBox");
    export const ChartQuartileBoxHighlight: ClassAndSelector = createClassAndSelector("chartQuartileBoxHighlight");
    export const ChartMedianLine: ClassAndSelector = createClassAndSelector("chartMedianLine");
    export const ChartAverageDot: ClassAndSelector = createClassAndSelector("chartAverageDot");
    export const ChartOutlierDot: ClassAndSelector = createClassAndSelector("chartOutlierDot");
    export const ChartDataLabel: ClassAndSelector = createClassAndSelector("chartDataLabel");
    export const ChartReferenceLineBackNode: ClassAndSelector = createClassAndSelector("chartReferenceLineBackNode");
    export const ChartReferenceLineFrontNode: ClassAndSelector = createClassAndSelector("chartReferenceLineFrontNode");
    export const ChartReferenceLine: ClassAndSelector = createClassAndSelector("chartReferenceLine");
    export const ChartReferenceLineLabel: ClassAndSelector = createClassAndSelector("chartReferenceLineLabel");
}

export class Selectors {
    public static Svg: ClassAndSelector = createClassAndSelector("svg");
    public static PlotArea: ClassAndSelector = createClassAndSelector("plotarea");

    public static Axis: ClassAndSelector = createClassAndSelector("axis");
    public static AxisCategory: ClassAndSelector = createClassAndSelector("axisCategory");
    public static AxisValue: ClassAndSelector = createClassAndSelector("axisValue");
    public static AxisCategoryLabel: ClassAndSelector = createClassAndSelector("axisCategoryLabel");
    public static AxisValueLabel: ClassAndSelector = createClassAndSelector("axisValueLabel");
    public static Grid: ClassAndSelector = createClassAndSelector("grid");

    public static Chart: ClassAndSelector = createClassAndSelector("chart");
    public static LegendArea: ClassAndSelector = createClassAndSelector("legendarea");
    public static LegendBorder: ClassAndSelector = createClassAndSelector("legendborder");
    public static Legend: ClassAndSelector = createClassAndSelector("legend");
    public static LegendItem: ClassAndSelector = createClassAndSelector("legendItem");
    public static Series: ClassAndSelector = createClassAndSelector("series");
    public static SingleSeries: ClassAndSelector = createClassAndSelector("singleSeries");
    public static BoxPlot: ClassAndSelector = createClassAndSelector("boxPlot");
    public static Outliers: ClassAndSelector = createClassAndSelector("outliers");
    public static HighLight: ClassAndSelector = createClassAndSelector("highlight");
    public static Box: ClassAndSelector = createClassAndSelector("box");
    public static BoxHighlight: ClassAndSelector = createClassAndSelector("boxHighlight");
    public static Median: ClassAndSelector = createClassAndSelector("median");
    public static Mean: ClassAndSelector = createClassAndSelector("mean");
    public static Outlier: ClassAndSelector = createClassAndSelector("outlierDot");
    public static DataLabel: ClassAndSelector = createClassAndSelector("dataLabel");
    public static ReferenceLinesBack: ClassAndSelector = createClassAndSelector("referenceLinesBack");
    public static ReferenceLinesFront: ClassAndSelector = createClassAndSelector("referenceLinesFront");
    public static ReferenceLine: ClassAndSelector = createClassAndSelector("referenceLine");
    public static ReferenceLineLabel: ClassAndSelector = createClassAndSelector("referenceLineLabel");

    public static Text: ClassAndSelector = createClassAndSelector("text");
    public static WarningText: ClassAndSelector = createClassAndSelector("warning");
    public static InfoText: ClassAndSelector = createClassAndSelector("info");
}
