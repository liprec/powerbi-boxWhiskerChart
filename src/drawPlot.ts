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
import { select } from "d3";
import { BaseType, Selection } from "d3-selection";
import { CssConstants } from "powerbi-visuals-utils-svgutils";

import { BoxPlot, BoxPlotSeries, BoxWhiskerChartData, DataPoint, SinglePoint, SingleDataPoint } from "./data";
import { drawBoxPlot, drawBoxPlotMean, drawBoxPlotMedian, drawBoxPlotPoint } from "./drawBoxPlot";
import { TraceEvents } from "./enums";
import { PerfTimer } from "./perfTimer";
import { Selectors } from "./selectors";
import { Settings } from "./settings";

export function drawPlot(
    selection: Selection<BaseType, unknown, BaseType, unknown>,
    data: BoxWhiskerChartData,
    settings: Settings,
    clickEvent: (event: MouseEvent, boxPlot: BoxPlot) => void
): void {
    const timer = PerfTimer.START(TraceEvents.drawPlot, true);

    selection
        .selectAll(Selectors.SingleSeries.selectorName)
        .data(data.series, (series: BoxPlotSeries) => series.key)
        .join(
            (enter) => enter.append("g").classed(Selectors.SingleSeries.className, true),
            (update) => update.select(Selectors.SingleSeries.selectorName),
            (exit) => exit.remove()
        )
        .selectAll(Selectors.BoxPlot.selectorName)
        .data(
            (series: BoxPlotSeries) => series.boxPlots,
            (boxPlot: BoxPlot) => boxPlot.key
        )
        .join(
            (enter) =>
                enter
                    .append("g")
                    .classed(Selectors.BoxPlot.className, true)
                    .each(function (boxPlot: BoxPlot) {
                        const innerPoints = select(this).append("g").classed(Selectors.InnerPoints.className, true);
                        insertSinglePoints(
                            innerPoints,
                            Selectors.InnerPoint,
                            (boxPlot: BoxPlot) => boxPlot.innerPoints
                        );
                        const mainBox = select(this).append("g").classed(Selectors.MainBox.className, true);
                        mainBox
                            .append("path")
                            .classed(Selectors.Box.className, true)
                            .attr("d", drawBoxPlot(<DataPoint>boxPlot.dataPoint))
                            .attr("fill", boxPlot.fillColor)
                            .style("stroke", boxPlot.color)
                            .style("stroke-width", 2)
                            .style("opacity", boxPlot.isHighlight ? 1 : 0.3);
                        mainBox
                            .append("path")
                            .classed(Selectors.Median.className, true)
                            .attr("d", drawBoxPlotMedian(<DataPoint>boxPlot.dataPoint))
                            .attr("fill", settings.dataPoint.medianColor)
                            .style("stroke", settings.dataPoint.medianColor)
                            .style("stroke-width", 2)
                            .style("opacity", settings.shapes.showMedian ? (boxPlot.isHighlight ? 1 : 0.3) : 0);
                        mainBox
                            .append("path")
                            .classed(Selectors.Mean.className, true)
                            .attr("d", drawBoxPlotMean(<DataPoint>boxPlot.dataPoint))
                            .attr("fill", settings.dataPoint.meanColor)
                            .style("stroke", settings.dataPoint.meanColor)
                            .style("stroke-width", 2)
                            .style("opacity", settings.shapes.showMean ? (boxPlot.isHighlight ? 1 : 0.3) : 0);
                        const outliers = select(this).append("g").classed(Selectors.Outliers.className, true);
                        insertSinglePoints(outliers, Selectors.Outlier, (boxPlot: BoxPlot) => boxPlot.outliers);
                        alignOutliers(
                            select(this).selectAll(Selectors.Outlier.selectorName),
                            settings.shapes.outlierRadius,
                            <boolean>boxPlot.dataPoint?.horizontal
                        );
                        select(this).on("click", clickEvent);
                    }),
            (update) =>
                update.each(function (boxPlot: BoxPlot) {
                    select(this)
                        .select(Selectors.Box.selectorName)
                        .attr("d", drawBoxPlot(<DataPoint>boxPlot.dataPoint))
                        .attr("fill", boxPlot.fillColor)
                        .style("stroke", boxPlot.color)
                        .style("stroke-width", 2)
                        .style("opacity", boxPlot.isHighlight ? 1 : 0.3);
                    select(this)
                        .select(Selectors.Median.selectorName)
                        .attr("d", drawBoxPlotMedian(<DataPoint>boxPlot.dataPoint))
                        .attr("fill", settings.dataPoint.medianColor)
                        .style("stroke", settings.dataPoint.medianColor)
                        .style("stroke-width", 2)
                        .style("opacity", boxPlot.isHighlight ? 1 : 0.3);
                    select(this)
                        .select(Selectors.Median.selectorName)
                        .attr("d", drawBoxPlotMean(<DataPoint>boxPlot.dataPoint))
                        .attr("fill", settings.dataPoint.meanColor)
                        .style("stroke", settings.dataPoint.meanColor)
                        .style("stroke-width", 2)
                        .style("opacity", boxPlot.isHighlight ? 1 : 0.3);
                }),
            (exit) => exit.remove()
        );

    timer();
}

