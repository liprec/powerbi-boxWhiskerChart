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
import powerbi from "powerbi-visuals-api";
import { axisBottom, axisLeft } from "d3-axis";
import { Selection } from "d3-selection";

import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import { BoxWhiskerChartData } from "./data";
import { Selectors } from "./selectors";
import { Settings } from "./settings";
import { syncSelectionState } from "./syncSelectionState";
import { ChartOrientation } from "./enums";
import { Axis } from "d3";

export function drawGridLines(selection: Selection<any, any, any, any>, settings: Settings): void {
    const isHorizontal = settings.chartOptions.orientation === ChartOrientation.Horizontal;
    const plotDimensions = settings.general.plotDimensions;

    selection
        .selectAll(Selectors.Grid.selectorName)
        .data(settings.gridLines.show ? settings.general.scales.valueScale.ticks() : [], () => Math.random()) // tslint:disable-line: insecure-random
        .join(
            (enter) =>
                enter
                    .append("path")
                    .classed(Selectors.Grid.className, true)
                    .attr("d", (n: number) =>
                        isHorizontal
                            ? `M${settings.general.scales.valueScale(n)},${
                                  plotDimensions.y1
                              } L${settings.general.scales.valueScale(n)},${plotDimensions.y2}`
                            : `M${plotDimensions.x1},${settings.general.scales.valueScale(n)} L${
                                  plotDimensions.x2
                              },${settings.general.scales.valueScale(n)}`
                    )
                    .style("stroke", (n: number) =>
                        n === 0 ? settings.gridLines.zeroColor : settings.gridLines.majorGridColor
                    )
                    .style("stroke-width", settings.gridLines.majorGridSize),
            (update) =>
                update
                    .select(Selectors.Grid.selectorName)
                    .attr("d", (n: number) =>
                        isHorizontal
                            ? `M${settings.general.scales.valueScale(n)},${
                                  plotDimensions.y1
                              } L${settings.general.scales.valueScale(n)},${plotDimensions.y2}`
                            : `M${plotDimensions.x1},${settings.general.scales.valueScale(n)} L${
                                  plotDimensions.x2
                              },${settings.general.scales.valueScale(n)}`
                    )
                    .style("stroke", settings.gridLines.majorGridColor)
                    .style("stroke-width", settings.gridLines.majorGridSize),
            (exit) => exit.remove()
        );
}
