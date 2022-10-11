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
import { BaseType, Selection, select } from "d3-selection";

import { Selectors } from "./selectors";
import { Settings } from "./settings";
import { ChartOrientation, Orientation, TraceEvents } from "./enums";
import { BoxWhiskerChartData, Legend } from "./data";
import { ScaleBand, ScaleContinuousNumeric } from "d3-scale";
import { PerfTimer } from "./perfTimer";

export function drawAxis(
    selection: Selection<BaseType, unknown, BaseType, unknown>,
    data: BoxWhiskerChartData,
    settings: Settings,
    clickEvent: (event: MouseEvent) => void
): void {
    const timer = PerfTimer.START(TraceEvents.drawAxis, true);

    const isHorizontal = settings.chartOptions.orientation === ChartOrientation.Horizontal;
    const isXTitleHorizontal = settings.xAxis.titleOrientation === Orientation.Horizontal;

    let lastPosition = 0;

    const categoryAxis = isHorizontal
        ? axisLeft(settings.general.scales.categoryScale)
        : axisBottom(settings.general.scales.categoryScale);

    const categoryAxisX = isHorizontal ? settings.general.plotDimensions.x1 : 0;
    const categoryAxisY = isHorizontal ? 0 : settings.general.plotDimensions.y2;

    const categorySelection = selection.select(Selectors.AxisCategory.selectorName);
    categorySelection
        .attr("transform", `translate(${categoryAxisX}, ${categoryAxisY})`)
        .attr("fill", settings.xAxis.fontColor)
        .style("font-family", settings.xAxis.fontFamily)
        .style("font-size", settings.xAxis.FontSize)
        .style("font-weight", settings.xAxis.fontWeight)
        .style("font-style", settings.xAxis.FontStyle)
        .selectAll(Selectors.AxisCategoryTick.selectorName)
        .data(data.categories)
        .join(
            (enter) =>
                enter
                    .append("g")
                    .classed(Selectors.AxisCategoryTick.className, true)
                    .each(function (category, index) {
                        const step = calculateStep(
                            settings.general.scales.categoryScale,
                            settings.xAxis.labelAlignment,
                            index,
                            isHorizontal
                        );
                        const tick = select(this).attr(
                            "transform",
                            `translate(${isHorizontal ? 0 : step},${isHorizontal ? step : 0})`
                        );
                        tick.append("text").classed(Selectors.AxisCategoryTickLabel.className, true).text(category);
                        positionLabels(tick, settings.xAxis.orientation, settings.xAxis.labelAlignment, isHorizontal);
                    }),
            (update) =>
                update.each(function (category, index) {
                    const step = calculateStep(
                        settings.general.scales.categoryScale,
                        settings.xAxis.labelAlignment,
                        index,
                        isHorizontal
                    );
                    const tick = select(this).attr(
                        "transform",
                        `translate(${isHorizontal ? 0 : step},${isHorizontal ? step : 0})`
                    );
                    tick.selectAll(Selectors.AxisCategoryTickLabel.className).text(category);
                    positionLabels(tick, settings.xAxis.orientation, settings.xAxis.labelAlignment, isHorizontal);
                }),
            (exit) => exit.remove()
        );

    categorySelection.selectAll(Selectors.AxisCategoryTick.selectorName).each(function (label: string) {
        if (!isHorizontal) return;
        select(this).select("text").text(label);
        let size = (<SVGGElement>this).getBoundingClientRect();
        let text = label;
        while (size.width > (settings.xAxis.maxArea / 100) * settings.general.width) {
            text = text.slice(0, -1);
            select(this)
                .select("text")
                .text(text + "...");
            size = (<SVGGElement>this).getBoundingClientRect();
        }
    });

    const xy = calculateAlignmentTitle(
        settings.general.scales.categoryScale,
        isXTitleHorizontal ? "left" : settings.xAxis.titleAlignment
    );
    categorySelection
        .select(Selectors.AxisCategoryLabel.selectorName)
        .attr(
            "transform",
            `translate(${isHorizontal ? 0 : xy},${isHorizontal ? xy : 0}) ${
                isHorizontal && !isXTitleHorizontal ? "rotate(-90)" : ""
            }`
        )
        .attr("fill", settings.xAxis.titleFontColor)
        .attr(
            "dy",
            isHorizontal
                ? isXTitleHorizontal
                    ? -10
                    : -(<number>settings.general.axisDimensions.categoryAxisLabel.width)
                : <number>settings.general.axisDimensions.categoryAxisLabel.height +
                      <number>settings.general.axisDimensions.categoryAxisLabel.height * 0.8
        )
        .attr("dx", isXTitleHorizontal ? -10 : null)
        .style("font-family", settings.xAxis.titleFontFamily)
        .style("font-size", settings.xAxis.TitleFontSize)
        .style("font-weight", settings.xAxis.titleFontWeight)
        .style("font-style", settings.xAxis.titleFontStyle)
        .style("opacity", settings.xAxis.showTitle ? 1 : 0)
        .style("text-anchor", getTextAnchor(isXTitleHorizontal ? "right" : settings.xAxis.titleAlignment, isHorizontal))
        .style("alignment-baseline", isXTitleHorizontal ? "baseline" : "")
        .text(settings.xAxis.title || settings.xAxis.defaultTitle);

    // let xAxis = isHorizontal
    //     ? axisBottom(settings.general.scales.valueScale)
    //           .ticks(8)
    //           .tickFormat((val: number) => settings.formatting.valuesFormatter.format(val))
    //     : axisBottom(settings.general.scales.categoryScale).tickSizeOuter(0).tickSizeInner(0);
    // let yAxis = isHorizontal
    //     ? axisLeft(settings.general.scales.categoryScale).tickSizeOuter(0).tickSizeInner(0)
    //     : axisLeft(settings.general.scales.valueScale)
    //           .ticks(8)
    //           .tickFormat((val: number) => settings.formatting.valuesFormatter.format(val));

    // selection
    //     .select(Selectors.AxisCategory.selectorName)
    //     .attr("transform", `translate(0, ${settings.general.plotDimensions.y2})`)
    //     .attr("color", settings.xAxis.fontColor)
    //     .style("font-family", settings.xAxis.fontFamily)
    //     .style("font-size", settings.xAxis.FontSize)
    //     .style("font-weight", settings.xAxis.fontWeight)
    //     .style("font-style", settings.xAxis.FontStyle)
    //     .style("opacity", () => (settings.xAxis.show ? "1" : "0"))
    //     .call(xAxis)
    //     .selectAll(".tick")
    //     .on("click", clickEvent)
    //     .each(function () {
    //         switch (settings.xAxis.orientation) {
    //             case Orientation.Vertical:
    //                 select(this)
    //                     .select("text")
    //                     .attr("dy", "0em")
    //                     .attr("dx", "-0.355em")
    //                     .style("transform", "rotate(-90deg)")
    //                     .style("text-anchor", "end");
    //                 break;
    //             case Orientation.Diagonal:
    //                 select(this)
    //                     .select("text")
    //                     .attr("dy", "0.355em")
    //                     .attr("dx", "-0.355em")
    //                     .style("transform", "rotate(-45deg)")
    //                     .style("text-anchor", "end");
    //                 break;
    //             case Orientation.Horizontal:
    //             default:
    //                 select(this)
    //                     .select("text")
    //                     .attr("dy", "0.71em")
    //                     .attr("dx", null)
    //                     .style("transform", null)
    //                     .style("text-anchor", null);
    //                 break;
    //         }
    //     })
    //     .each(function () {
    //         if (isHorizontal) return;
    //         const element = <SVGAElement>this;
    //         const size = element.getBoundingClientRect();
    //         element.querySelector("text")?.setAttribute("opacity", "1");
    //         if (size.left < lastPosition) {
    //             element.querySelector("text")?.setAttribute("opacity", "0");
    //         } else {
    //             lastPosition = size.right;
    //         }
    //     });

    // selection
    //     .select(Selectors.AxisValue.selectorName)
    //     .attr("transform", `translate(${settings.general.plotDimensions.x1},0)`)
    //     .attr("color", settings.yAxis.fontColor)
    //     .style("font-family", settings.yAxis.fontFamily)
    //     .style("font-size", settings.yAxis.FontSize)
    //     .style("font-weight", settings.yAxis.fontWeight)
    //     .style("font-style", settings.yAxis.FontStyle)
    //     .style("opacity", () => (settings.yAxis.show ? "1" : "0"))
    //     .call(yAxis)
    //     .selectAll(".tick")
    //     .each(function () {
    //         if (!isHorizontal) return;
    //         const element = <SVGAElement>this;
    //         const size = element.getBoundingClientRect();
    //         element.querySelector("text")?.setAttribute("opacity", "1");
    //         if (size.top < lastPosition) {
    //             element.querySelector("text")?.setAttribute("opacity", "0");
    //         } else {
    //             lastPosition = size.bottom;
    //         }
    //     });

    // if (settings.xAxis.title) selection.select(Selectors.AxisCategoryLabel.selectorName).text(settings.xAxis.title);

    timer();
}

