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

import { scaleBand, min, max, scaleLinear, scaleLog } from "d3";

import { BoxWhiskerChartData, ValueAxisOptions, BoxPlot, BoxPlotSeries } from "./data";
import { Settings } from "./settings";
import { calculateAxisOptions } from "./calculateAxisOptions";
import { ChartOrientation, MarginType, ScaleType, TraceEvents } from "./enums";
import { PerfTimer } from "./perfTimer";

function calculateValues(data: BoxWhiskerChartData, func: (iterable: Iterable<number>) => number | undefined): number {
    return <number>(
        func(
            data.series.map(
                (series: BoxPlotSeries) =>
                    <number>(
                        func(
                            series.boxPlots.map(
                                (boxPlot: BoxPlot) =>
                                    <number>func([boxPlot.boxValues.min, boxPlot.boxValues.mean, boxPlot.boxValues.max])
                            )
                        )
                    )
            )
        )
    );
}

export function calculateScale(data: BoxWhiskerChartData, settings: Settings): void {
    const timer = PerfTimer.START(TraceEvents.calculateScale, true);

    const plotDimensions = settings.general.plotDimensions;
    const valueOptions: ValueAxisOptions = calculateAxisOptions(
        calculateValues(data, min),
        calculateValues(data, max),
        settings.yAxis.start === null ? undefined : settings.yAxis.start,
        settings.yAxis.end === null ? undefined : settings.yAxis.end
    );

    // Correct value Axis start value (linear)
    if (settings.yAxis.start !== null && settings.yAxis.scaleType === ScaleType.Linear) {
        if (settings.yAxis.start !== valueOptions.min) {
            settings.yAxis.start = valueOptions.min;
        }
    }

    // Correct value Axis start value (log)
    if (settings.yAxis.scaleType === ScaleType.Log) {
        if (valueOptions.min <= 0) {
            valueOptions.min = settings.yAxis.start = settings.yAxis.start || 1;
        }
    }

    // Correct value Axis end value
    if (settings.yAxis.end !== null) {
        if (settings.yAxis.end !== valueOptions.max) {
            settings.yAxis.end = valueOptions.max;
        }
    }

    const getChartMargin = (margin: MarginType): number => {
        switch (margin) {
            case MarginType.Large:
                return 0.4;
            case MarginType.Small:
                return 0.1;
            case MarginType.Medium:
            default:
                return 0.2;
        }
    };

    let valueScale;

    let categoryScale = scaleBand()
        .domain(data.categories)
        .paddingInner(getChartMargin(settings.chartOptions.margin))
        .paddingOuter(0.2);

    let subCategoryScale = scaleBand()
        .domain(
            settings.general.hasSeries
                ? data.series.map((series: BoxPlotSeries) => series.name)
                : [<string>settings.xAxis.defaultTitle]
        )
        .paddingInner(settings.general.hasSeries ? getChartMargin(settings.chartOptions.internalMargin) : 0)
        .paddingOuter(0);

    switch (settings.yAxis.scaleType) {
        case ScaleType.Log:
            valueScale = scaleLog().domain([valueOptions.min, valueOptions.max]);
            break;
        case ScaleType.Linear:
        default:
            valueScale = scaleLinear().domain([valueOptions.min, valueOptions.max]);
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

    subCategoryScale = subCategoryScale.range([0, categoryScale.bandwidth()]);
    settings.general.scales = {
        categoryScale: categoryScale.round(true),
        subCategoryScale: subCategoryScale.round(true),
        valueScale,
        valueOptions,
    };

    timer();
}
