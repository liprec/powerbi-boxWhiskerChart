/*
*
* Copyright (c) 2018 Jan Pieter Posthuma / DataScenarios
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

module powerbi.extensibility.visual {

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;
    // utils.type
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;
    // utils.formatting
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;
    // utils.tooltip
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    // d3
    import Selection = d3.Selection;
    import Update = d3.selection.Update;

    export function drawChart(chartElement: Selection<any>, chartSelection: Update<any>, settings: BoxWhiskerChartSettings, selectionManager: ISelectionManager, allowInteractions: boolean, tooltipServiceWrapper: ITooltipServiceWrapper, data: BoxWhiskerChartData, axisSettings: BoxWhiskerAxisSettings): void {
        let dataPoints: BoxWhiskerChartDatapoint[][] = data.dataPoints;
        let highlightOpacity = 1;
        let backgroundOpacity = 0.1;

        let leftBoxMargin: number = 0.1;
        if (!settings.labels.show) {
            switch (settings.chartOptions.margin) {
                case BoxWhiskerEnums.MarginType.Small:
                    leftBoxMargin = 0.05;
                    break;
                case BoxWhiskerEnums.MarginType.Large:
                    leftBoxMargin = 0.2;
                    break;
                case BoxWhiskerEnums.MarginType.Medium:
                default:
                    leftBoxMargin = 0.1;
                    break;
            }
        }

        let fontSize = settings.labels.fontSize + "pt";
        let dataLabelsShow = settings.labels.show;

        let dataLabelwidth = axisSettings.axisScaleCategory.invert(axisSettings.axisScaleCategory(0) +
            (Math.ceil(
                d3.max(dataPoints, (value) => {
                    return d3.max(value, (point) => {
                        return d3.max((point.dataLabels), (dataLabel) => {
                            return textMeasurementService.measureSvgTextWidth(
                                settings.labels.axisTextProperties,
                                settings.formatting.labelFormatter.format(dataLabel.value)
                            );
                        });
                    });
                })
                * 1000) / 1000.)) + leftBoxMargin;

        if (dataLabelwidth > 0.8) {
            dataLabelsShow = false;
        }

        let rightBoxMargin = 1. - (dataLabelsShow && (dataLabelwidth > leftBoxMargin) ? dataLabelwidth : leftBoxMargin);
        let boxMiddle = dataLabelsShow ? leftBoxMargin + ((rightBoxMargin - leftBoxMargin) / 2.) : 0.5;

        let quartileData = (points) => {
            return points.map((value) => {
                let x1 = axisSettings.axisScaleCategory(value.category + leftBoxMargin);
                let x2 = axisSettings.axisScaleCategory(value.category + boxMiddle);
                let x3 = axisSettings.axisScaleCategory(value.category + rightBoxMargin);
                let y1 = axisSettings.axisScaleValue(value.min);
                let y2 = value.samples <= 3 ? axisSettings.axisScaleValue(value.min) : axisSettings.axisScaleValue(value.quartile1);
                let y3 = value.samples <= 3 ? axisSettings.axisScaleValue(value.max) : axisSettings.axisScaleValue(value.quartile3);
                let y4 = axisSettings.axisScaleValue(value.max);
                return `M ${x1},${y1}L${x3},${y1}L${x2},${y1}L${x2},${y2} L${x1},${y2}L${x1},${y3}L${x2},${y3} L${x2},${y4}L${x1},${y4}L${x3},${y4}L${x2},${y4}L${x2},${y3} L${x3},${y3}L${x3},${y2}L${x2},${y2}L${x2},${y1}`;
            }).join(" ");
        };

        let medianData = (points) => {
            return points.map((value) => {
                let x1 = axisSettings.axisScaleCategory(value.category + leftBoxMargin);
                let y1 = axisSettings.axisScaleValue(value.median);
                let x2 = axisSettings.axisScaleCategory(value.category + rightBoxMargin);
                let y2 = axisSettings.axisScaleValue(value.median);
                return `M ${x1},${y1} L${x2},${y2}`;
            }).join(" ");
        };

        let avgData = (points) => {
            return points.map((value) => {
                let x1 = axisSettings.axisScaleCategory(value.category + boxMiddle);
                let y1 = axisSettings.axisScaleValue(value.average);
                let r = settings.shapes.dotRadius;
                let r2 = 2 * r;
                return `M ${x1},${y1} m -${r}, 0 a ${r},${r} 0 1,1 ${r2},0 a ${r},${r} 0 1,1 -${r2},0`;
            }).join(" ");
        };

        let outlierData = (value) => {
                let x1 = axisSettings.axisScaleCategory(value.category + boxMiddle);
                let y1 = axisSettings.axisScaleValue(value.value);
                let r = settings.shapes.dotRadius;
                let r2 = 2 * r;
                return `M ${x1},${y1} m -${r}, 0 a ${r},${r} 0 1,1 ${r2},0 a ${r},${r} 0 1,1 -${r2},0`;
            };

        let quartile: Update<BoxWhiskerChartDatapoint[]> = <Update<BoxWhiskerChartDatapoint[]>>chartSelection.selectAll(BoxWhiskerChart.ChartQuartileBox.selectorName).data(d => {
            if (d && d.length > 0) { return [d]; }
            return [];
        });

        quartile
            .enter()
            .append("path")
            .classed(BoxWhiskerChart.ChartQuartileBox.className, true);

        quartile
            .style("fill", value => (<BoxWhiskerChartDatapoint>value[0]).fillColor)
            .style("stroke", value => (<BoxWhiskerChartDatapoint>value[0]).color)
            .style("stroke-width", 2)
            .on("click", function (d) {
                if (allowInteractions) {
                    let isCtrlPressed: boolean = (d3.event as MouseEvent).ctrlKey;
                    let dataPoint: BoxWhiskerChartDatapoint = <BoxWhiskerChartDatapoint>d[0];
                    let currentSelectedIds = selectionManager.getSelectionIds()[0];
                    if ((dataPoint.selectionId !== currentSelectedIds) && !isCtrlPressed) {
                        selectionManager.clear();
                    }
                    selectionManager
                        .select(dataPoint.selectionId, isCtrlPressed)
                        .then((ids: ISelectionId[]) => {
                            syncSelectionState(chartSelection, ids);
                        });
                    (<Event>d3.event).stopPropagation();
                }
            })
            .transition()
            .duration(settings.general.duration)
            .attr("d", quartileData);

        quartile.exit().remove();

        let average: Update<BoxWhiskerChartDatapoint[]> = <Update<BoxWhiskerChartDatapoint[]>>chartSelection.selectAll(BoxWhiskerChart.ChartAverageDot.selectorName).data(d => {
            if (d && d.length > 0) { return [d]; }
            return [];
        });

        average
            .enter()
            .append("path")
            .classed(BoxWhiskerChart.ChartAverageDot.className, true);

        average
            .style("fill", settings.dataPoint.meanColor)
            .on("click", function (d) {
                if (allowInteractions) {
                    let isCtrlPressed: boolean = (d3.event as MouseEvent).ctrlKey;
                    let dataPoint: BoxWhiskerChartDatapoint = <BoxWhiskerChartDatapoint>d[0];
                    let currentSelectedIds = selectionManager.getSelectionIds()[0];
                    if ((dataPoint.selectionId !== currentSelectedIds) && !isCtrlPressed) {
                        selectionManager.clear();
                    }
                    selectionManager
                        .select(dataPoint.selectionId, isCtrlPressed)
                        .then((ids: ISelectionId[]) => {
                            syncSelectionState(chartSelection, ids);
                        });
                    (<Event>d3.event).stopPropagation();
                }
            })
            .transition()
            .duration(settings.general.duration)
            .attr("d", avgData);

        average.exit().remove();

        let median: Update<BoxWhiskerChartDatapoint[]> = <Update<BoxWhiskerChartDatapoint[]>>chartSelection.selectAll(BoxWhiskerChart.ChartMedianLine.selectorName).data(d => {
            if (d && d.length > 0) { return [d]; }
            return [];
        });

        median
            .enter()
            .append("path")
            .classed(BoxWhiskerChart.ChartMedianLine.className, true);

        median
            .style("stroke", settings.dataPoint.medianColor)
            .style("stroke-width", 2)
            .on("click", function (d) {
                if (allowInteractions) {
                    let isCtrlPressed: boolean = (d3.event as MouseEvent).ctrlKey;
                    let dataPoint: BoxWhiskerChartDatapoint = <BoxWhiskerChartDatapoint>d[0];
                    let currentSelectedIds = selectionManager.getSelectionIds()[0];
                    if ((dataPoint.selectionId !== currentSelectedIds) && !isCtrlPressed) {
                        selectionManager.clear();
                    }
                    selectionManager
                        .select(dataPoint.selectionId, isCtrlPressed)
                        .then((ids: ISelectionId[]) => {
                            syncSelectionState(chartSelection, ids);
                        });
                    (<Event>d3.event).stopPropagation();
                }
            })
            .transition()
            .duration(settings.general.duration)
            .attr("d", medianData);

        median.exit().remove();

        let outliers = chartSelection.selectAll(BoxWhiskerChart.ChartOutlierDot.selectorName).data(d => {
            if (d && d.length > 0) { return (<BoxWhiskerChartDatapoint>d[0]).outliers; }
            return [];
        });

        outliers
            .enter()
            .append("path")
            .classed(BoxWhiskerChart.ChartOutlierDot.className, true);
        outliers
            .style("fill", value => value.color)
            .transition()
            .duration(settings.general.duration)
            .style("opacity", value => value.highlight ? highlightOpacity : backgroundOpacity)
            .attr("d", outlierData);

        outliers.exit().remove();

        let dataLabels = chartSelection.selectAll(BoxWhiskerChart.ChartDataLabel.selectorName).data(d => {
            let dp: BoxWhiskerChartDatapoint = <BoxWhiskerChartDatapoint>d[0];
            if (dataLabelsShow && dp.dataLabels && dp.dataLabels.length > 0) {
                let topLabels = dp.dataLabels
                    .filter((dataLabel) => dataLabel.value >= dp.median) // Higher half of data labels
                    .sort((dataLabel1, dataLabel2) => dataLabel1.value - dataLabel2.value); // Sort: median index 0
                let lowerLabels = dp.dataLabels
                    .filter((dataLabel) => dataLabel.value <= dp.median) // Lower half of data labels
                    .sort((dataLabel1, dataLabel2) => dataLabel2.value - dataLabel1.value); // Sort: median index 0
                let x = axisSettings.axisScaleCategory(dp.category + rightBoxMargin + 0.02);

                topLabels[0].y = axisSettings.axisScaleValue(dp.median) + 3;
                topLabels[0].x = axisSettings.axisScaleCategory(dp.category + rightBoxMargin + 0.02);
                lowerLabels[0].y = axisSettings.axisScaleValue(dp.median) + 3;
                lowerLabels[0].x = axisSettings.axisScaleCategory(dp.category + rightBoxMargin + 0.02);
                if ((topLabels[0].value === dp.median) && (!settings.shapes.showMedian)) { topLabels[0].visible = 0; }

                let adjustment = 0;
                let textHeight = (textMeasurementService.measureSvgTextHeight(
                    settings.labels.axisTextProperties,
                    "X" // Sample text to determine a height
                ) / 2) + 6;

                for (let i = 1; i < topLabels.length; i++) {
                    if ((topLabels[i].value === dp.average) && (!settings.shapes.showMean)) { topLabels[i].visible = 0; }
                    topLabels[i].y = axisSettings.axisScaleValue(topLabels[i].value) + 3;
                    topLabels[i].x = x;
                    let diff = Math.abs((topLabels[i - 1].y) - (topLabels[i].y + adjustment));
                    if (diff < textHeight) {
                        adjustment -= (textHeight - diff);
                    }
                    if (diff >= textHeight) {
                        adjustment = 0;
                    }
                    topLabels[i].y += adjustment;
                }
                adjustment = 0;
                for (let i = 1; i < lowerLabels.length; i++) {
                    if ((lowerLabels[i].value === dp.average) && (!settings.shapes.showMean)) { lowerLabels[i].visible = 0; }
                    lowerLabels[i].y = axisSettings.axisScaleValue(lowerLabels[i].value) + 3;
                    lowerLabels[i].x = x;
                    let diff = Math.abs((lowerLabels[i - 1].y) - (lowerLabels[i].y + adjustment));
                    if (diff < textHeight) {
                        adjustment += (textHeight - diff);
                    }
                    if (diff >= textHeight) {
                        adjustment = 0;
                    }
                    lowerLabels[i].y += adjustment;
                }
                let dataLabels = lowerLabels.concat(topLabels.filter((dataLabel) => dataLabel.value > dp.median)).filter((dataLabel) => dataLabel.x > 0);
                return dataLabels.map((dataPoint) => {
                    return dataPoint;
                });

            }
            return [];
        });

        dataLabels
            .enter()
            .append("text")
            .classed(BoxWhiskerChart.ChartDataLabel.className, true);

        dataLabels
            .transition()
            .duration(settings.general.duration)
            .text(dataLabel => settings.formatting.labelFormatter.format(dataLabel.value))
            .attr("x", dataLabel => dataLabel.x)
            .attr("y", dataLabel => dataLabel.y)
            .attr("fill", settings.labels.fontColor)
            .style("opacity", dataLabel => dataLabel.visible);

        chartElement
            .selectAll("text")
            .style("fill", settings.labels.fontColor)
            .style("font-family", settings.labels.fontFamily)
            .style("font-size", fontSize);

        dataLabels.exit().remove();

        tooltipServiceWrapper.addTooltip(chartSelection.selectAll(BoxWhiskerChart.ChartQuartileBox.selectorName),
            (tooltipEvent: TooltipEventArgs<BoxWhiskerChartDatapoint>) => tooltipEvent.data[0].tooltipInfo,
            (tooltipEvent: TooltipEventArgs<BoxWhiskerChartDatapoint>) => tooltipEvent.data[0].selectionId);

        tooltipServiceWrapper.addTooltip(chartSelection.selectAll(BoxWhiskerChart.ChartMedianLine.selectorName),
            (tooltipEvent: TooltipEventArgs<BoxWhiskerChartDatapoint>) => tooltipEvent.data[0].tooltipInfo,
            (tooltipEvent: TooltipEventArgs<BoxWhiskerChartDatapoint>) => tooltipEvent.data[0].selectionId);

        tooltipServiceWrapper.addTooltip(chartSelection.selectAll(BoxWhiskerChart.ChartAverageDot.selectorName),
            (tooltipEvent: TooltipEventArgs<BoxWhiskerChartDatapoint>) => tooltipEvent.data[0].tooltipInfo,
            (tooltipEvent: TooltipEventArgs<BoxWhiskerChartDatapoint>) => tooltipEvent.data[0].selectionId);

        tooltipServiceWrapper.addTooltip(chartSelection.selectAll(BoxWhiskerChart.ChartOutlierDot.selectorName),
            (tooltipEvent: TooltipEventArgs<BoxWhiskerChartOutlier>) => tooltipEvent.data.tooltipInfo,
            (tooltipEvent: TooltipEventArgs<BoxWhiskerChartOutlier>) => tooltipEvent.data[0].selectionId);
    }

    export function syncSelectionState(selections: d3.Selection<BoxWhiskerChartDatapoint[]>, selectionIds: ISelectionId[]) {
        let highlightOpacity = 1;
        let backgroundOpacity = 0.1;

        if (!selections || !selectionIds) {
            return;
        }

        if (!selectionIds.length) {
            selections
                .style("opacity", datapoint => {
                    const isHighlight: boolean = datapoint[0].highlight;
                    return isHighlight === undefined ? null : isHighlight ? highlightOpacity : backgroundOpacity;
                });
            return;
        }

        selections
            .style("opacity", datapoint => {
                const isSelected: boolean = isSelectionIdInArray(selectionIds, datapoint[0].selectionId);
                return isSelected ? highlightOpacity : backgroundOpacity;
            });
    }

    function isSelectionIdInArray(selectionIds: ISelectionId[], selectionId: ISelectionId): boolean {
        if (!selectionIds || !selectionId) {
            return false;
        }

        return selectionIds.some((currentSelectionId: ISelectionId) => {
            return currentSelectionId.getKey() === selectionId.getKey();
        });
    }

}