function calculateStep(
    scale: ScaleBand<string>, // | ScaleContinuousNumeric<number, number>,
    alignment: string,
    index: number,
    isHorizontal: boolean
): number {
    const step = <number>scale(<string>scale.domain().shift()) + scale.step() * index;

    switch (isHorizontal ? "center" : alignment) {
        case "left":
            return step;
        case "right":
            return step + scale.bandwidth();
        case "center":
        default:
            return step + scale.bandwidth() / 2;
    }
}

function calculateAlignmentTitle(
    scale: ScaleBand<string>, // | ScaleContinuousNumeric<number, number>,
    alignment: string
): number {
    switch (alignment) {
        case "left":
            return <number>scale(<string>scale.domain().shift());
        case "right":
            return <number>scale(<string>scale.domain().reverse().shift()) + scale.bandwidth();
        case "center":
        default:
            return (
                (<number>scale(<string>scale.domain().shift()) +
                    <number>scale(<string>scale.domain().reverse().shift()) +
                    scale.bandwidth()) /
                2
            );
    }
}

function getTextAnchor(alignment: string, isHorizontal: boolean = false): string {
    switch (alignment) {
        case "left":
            return isHorizontal ? "end" : "start";
        case "right":
            return isHorizontal ? "start" : "end";
        case "center":
        default:
            return "middle";
    }
}

