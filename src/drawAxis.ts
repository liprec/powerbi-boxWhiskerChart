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
import { ChartOrientation, LabelOrientation, TraceEvents } from "./enums";
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
                        const x = calculateStep(
                            settings.general.scales.categoryScale,
                            settings.xAxis.labelAlignment,
                            index
                        );
                        const tick = select(this).attr("transform", `translate(${x},0)`);
                        tick.append("text").classed(Selectors.AxisCategoryTickLabel.className, true).text(category);
                        positionLabels(tick, settings.xAxis.orientation, settings.xAxis.labelAlignment);
                    }),
            (update) =>
                update.each(function (category, index) {
                    const x = calculateStep(
                        settings.general.scales.categoryScale,
                        settings.xAxis.labelAlignment,
                        index
                    );
                    const tick = select(this).attr("transform", `translate(${x},0)`);
                    tick.selectAll(Selectors.AxisCategoryTickLabel.className).text(category);
                    positionLabels(tick, settings.xAxis.orientation, settings.xAxis.labelAlignment);
                }),
            (exit) => exit.remove()
        );

    categorySelection
        .select(Selectors.AxisCategoryLabel.selectorName)
        .attr(
            "transform",
            `translate(${calculateAlignmentTitle(
                settings.general.scales.categoryScale,
                settings.xAxis.titleAlignment
            )},0)`
        )
        .attr("fill", settings.xAxis.titleFontColor)
        .attr(
            "dy",
            <number>settings.general.axisDimensions.categoryAxisLabel.height +
                <number>settings.general.axisDimensions.categoryAxisLabel.height * 0.8
        )
        .style("font-family", settings.xAxis.titleFontFamily)
        .style("font-size", settings.xAxis.TitleFontSize)
        .style("font-weight", settings.xAxis.titleFontWeight)
        .style("font-style", settings.xAxis.titleFontStyle)
        .style("opacity", settings.xAxis.showTitle ? 1 : 0)
        .style("text-anchor", getTextAnchor(settings.xAxis.titleAlignment))
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
    //             case LabelOrientation.Vertical:
    //                 select(this)
    //                     .select("text")
    //                     .attr("dy", "0em")
    //                     .attr("dx", "-0.355em")
    //                     .style("transform", "rotate(-90deg)")
    //                     .style("text-anchor", "end");
    //                 break;
    //             case LabelOrientation.Diagonal:
    //                 select(this)
    //                     .select("text")
    //                     .attr("dy", "0.355em")
    //                     .attr("dx", "-0.355em")
    //                     .style("transform", "rotate(-45deg)")
    //                     .style("text-anchor", "end");
    //                 break;
    //             case LabelOrientation.Horizontal:
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
    index: number
): number {
    const step = <number>scale(<string>scale.domain().shift()) + scale.step() * index;

    switch (alignment) {
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

function getTextAnchor(alignment: string): string {
    switch (alignment) {
        case "left":
            return "start";
        case "right":
            return "end";
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
    orientation: LabelOrientation,
    alignment: string
) {
    switch (orientation) {
        case LabelOrientation.Vertical:
            selection
                .select("text")
                .attr("dy", null)
                .attr("dx", null)
                .style("transform", "rotate(-90deg)")
                .style("alignment-baseline", getAlignmentBaseline(alignment))
                .style("text-anchor", "end");
            break;
        case LabelOrientation.Diagonal:
            selection
                .select("text")
                .attr("dy", getdXY(alignment))
                .attr("dx", getdXY(alignment))
                .style("transform", "rotate(-45deg)")
                .style("alignment-baseline", "hanging")
                .style("text-anchor", "end");
            break;
        case LabelOrientation.Horizontal:
        default:
            selection
                .select("text")
                .attr("dy", "0.8em")
                .attr("dx", null)
                .style("transform", null)
                .style("alignment-baseline", "baseline")
                .style("text-anchor", getTextAnchor(alignment));
            break;
    }
}
