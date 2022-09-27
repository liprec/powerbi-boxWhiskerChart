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

import { BaseType } from "d3";
import { Selection, select } from "d3-selection";

import { BoxWhiskerChartData, Legend } from "./data";
import { LegendPosition } from "./enums";
import { Selectors } from "./selectors";
import { Settings } from "./settings";

export function drawLegend(
    selection: Selection<BaseType, unknown, BaseType, unknown>,
    data: BoxWhiskerChartData,
    settings: Settings,
    clickEvent: (event: MouseEvent, legend: Legend) => void
): void {
    let moveX = 0;
    selection
        .selectAll(Selectors.LegendItem.selectorName)
        .data(settings.legend.show ? data.legend : [])
        .join(
            (enter) =>
                enter
                    .append("g")
                    .classed("legendItem", true)
                    .each(function (d) {
                        select(this).append("circle").classed("legendMarker", true).attr("r", 5).style("fill", d.color);
                        select(this)
                            .append("text")
                            .classed("legendText", true)
                            .attr("x", 7.5)
                            .attr("y", 4)
                            .style("alignment-baseline", "baseline")
                            .text(d.legend)
                            .style("fill", settings.legend.fontColor)
                            .style("font-family", settings.legend.fontFamily)
                            .style("font-size", settings.legend.FontSize)
                            .style("font-style", settings.legend.FontStyle)
                            .style("font-weight", settings.legend.fontWeight);
                        select(this).on("click", clickEvent);
                    }),
            (update) =>
                update.classed("hidden", !settings.legend.show).each(function (d) {
                    select(this).selectAll(".legendMarker").style("fill", d.color);
                    select(this)
                        .selectAll(".legendText")
                        .text(d.legend)
                        .style("fill", settings.legend.fontColor)
                        .style("font-family", settings.legend.fontFamily)
                        .style("font-size", settings.legend.FontSize)
                        .style("font-style", settings.legend.FontStyle)
                        .style("font-weight", settings.legend.fontWeight);
                }),
            (exit) => exit.remove()
        );

    selection.selectAll(Selectors.LegendItem.selectorName).each(function () {
        const size = (<SVGGElement>this).getBoundingClientRect();
        select(this).attr("transform", `translate(${moveX} 0)`);
        moveX += size.width + 5;
    });

    selection.attr("transform", function () {
        const size = <DOMRect>(<SVGGElement>this).getBoundingClientRect();
        const centerX = settings.general.width * 0.5;
        switch (settings.legend.position) {
            case LegendPosition.BottomLeft:
                return `translate(10, ${settings.general.height - size.height})`;
            case LegendPosition.BottomRight:
                return `translate(${
                    settings.general.width - size.width - 10
                }, ${settings.general.height - size.height})`;
            case LegendPosition.BottomCenter:
                return `translate(${centerX - size.width / 2}, ${settings.general.height - size.height})`;
            case LegendPosition.TopRight:
                return `translate(${settings.general.width - size.width - 10}, ${size.height})`;
            case LegendPosition.TopCenter:
                return `translate(${centerX - size.width / 2}, ${size.height})`;
            case LegendPosition.TopLeft:
            default:
                return `translate(10, ${size.height})`;
        }
    });
}
