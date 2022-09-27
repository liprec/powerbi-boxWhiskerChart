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

import { ValueAxisOptions } from "./data";

export function calculateAxisOptions(min: number, max: number, fixedMin?: number, fixedMax?: number): ValueAxisOptions {
    let min1 = min === 0 ? 0 : min > 0 ? min * 0.99 - (max - min) / 100 : min * 1.01 - (max - min) / 100;
    let max1 =
        max === 0 ? (min === 0 ? 1 : 0) : max < 0 ? max * 0.99 + (max - min) / 100 : max * 1.01 + (max - min) / 100;

    let p = Math.log(max1 - min1) / Math.log(10);
    let f = Math.pow(10, p - Math.floor(p));

    let scale = 0.2;

    if (f <= 1.2) scale = 0.2;
    else if (f <= 2.5) scale = 0.2;
    else if (f <= 5) scale = 0.5;
    else if (f <= 10) scale = 1;
    else scale = 2;

    let tickSize = scale * Math.pow(10, Math.floor(p));
    let maxValue = tickSize * (Math.floor(max1 / tickSize) + 1);
    let minValue = tickSize * Math.floor(min1 / tickSize);
    let ticks = (maxValue - minValue) / tickSize + 1;

    return {
        tickSize,
        min: fixedMin === undefined ? minValue : fixedMin < max ? fixedMin : minValue,
        max: fixedMax === undefined ? maxValue : fixedMax > min ? fixedMax : maxValue,
        ticks,
    };
}
