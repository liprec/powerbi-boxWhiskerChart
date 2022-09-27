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

import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import { max, timeInterval } from "d3";

import measureSvgTextHeight = textMeasurementService.measureSvgTextHeight;

import { BoxWhiskerChartData, Legend } from "./data";
import { Settings } from "./settings";
import { LegendPosition, TraceEvents } from "./enums";
import { PerfTimer } from "./perfTimer";

export function calculatePlot(data: BoxWhiskerChartData, settings: Settings): void {
    //}: Settings {
    const timer = PerfTimer.START(TraceEvents.calculatePlot, true);

    if (settings.legend.show) {
        const textProperties = settings.legend.TextProperties;
        const textHeight = <number>max(
                data.legend.map((l: Legend) => {
                    textProperties.text = settings.formatting.categoryFormatter.format(l.legend);
                    return measureSvgTextHeight(textProperties);
                })
            ) + 20;
        switch (settings.legend.position) {
            case LegendPosition.TopLeft:
            case LegendPosition.TopCenter:
            case LegendPosition.TopRight:
                settings.general.legendDimensions = { topHeight: textHeight, bottomHeight: 0 };
                break;
            case LegendPosition.BottomLeft:
            case LegendPosition.BottomCenter:
            case LegendPosition.BottomRight:
                settings.general.legendDimensions = { topHeight: 0, bottomHeight: textHeight };
                break;
        }
    } else {
        settings.general.legendDimensions = { topHeight: 0, bottomHeight: 0 };
    }

    timer();
}
