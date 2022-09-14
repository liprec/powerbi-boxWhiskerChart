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
import { axisBottom, axisLeft } from "d3-axis";
import { select, Selection } from "d3-selection";

import { Selectors } from "./selectors";
import { Settings } from "./settings";
import { ChartOrientation, LabelOrientation } from "./enums";
import { selectAll } from "d3";

export function drawAxis(
    selection: Selection<any, any, any, any>,
    settings: Settings,
    clickEvent: (event: MouseEvent, deviceName: any) => void
): void {
    const isHorizontal = settings.chartOptions.orientation === ChartOrientation.Horizontal;
    let lastPosition = 0;
    let xAxis = isHorizontal
        ? axisBottom(settings.general.scales.valueScale)
              .ticks(8)
              .tickFormat((val: number) => settings.formatting.valuesFormatter.format(val))
        : axisBottom(settings.general.scales.categoryScale).tickSizeOuter(0).tickSizeInner(0);
    let yAxis = isHorizontal
        ? axisLeft(settings.general.scales.categoryScale).tickSizeOuter(0).tickSizeInner(0)
        : axisLeft(settings.general.scales.valueScale)
              .ticks(8)
              .tickFormat((val: number) => settings.formatting.valuesFormatter.format(val));

    selection
        .select(Selectors.AxisCategory.selectorName)
        .attr("transform", `translate(0, ${settings.general.plotDimensions.y2})`)
        .attr("color", settings.xAxis.fontColor)
        .style("font-family", settings.xAxis.fontFamily)
        .style("font-size", settings.xAxis.FontSize)
        .style("font-weight", settings.xAxis.fontWeight)
        .style("font-style", settings.xAxis.FontStyle)
        .style("opacity", () => (settings.xAxis.show ? "1" : "0"))
        .call(xAxis)
        .selectAll(".tick")
        .on("click", clickEvent)
        .each(function () {
            switch (settings.xAxis.orientation) {
                case LabelOrientation.Vertical:
                    select(this)
                        .select("text")
                        .attr("dy", "0em")
                        .attr("dx", "-0.355em")
                        .style("transform", "rotate(-90deg)")
                        .style("text-anchor", "end");
                    break;
                case LabelOrientation.Diagonal:
                    select(this)
                        .select("text")
                        .attr("dy", "0.355em")
                        .attr("dx", "-0.355em")
                        .style("transform", "rotate(-45deg)")
                        .style("text-anchor", "end");
                    break;
                case LabelOrientation.Horizontal:
                default:
                    select(this)
                        .select("text")
                        .attr("dy", "0.71em")
                        .attr("dx", null)
                        .style("transform", null)
                        .style("text-anchor", null);
                    break;
            }
        })
        .each(function () {
            if (isHorizontal) return;
            const element = <SVGAElement>this;
            const size = element.getBoundingClientRect();
            element.querySelector("text")?.setAttribute("opacity", "1");
            if (size.left < lastPosition) {
                element.querySelector("text")?.setAttribute("opacity", "0");
            } else {
                lastPosition = size.right;
            }
        });

    selection
        .select(Selectors.AxisValue.selectorName)
        .attr("transform", `translate(${settings.general.plotDimensions.x1},0)`)
        .attr("color", settings.yAxis.fontColor)
        .style("font-family", settings.yAxis.fontFamily)
        .style("font-size", settings.yAxis.FontSize)
        .style("font-weight", settings.yAxis.fontWeight)
        .style("font-style", settings.yAxis.FontStyle)
        .style("opacity", () => (settings.yAxis.show ? "1" : "0"))
        .call(yAxis)
        .selectAll(".tick")
        .each(function () {
            if (!isHorizontal) return;
            const element = <SVGAElement>this;
            const size = element.getBoundingClientRect();
            element.querySelector("text")?.setAttribute("opacity", "1");
            if (size.top < lastPosition) {
                element.querySelector("text")?.setAttribute("opacity", "0");
            } else {
                lastPosition = size.bottom;
            }
        });

    if (settings.xAxis.title) selection.select(Selectors.AxisCategoryLabel.selectorName).text(settings.xAxis.title);
}