function getAlignmentBaseline(alignment: string): string {
    switch (alignment) {
        case "left":
            return "hanging";
        case "right":
            return "baseline";
        case "center":
        default:
            return "middle";
    }
}

function getdXY(alignment: string): string | null {
    switch (alignment) {
        case "left":
            return null;
        case "right":
            return "-0.38em";
        case "center":
        default:
            return "-0.19em";
    }
}

function positionLabels(
    selection: Selection<BaseType, unknown, BaseType, unknown>,
    orientation: Orientation,
    alignment: string,
    isHorizontal: boolean
) {
    switch (isHorizontal ? Orientation.Horizontal : orientation) {
        case Orientation.Vertical:
            selection
                .select("text")
                .attr("dy", null)
                .attr("dx", null)
                .style("transform", "rotate(-90deg)")
                .style("alignment-baseline", getAlignmentBaseline(alignment))
                .style("text-anchor", "end");
            break;
        case Orientation.Diagonal:
            selection
                .select("text")
                .attr("dy", getdXY(alignment))
                .attr("dx", getdXY(alignment))
                .style("transform", "rotate(-45deg)")
                .style("alignment-baseline", "hanging")
                .style("text-anchor", "end");
            break;
        case Orientation.Horizontal:
        default:
            selection
                .select("text")
                .attr("dy", isHorizontal ? "0.36em" : "0.8em")
                .attr("dx", null)
                .style("transform", null)
                .style("alignment-baseline", "baseline")
                .style("text-anchor", getTextAnchor(isHorizontal ? "right" : alignment));
            break;
    }
}
