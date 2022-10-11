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

import { interfaces, textMeasurementService, valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { max, min } from "d3";

import measureSvgTextRect = textMeasurementService.measureSvgTextRect;
import TextProperties = interfaces.TextProperties;
import IValueFormatter = valueFormatter.IValueFormatter;

import { BoxWhiskerChartData, BoxPlot, BoxPlotSeries } from "./data";
import { Settings } from "./settings";
import { ChartOrientation, Orientation, TraceEvents } from "./enums";
import { PerfTimer } from "./perfTimer";

function calculateRects(
    data: number[] | string[] | string | null,
    show: boolean,
    textProperties: TextProperties,
    valueFormatter?: IValueFormatter
): { height: number; width: number } {
    const emptyRect = new DOMRect(0, 0, 0, 0);
    const whiteSpaceRect = new DOMRect(0, 0, 10, 10);

    if (Array.isArray(data)) {
        const rects = data.map((nr: number | string) => {
            if (show) {
                textProperties.text = valueFormatter && valueFormatter.format(nr);
                return measureSvgTextRect(textProperties);
            }
            return whiteSpaceRect;
        });

        return {
            height: <number>max(rects.map((rect: DOMRect) => rect.height)),
            width: <number>max(rects.map((rect: DOMRect) => rect.width)),
        };
    }

    textProperties.text = (data || "X") as string;

    const rect = show ? measureSvgTextRect(textProperties) : emptyRect;

    return { height: rect.height, width: rect.width };
}

export function calculateAxis(data: BoxWhiskerChartData, settings: Settings): void {
    const timer = PerfTimer.START(TraceEvents.calculateAxis, true);
    const isHorizontal = settings.chartOptions.orientation === ChartOrientation.Horizontal;

    let { height: valueTextHeight, width: valueTextWidth } = calculateRects(
        data.dataRange,
        settings.yAxis.show,
        settings.yAxis.TextProperties,
        settings.formatting.valuesFormatter
    );
    let { height: categoryTextHeight, width: categoryTextWidth } = calculateRects(
        data.categories,
        settings.xAxis.show,
        settings.xAxis.TextProperties,
        settings.formatting.categoryFormatter
    );

    // Titles
    let { height: valueTitleTextHeight, width: valueTitleTextWidth } = calculateRects(
        settings.yAxis.title,
        settings.yAxis.showTitle,
        settings.yAxis.TitleTextProperties
    );

    let { height: categoryTitleTextHeight, width: categoryTitleTextWidth } = calculateRects(
        settings.xAxis.title,
        settings.xAxis.showTitle,
        settings.xAxis.TitleTextProperties
    );

    switch (settings.xAxis.orientation) {
        case Orientation.Diagonal:
            const sin = Math.sin(Math.PI / 4);
            const cos = Math.cos(Math.PI / 4);
            categoryTextWidth = sin * categoryTextWidth + sin * categoryTextHeight;
            categoryTextHeight = cos * categoryTextWidth + cos * categoryTextHeight;
            break;
        case Orientation.Vertical:
            const tWidth = categoryTextWidth;
            categoryTextWidth = categoryTextHeight + 20;
            categoryTextHeight = tWidth + 20;
            break;
        case Orientation.Horizontal:
        default:
            categoryTextHeight;
            categoryTextWidth = isHorizontal
                ? <number>min([categoryTextWidth, (settings.xAxis.maxArea / 100) * settings.general.width])
                : categoryTextWidth;
            break;
    }

    settings.general.axisDimensions = {
        categoryAxisLabel: { height: categoryTextHeight, width: categoryTextWidth },
        categoryAxisTitle: { height: categoryTitleTextHeight, width: categoryTitleTextWidth },
        valueAxisLabel: { height: valueTextHeight, width: valueTextWidth },
        valueAxisTitle: { height: valueTitleTextHeight, width: valueTitleTextWidth },
    };

    timer();
}
