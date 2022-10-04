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

import { BoxPlot, DataPoint, SingleDataPoint } from "./data";

export function drawBoxPlot(d: DataPoint): string {
    if (d.horizontal)
        return `M${d.min},${d.start}L${d.min},${d.end}L${d.min},${d.middle}L${d.q1},${d.middle} L${d.q1},${d.start}L${d.q3},${d.start}L${d.q3},${d.middle} L${d.max},${d.middle}L${d.max},${d.start}L${d.max},${d.end}L${d.max},${d.middle}L${d.q3},${d.middle} L${d.q3},${d.end}L${d.q1},${d.end}L${d.q1},${d.middle}L${d.min},${d.middle}`;
    return `M${d.start},${d.min}L${d.end},${d.min}L${d.middle},${d.min}L${d.middle},${d.q1} L${d.start},${d.q1}L${d.start},${d.q3}L${d.middle},${d.q3} L${d.middle},${d.max}L${d.start},${d.max}L${d.end},${d.max}L${d.middle},${d.max}L${d.middle},${d.q3} L${d.end},${d.q3}L${d.end},${d.q1}L${d.middle},${d.q1}L${d.middle},${d.min}`;
}

export function drawBoxPlotMean(d: DataPoint): string {
    if (d.horizontal)
        return `M${d.mean},${d.middle}m-${d.r},0a${d.r},${d.r} 0 1,1 ${d.r * 2},0 a${d.r},${d.r} 0 1,1-${d.r * 2},0`;
    return `M${d.middle},${d.mean}m-${d.r},0a${d.r},${d.r} 0 1,1 ${d.r * 2},0 a${d.r},${d.r} 0 1,1-${d.r * 2},0`;
}

export function drawBoxPlotMedian(d: DataPoint): string {
    if (d.horizontal) return `M${d.median},${d.start}L${d.median},${d.end}`;
    return `M${d.start},${d.median}L${d.end},${d.median}`;
}

export function drawBoxPlotPoint(d: SingleDataPoint): string {
    if (d.horizontal)
        return `M${d.value},${d.middle}m-${d.r},0a${d.r},${d.r} 0 1,1 ${d.r * 2},0 a${d.r},${d.r} 0 1,1-${d.r * 2},0`;
    return `M${d.middle},${d.value}m-${d.r},0a${d.r},${d.r} 0 1,1 ${d.r * 2},0 a${d.r},${d.r} 0 1,1-${d.r * 2},0`;
}
