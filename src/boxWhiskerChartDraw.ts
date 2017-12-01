/*
*
* Copyright (c) 2017 Jan Pieter Posthuma / DataScenarios
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

    // utils.type
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;
    // utils.formatting
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;
    // d3
    import Selection = d3.Selection;

    export function drawChart(rootElement: Selection<any>, settings: BoxWhiskerChartSettings, selectionManager: ISelectionManager, tooltipServiceWrapper: ITooltipServiceWrapper, dataPoints: BoxWhiskerChartDatapoint[][], xScale: d3.scale.Linear<any, any>, yScale: d3.scale.Linear<any, any>): void {
        let chart: Selection<any> = rootElement.selectAll(BoxWhiskerChart.Chart.selectorName);
        let svg: Selection<any> = rootElement;

        let dotRadius: number = 4,
            leftBoxMargin: number = 0.1;
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

        var stack = d3.layout.stack();
        var layers = stack(dataPoints);

        var selection = chart.selectAll(BoxWhiskerChart.ChartNode.selectorName).data(layers);

        selection
            .enter()
            .append('g')
            .classed(BoxWhiskerChart.ChartNode.className, true);

        var quartile = selection.selectAll(BoxWhiskerChart.ChartQuartileBox.selectorName).data(d => {
            if (d && d.length > 0) { return [d]; }
            return [];
        });

        svg.on('click', () => selectionManager.clear().then(() => quartile.style('opacity', 1)));

        let fontSize = settings.labels.fontSize + "px";
        let dataLabelsShow = settings.labels.show;

        let dataLabelwidth = xScale.invert(xScale(0) +
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
                * 10) / 10.));

        if (dataLabelwidth > 0.8) {
            dataLabelsShow = false;
        }

        let rightBoxMargin = 1. - (dataLabelsShow && (dataLabelwidth > leftBoxMargin) ? dataLabelwidth : leftBoxMargin);
        let boxMiddle = dataLabelsShow ? leftBoxMargin + ((rightBoxMargin - leftBoxMargin) / 2.) : 0.5;

        let quartileData = (points) => {
            return points.map((value) => {
                var x1 = xScale(value.category + leftBoxMargin);
                var x2 = xScale(value.category + boxMiddle);
                var x3 = xScale(value.category + rightBoxMargin);
                var y1 = yScale(value.min);
                var y2 = value.samples <= 3 ? yScale(value.min) : yScale(value.quartile1);
                var y3 = value.samples <= 3 ? yScale(value.max) : yScale(value.quartile3);
                var y4 = yScale(value.max);
                return `M ${x1},${y1}L${x3},${y1}L${x2},${y1}L${x2},${y2} L${x1},${y2}L${x1},${y3}L${x2},${y3} L${x2},${y4}L${x1},${y4}L${x3},${y4}L${x2},${y4}L${x2},${y3} L${x3},${y3}L${x3},${y2}L${x2},${y2}L${x2},${y1}`;
            }).join(' ');
        };

        var medianData = (points) => {
            return points.map((value) => {
                var x1 = xScale(value.category + leftBoxMargin);
                var y1 = yScale(value.median);
                var x2 = xScale(value.category + rightBoxMargin);
                var y2 = yScale(value.median);
                return `M ${x1},${y1} L${x2},${y2}`;
            }).join(' ');
        };

        var avgData = (points) => {
            return points.map((value) => {
                var x1 = xScale(value.category + boxMiddle);
                var y1 = yScale(value.average);
                var r = dotRadius;
                var r2 = 2 * r;
                return `M ${x1},${y1} m -${r}, 0 a ${r},${r} 0 1,1 ${r2},0 a ${r},${r} 0 1,1 -${r2},0`;
            }).join(' ');
        };

        let outlierData = (points) => {
            return points.map((value) => {
                var x1 = xScale(value.category + boxMiddle);
                var y1 = yScale(value.value);
                var r = dotRadius;
                var r2 = 2 * r;
                return `M ${x1},${y1} m -${r}, 0 a ${r},${r} 0 1,1 ${r2},0 a ${r},${r} 0 1,1 -${r2},0`;
            }).join(' ');
        };

        quartile
            .enter()
            .append('path')
            .classed(BoxWhiskerChart.ChartQuartileBox.className, true);

        quartile
            .style('fill', value => (<BoxWhiskerChartDatapoint>value[0]).color)
            .style('opacity', 1)
            .on('click', function (d) {
                let dataPoint:BoxWhiskerChartDatapoint = (<BoxWhiskerChartDatapoint>d[0]);
                selectionManager.select(dataPoint.selectionId).then((ids: ISelectionId[]) => {
                    if (ids.length > 0) {
                        quartile.style('opacity', 0.5);
                        d3.select(this).transition()
                            .duration(settings.general.duration)
                            .style('opacity', 1);
                    } else {
                        quartile.style('opacity', 1);
                    }
                });
                (<Event>d3.event).stopPropagation();
            })
            .style('stroke', value => (<BoxWhiskerChartDatapoint>value[0]).color)
            .style('stroke-width', 2)
            .transition()
            .duration(settings.general.duration)
            .attr('d', quartileData);

        quartile.exit().remove();

        var average = selection.selectAll(BoxWhiskerChart.ChartAverageDot.selectorName).data(d => {
            if (d && d.length > 0) { return [d]; }
            return [];
        });

        average
            .enter()
            .append('path')
            .classed(BoxWhiskerChart.ChartAverageDot.className, true);

        average
            .style('fill', settings.dataPoint.meanColor)
            .style("opacity", d => settings.shapes.showMean ? 1 : 0)
            .transition()
            .duration(settings.general.duration)
            .attr('d', avgData);

        average.exit().remove();

        let median = selection.selectAll(BoxWhiskerChart.ChartMedianLine.selectorName).data(d => {
            if (d && d.length > 0) { return [d]; }
            return [];
        });

        median
            .enter()
            .append('path')
            .classed(BoxWhiskerChart.ChartMedianLine.className, true);

        median
            .style('stroke', settings.dataPoint.medianColor)
            .style('stroke-width', 2)
            .style("opacity", d => settings.shapes.showMedian ? 1 : 0)
            .transition()
            .duration(settings.general.duration)
            .attr('d', medianData);

        median.exit().remove();

        let outliers = selection.selectAll(BoxWhiskerChart.ChartOutlierDot.selectorName).data(d => {
            let dp: BoxWhiskerChartDatapoint = <BoxWhiskerChartDatapoint>d[0];
            if (dp.outliers && dp.outliers.length > 0) { return [dp.outliers]; }
            return [];
        });

        outliers
            .enter()
            .append('path')
            .classed(BoxWhiskerChart.ChartOutlierDot.className, true);

        outliers
            .style('fill', value => (<BoxWhiskerChartOutlier>value[0]).color)
            .transition()
            .duration(settings.general.duration)
            .attr('d', outlierData);

        outliers.exit().remove();

        var dataLabels = selection.selectAll(BoxWhiskerChart.ChartDataLabel.selectorName).data(d => {
            let dp: BoxWhiskerChartDatapoint = <BoxWhiskerChartDatapoint>d[0];
            if (dp.dataLabels && dp.dataLabels.length > 0 && dataLabelsShow) {
                var topLabels = dp.dataLabels
                    .filter((dataLabel) => dataLabel.value >= dp.median) // Higher half of data labels
                    .sort((dataLabel1, dataLabel2) => dataLabel1.value - dataLabel2.value); // Sort: median index 0
                var lowerLabels = dp.dataLabels
                    .filter((dataLabel) => dataLabel.value <= dp.median) // Lower half of data labels
                    .sort((dataLabel1, dataLabel2) => dataLabel2.value - dataLabel1.value); // Sort: median index 0
                    var x = xScale(dp.category + rightBoxMargin + 0.02);

                topLabels[0].y = yScale(dp.median) - 4;
                topLabels[0].x = xScale(dp.category + rightBoxMargin + 0.02);
                lowerLabels[0].y = yScale(dp.median) - 4;
                lowerLabels[0].x = xScale(dp.category + rightBoxMargin + 0.02);
                if ((topLabels[0].value === dp.median) && (!settings.shapes.showMedian)) { topLabels[0].visible = 0}

                var adjustment = 0;
                var textHeight = (textMeasurementService.measureSvgTextHeight(
                    settings.labels.axisTextProperties,
                    "X" // Sample text to determine a height
                ) / 2) + 1;

                for (var i = 1; i < topLabels.length; i++) {
                    if ((topLabels[i].value === dp.average) && (!settings.shapes.showMean)) { topLabels[i].visible = 0}
                    topLabels[i].y = yScale(topLabels[i].value) - 4;
                    topLabels[i].x = x;
                    var diff = Math.abs((topLabels[i].y + adjustment) - (topLabels[i - 1].y));
                    if (diff < textHeight) {
                        adjustment += (textHeight - diff);
                    }
                    topLabels[i].y += adjustment;
                    if (diff >= textHeight) {
                        adjustment = 0;
                    }
                }
                adjustment = 0;
                for (var i = 1; i < lowerLabels.length; i++) {
                    if ((lowerLabels[i].value === dp.average) && (!settings.shapes.showMean)) { lowerLabels[i].visible = 0}
                    lowerLabels[i].y = yScale(lowerLabels[i].value) - 4;
                    lowerLabels[i].x = x;
                    var diff = Math.abs((lowerLabels[i].y + adjustment) - lowerLabels[i - 1].y);
                    if (diff < textHeight) {
                        adjustment -= (textHeight - diff);
                    }
                    lowerLabels[i].y += adjustment;
                    if (diff >= textHeight) {
                        adjustment = 0;
                    }
                }
                var dataLabels = lowerLabels.concat(topLabels.filter((dataLabel) => dataLabel.value > dp.median)).filter((dataLabel) => dataLabel.x > 0);
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

        var y0 = settings.general.viewport.height + settings.axis.axisSizeX;

        dataLabels
            .attr("transform", dataLabel => `translate(0 ${y0}) scale(1, -1)`)
            .transition()
            .duration(settings.general.duration)
            .text(dataLabel => settings.formatting.labelFormatter.format(dataLabel.value))
            .attr("x", dataLabel => dataLabel.x)
            .attr("y", dataLabel => y0 - dataLabel.y)
            .attr("fill", settings.labels.fontColor)
            .style("opacity", dataLabel => dataLabel.visible);

        chart
            .selectAll("text")
            .style("fill", settings.labels.fontColor)
            .style("font-family", settings.labels.fontFamily)
            .style("font-size", fontSize);

        dataLabels.exit().remove();

        tooltipServiceWrapper.addTooltip(svg.selectAll(BoxWhiskerChart.ChartQuartileBox.selectorName),
            (tooltipEvent: TooltipEventArgs<number>) => (<BoxWhiskerChartDatapoint>tooltipEvent.data[0]).tooltipInfo,
            (tooltipEvent: TooltipEventArgs<number>) => null);

        tooltipServiceWrapper.addTooltip(svg.selectAll(BoxWhiskerChart.ChartMedianLine.selectorName),
            (tooltipEvent: TooltipEventArgs<number>) => (<BoxWhiskerChartDatapoint>tooltipEvent.data[0]).tooltipInfo,
            (tooltipEvent: TooltipEventArgs<number>) => null);

        tooltipServiceWrapper.addTooltip(svg.selectAll(BoxWhiskerChart.ChartAverageDot.selectorName),
            (tooltipEvent: TooltipEventArgs<number>) => (<BoxWhiskerChartDatapoint>tooltipEvent.data[0]).tooltipInfo,
            (tooltipEvent: TooltipEventArgs<number>) => null);

        tooltipServiceWrapper.addTooltip(svg.selectAll(BoxWhiskerChart.ChartOutlierDot.selectorName),
            (tooltipEvent: TooltipEventArgs<number>) => (<BoxWhiskerChartOutlier>tooltipEvent.data[0]).tooltipInfo,
            (tooltipEvent: TooltipEventArgs<number>) => null);

        selection.exit().remove();
    }
}