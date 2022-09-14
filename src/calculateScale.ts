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

import { scaleBand, scaleTime, min, max, scaleLinear, scaleLog } from "d3";

import { BoxWhiskerChartData, ValueAxisOptions, BoxPlot } from "./data";
import { Settings } from "./settings";
import { calculateAxisOptions } from "./calculateAxisOptions";
import { ChartOrientation, ScaleType } from "./enums";

export function calculateScale(data: BoxWhiskerChartData, settings: Settings): Settings {
    const plotDimensions = settings.general.plotDimensions;
    const axisOptions: ValueAxisOptions = calculateAxisOptions(
        min(
            data.boxPlots.map((boxPlot: BoxPlot) =>
                min([boxPlot.dataPoint.min, boxPlot.dataPoint.average, boxPlot.dataPoint.median])
            )
        ),
        max(
            data.boxPlots.map((boxPlot: BoxPlot) =>
                max([boxPlot.dataPoint.max, boxPlot.dataPoint.average, boxPlot.dataPoint.median])
            )
        ),
        settings.yAxis.start === null ? undefined : settings.yAxis.start,
        settings.yAxis.end === null ? undefined : settings.yAxis.end
    );

    // Correct value Axis start value (linear)
    if (settings.yAxis.start !== null && settings.yAxis.scaleType === ScaleType.Linear) {
        if (settings.yAxis.start !== axisOptions.min) {
            settings.yAxis.start = axisOptions.min;
        }
    }

    // Correct value Axis start value (log)
    if (settings.yAxis.scaleType === ScaleType.Log) {
        if (axisOptions.min <= 0) {
            axisOptions.min = settings.yAxis.start = settings.yAxis.start || 1;
        }
    }

    // Correct value Axis end value
    if (settings.yAxis.end !== null) {
        if (settings.yAxis.end !== axisOptions.max) {
            settings.yAxis.end = axisOptions.max;
        }
    }

    let categoryScale;
    let valueScale;

    categoryScale = scaleBand()
        .domain(data.boxPlots.map((boxPlot: BoxPlot) => boxPlot.name))
        .paddingInner(0.1)
        .paddingOuter(0.2)
        .align(0.5);

    switch (settings.yAxis.scaleType) {
        case ScaleType.Linear:
            valueScale = scaleLinear().domain([axisOptions.min, axisOptions.max]);
            break;
        case ScaleType.Log:
            valueScale = scaleLog().domain([axisOptions.min, axisOptions.max]);
            break;
    }

    switch (settings.chartOptions.orientation) {
        case ChartOrientation.Horizontal:
            valueScale = valueScale.range([plotDimensions.x1, plotDimensions.x2]);
            categoryScale = categoryScale.range([plotDimensions.y1, plotDimensions.y2]);
            break;
        case ChartOrientation.Vertical:
        default:
            valueScale = valueScale.range([plotDimensions.y2, plotDimensions.y1]);
            categoryScale = categoryScale.range([plotDimensions.x1, plotDimensions.x2]);
            break;
    }

    settings.general.scales = { categoryScale, valueScale };
    return settings;
}
