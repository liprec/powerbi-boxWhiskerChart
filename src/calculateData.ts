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

import { BoxPlot, BoxPlotSeries, BoxWhiskerChartData, DataPoint, Outlier } from "./data";
import { ChartOrientation, TraceEvents } from "./enums";
import { PerfTimer } from "./perfTimer";
import { Settings } from "./settings";

export function calculateData(data: BoxWhiskerChartData, settings: Settings): void {
    const timer = PerfTimer.START(TraceEvents.calculateData, true);

    const subCategoryBandwidth = settings.general.scales.subCategoryScale.bandwidth();

    data.series.forEach((series: BoxPlotSeries) => {
        series.boxPlots.forEach((boxPlot: BoxPlot) => {
            if (!boxPlot.dataPoint) {
                const subCategoryX = settings.general.scales.subCategoryScale(
                    settings.general.hasSeries ? series.name : <string>settings.xAxis.defaultTitle
                );
                boxPlot.dataPoint = <DataPoint>{
                    start: <number>subCategoryX + <number>settings.general.scales.categoryScale(boxPlot.name),
                    middle:
                        <number>subCategoryX +
                        <number>settings.general.scales.categoryScale(boxPlot.name) +
                        subCategoryBandwidth / 2,
                    end:
                        <number>subCategoryX +
                        <number>settings.general.scales.categoryScale(boxPlot.name) +
                        subCategoryBandwidth,
                    min: settings.general.scales.valueScale(boxPlot.boxValues.min),
                    q1: settings.general.scales.valueScale(boxPlot.boxValues.quartile1),
                    q3: settings.general.scales.valueScale(boxPlot.boxValues.quartile3),
                    max: settings.general.scales.valueScale(boxPlot.boxValues.max),
                    median: settings.general.scales.valueScale(boxPlot.boxValues.median),
                    mean: settings.general.scales.valueScale(boxPlot.boxValues.mean),
                    r: settings.shapes.dotRadius,
                    horizontal: settings.general.orientation === ChartOrientation.Horizontal,
                };

                boxPlot.outliers.forEach((outlier: Outlier) => {
                    outlier.dataPoint = {
                        value: settings.general.scales.valueScale(outlier.value),
                        middle: <number>boxPlot.dataPoint?.middle,
                        r: settings.shapes.outlierRadius,
                        horizontal: <boolean>boxPlot.dataPoint?.horizontal,
                    };
                    outlier.key =
                        <number>outlier.dataPoint?.value +
                        <number>outlier.dataPoint?.middle +
                        <number>outlier.dataPoint?.r +
                        (outlier.dataPoint?.horizontal ? 1 : 0) +
                        hexToColorInt(outlier.color);
                });
            }
        });
        series.key = series.boxPlots
            .map((boxPlot: BoxPlot, index: number) => {
                boxPlot.key =
                    <number>boxPlot.dataPoint?.start +
                    <number>boxPlot.dataPoint?.middle +
                    <number>boxPlot.dataPoint?.end +
                    <number>boxPlot.dataPoint?.min +
                    <number>boxPlot.dataPoint?.q1 +
                    <number>boxPlot.dataPoint?.q3 +
                    <number>boxPlot.dataPoint?.max +
                    <number>boxPlot.dataPoint?.median +
                    <number>boxPlot.dataPoint?.mean +
                    (boxPlot.dataPoint?.horizontal ? 1 : 0) +
                    (boxPlot.isHighlight ? index + 1 : 0) +
                    hexToColorInt(boxPlot.color) +
                    settings.shapes.dotRadius +
                    (settings.shapes.showMean ? 1 : 0) +
                    (settings.shapes.showMedian ? 1 : 0) +
                    hexToColorInt(settings.dataPoint.meanColor) +
                    hexToColorInt(settings.dataPoint.medianColor) +
                    settings.chartOptions.margin +
                    settings.chartOptions.internalMargin +
                    boxPlot.outliers.reduce((a, b) => a + b.key, 0);
                return boxPlot.key;
            })
            .reduce((a, b) => a + b);
    });

    timer();
}

function hexToColorInt(rrggbb: string): number {
    const offset = rrggbb.charAt(0) === "#" ? 1 : 0;
    const bbggrr = rrggbb.substring(4 + offset, 2) + rrggbb.substring(2 + offset, 2) + rrggbb.substring(0 + offset, 2);
    return parseInt(bbggrr, 16);
}