function insertSinglePoints(
    selection: Selection<BaseType, unknown, BaseType, unknown>,
    selector: CssConstants.ClassAndSelector,
    data: (boxPlot: BoxPlot) => SinglePoint[]
): void {
    selection
        .selectAll(selector.selectorName)
        .data(data, (point: SinglePoint) => point.key)
        .join(
            (enter) =>
                enter
                    .append("path")
                    .classed(selector.className, true)
                    .attr("d", (point: SinglePoint) => drawBoxPlotPoint(<SingleDataPoint>point.dataPoint))
                    .attr("fill", (point: SinglePoint) => (point.fill ? point.color : null))
                    .style("stroke", (point: SinglePoint) => point.color)
                    .style("stroke-width", 1)
                    .style("opacity", (point: SinglePoint) => (point.isHighlight ? 1 : 0.3)),
            (update) =>
                update
                    .select(selector.selectorName)
                    .attr("d", (point: SinglePoint) => drawBoxPlotPoint(<SingleDataPoint>point.dataPoint))
                    .attr("fill", (point: SinglePoint) => (point.fill ? point.color : null))
                    .style("stroke", (point: SinglePoint) => point.color)
                    .style("stroke-width", 1)
                    .style("opacity", (point: SinglePoint) => (point.isHighlight ? 1 : 0.3)),
            (exit) => exit.remove()
        );
}

function alignOutliers(selection: Selection<BaseType, unknown, BaseType, unknown>, r: number, horizontal: boolean) {
    let move = 1;
    while (move > 0) {
        move = 0;
        selection.each(function () {
            const _this = this as SVGAElement;
            let thatBox = _this.getBoundingClientRect();
            let that = _this;
            selection.each(function () {
                const _this = this as SVGAElement;
                if (_this !== that) {
                    const thisBox = _this.getBoundingClientRect();
                    const dx = Math.abs(thisBox.left + thisBox.width / 2 - (thatBox.left + thatBox.width / 2));
                    const dy = Math.abs(thisBox.top + thisBox.height / 2 - (thatBox.top + thatBox.height / 2));

                    if (Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) < 2.2 * r) {
                        const step = 2.2 * r - Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                        move = 1;

                        const tt = (_this.transform.baseVal.consolidate() || { matrix: { e: 0, f: 0 } }).matrix;
                        const to = (that.transform.baseVal.consolidate() || { matrix: { e: 0, f: 0 } }).matrix;

                        select(_this).attr(
                            "transform",
                            `translate(${tt.e + (horizontal ? 0 : step)}, ${tt.f + (horizontal ? step : 0)})`
                        );
                        select(that).attr(
                            "transform",
                            `translate(${to.e - (horizontal ? 0 : step)}, ${to.f - (horizontal ? step : 0)})`
                        );
                        thatBox = that.getBoundingClientRect();
                    }
                }
            });
        });
    }
}
