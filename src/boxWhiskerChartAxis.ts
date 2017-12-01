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

    // utils.formatting
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;

    // utils.type
    import ValueType = powerbi.extensibility.utils.type.ValueType;

    // d3
    import Selection = d3.Selection;
    
    export function drawAxis(rootElement: Selection<any>, settings: BoxWhiskerChartSettings, dataPoints: BoxWhiskerChartDatapoint[][], yScale: d3.scale.Linear<any, any>) {
        let axisX: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisX.selectorName);
        let axisY: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisY.selectorName);
        let axisXLabel: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisXLabel.selectorName);
        let axisYLabel: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisYLabel.selectorName);
        let axisMajorGrid: Selection<any> = rootElement.select(BoxWhiskerChart.AxisMajorGrid.selectorName);
        let axisMinorGrid: Selection<any> = rootElement.select(BoxWhiskerChart.AxisMinorGrid.selectorName);

        let yAxisLabelHeight = 0;
        let xAxisLabelWidth = 0;
        if (dataPoints.length > 0) {
            yAxisLabelHeight = textMeasurementService.measureSvgTextHeight(
                settings.yAxis.axisTextProperties, 
                settings.formatting.valuesFormatter.format(dataPoints[0][0].label));
        
        
            xAxisLabelWidth = textMeasurementService.measureSvgTextWidth(
                settings.xAxis.axisTextProperties,
                settings.formatting.categoryFormatter.format(settings.axis.axisOptions.max));
        }

        let xs = d3.scale.ordinal();
        // Can we draw at least one X-axis label?
        if (xAxisLabelWidth < (settings.general.viewport.width - settings.general.margin.right - settings.general.margin.left - settings.axis.axisSizeY)) {
            let overSamplingX = 1;
            let visibleDataPoints = dataPoints.filter((d, i) => i % overSamplingX === 0);
            let totalXAxisWidth = d3.max(visibleDataPoints
                .map((d) =>
                    textMeasurementService.measureSvgTextWidth(
                        settings.yAxis.axisTextProperties,
                        d[0].label) + 2 //margin
                )) * visibleDataPoints.length;

            while (totalXAxisWidth > (settings.general.viewport.width - settings.general.margin.right - settings.general.margin.left - settings.axis.axisSizeY)) {
                overSamplingX += 1;
                visibleDataPoints = dataPoints.filter((d, i) => i % overSamplingX === 0);
                totalXAxisWidth = d3.max(visibleDataPoints
                    .map((d) =>
                        textMeasurementService.measureSvgTextWidth(
                            settings.yAxis.axisTextProperties,
                            d[0].label) + 2 //margin
                    )) * visibleDataPoints.length;
            }

            xs.domain(dataPoints.map((values, index) => { return (index % overSamplingX === 0) ? values[0].label : null; })
                .filter((d) => d !== null)
            )
                .rangeBands([settings.general.margin.left + settings.axis.axisSizeY, settings.general.viewport.width - settings.general.margin.right]);
        } else {
            xs.domain([])
                .rangeBands([settings.general.margin.left + settings.axis.axisSizeY, settings.general.viewport.width - settings.general.margin.right]);
        }

        let ys = yScale.range([settings.general.viewport.height - settings.axis.axisSizeX - settings.general.margin.bottom, settings.general.margin.top]);
        let yAxisTicks = settings.axis.axisOptions.ticks;

        if (yAxisLabelHeight < (settings.general.viewport.height - settings.axis.axisSizeX - settings.general.margin.bottom - settings.general.margin.top)) {
            let totalYAxisHeight = yAxisTicks * yAxisLabelHeight;

            // Calculate minimal ticks that fits the height
            while (totalYAxisHeight > settings.general.viewport.height - settings.axis.axisSizeX - settings.general.margin.bottom - settings.general.margin.top) {
                yAxisTicks /= 2;
                totalYAxisHeight = yAxisTicks * yAxisLabelHeight;
            }
        } else {
            yAxisTicks = 0;
        }

        let xAxisTransform =
            settings.axis.axisOptions.min > 0 ?
                ys(settings.axis.axisOptions.min) :
                settings.axis.axisOptions.max < 0 ?
                    ys(settings.axis.axisOptions.min) :
                    ys(0);

        if (settings.xAxis.show) {
            let xAxis = d3.svg.axis()
                .scale(xs)
                .orient("bottom")
                .tickSize(0)
                .innerTickSize(8 + ((settings.general.viewport.height - settings.general.margin.top - settings.axis.axisSizeX) - xAxisTransform));

            axisX
                .attr("transform", "translate(0, " + xAxisTransform + ")")
                .style("opacity", 1)
                .transition()
                .duration(settings.general.duration)
                .call(xAxis);

            axisX
                .selectAll("text")
                .style("fill", settings.xAxis.fontColor)
                .style("font-family", settings.xAxis.fontFamily)                
                .style("font-size", settings.xAxis.fontSize + "px");

            if (settings.xAxis.showTitle) {
                let yTransform = settings.general.viewport.height - settings.general.margin.bottom;
                let labelWidth = textMeasurementService.measureSvgTextWidth(
                    settings.xAxis.titleTextProperties,
                    settings.xAxis.title || settings.xAxis.defaultTitle
                );
                let xTransform;
                switch (settings.xAxis.titleAlignment) {
                    case "left":
                        xTransform = settings.general.margin.left + settings.axis.axisSizeY;
                        break;
                    case "right":
                        xTransform = settings.general.viewport.width - settings.general.margin.left -
                            labelWidth;
                        break;
                    case "center":
                    default:
                        xTransform = (((settings.general.viewport.width - settings.general.margin.left - 
                            settings.general.margin.right - settings.axis.axisSizeY) / 2) +
                            settings.general.margin.left + settings.axis.axisSizeY) -
                            (labelWidth / 2);
                        break;
                }
                axisXLabel
                    .attr("transform", "translate(" + xTransform + ", " + yTransform + ")")
                    .style("opacity", 1)
                    .text(settings.xAxis.title || settings.xAxis.defaultTitle)
                    .style("fill", settings.xAxis.titleFontColor)
                    .style("font-family", settings.xAxis.titleFontFamily)                
                    .style("font-size", settings.xAxis.titleFontSize + "px")
                    .transition()
                    .duration(settings.general.duration);
            } else {
                axisXLabel.style("opacity", 0);
            }
        } else {
            axisX.style("opacity", 0);
            axisXLabel.style("opacity", 0);
        }

        if (settings.yAxis.show) {
            let yAxis = d3.svg.axis()
                .scale(ys)
                .orient("left")
                .tickFormat(d => settings.formatting.valuesFormatter.format(d))
                .ticks(yAxisTicks);

            axisY
                .attr("transform", "translate(" + (settings.axis.axisSizeY + settings.general.margin.left) + ", 0)")
                .style("opacity", 1)
                .transition()
                .duration(settings.general.duration)
                .call(yAxis);

            axisY
                .selectAll("text")
                .style("fill", settings.yAxis.fontColor)
                .style("font-family", settings.yAxis.fontFamily)
                .style("font-size", settings.yAxis.fontSize + "px");

            if (settings.yAxis.showTitle) {
                let xTransform = settings.general.margin.left + (settings.axis.axisLabelSizeY / 2);
                let labelWidth = textMeasurementService.measureSvgTextWidth(
                    settings.yAxis.axisTextProperties,
                    settings.yAxis.title || settings.yAxis.defaultTitle
                );
                let yTransform;
                switch (settings.yAxis.titleAlignment) {
                    case "left":
                        yTransform = settings.general.viewport.height - settings.axis.axisSizeX;
                        break;
                    case "right":
                        yTransform = settings.general.margin.top + labelWidth;
                        break;
                    case "center":
                    default:
                        yTransform = ((settings.general.viewport.height - settings.general.margin.bottom - 
                            settings.general.margin.top - settings.axis.axisSizeX) / 2) +
                            (labelWidth / 2);
                        break;
                }
                axisYLabel
                    .attr("transform", "translate(" + xTransform + ", " + yTransform + ") rotate(-90)")
                    .style("opacity", 1)
                    .text(settings.yAxis.title || settings.yAxis.defaultTitle)
                    .style("fill", settings.yAxis.titleFontColor)
                    .style("font-family", settings.yAxis.titleFontFamily)                
                    .style("font-size", settings.yAxis.titleFontSize + "px")
                    .transition()
                    .duration(settings.general.duration);
            } else {
                axisYLabel.style("opacity", 0);
            }
        } else {
            axisY.style("opacity", 0);
            axisYLabel.style("opacity", 0);
        }

        if (settings.gridLines.show) {
            let yMajorGrid = d3.svg.axis()
                .scale(ys)
                .orient("left")
                .ticks(yAxisTicks)
                .outerTickSize(0)
                .innerTickSize(-(settings.general.viewport.width - settings.axis.axisSizeY - settings.general.margin.right - settings.general.margin.left));

            axisMajorGrid
                .attr("transform", "translate(" + (settings.axis.axisSizeY + settings.general.margin.left) + ", 0)")
                .style("opacity", 1)
                .transition()
                .duration(settings.general.duration)
                .call(yMajorGrid);

            axisMajorGrid
                .selectAll("line")
                .style("stroke", settings.gridLines.majorGridColor)
                .style("stroke-width", settings.gridLines.majorGridSize);

            if (settings.gridLines.minorGrid) {
                let yMinorGrid = d3.svg.axis()
                    .scale(ys)
                    .orient("left")
                    .ticks(yAxisTicks * 5)
                    .outerTickSize(0)
                    .innerTickSize(-(settings.general.viewport.width - settings.axis.axisSizeY - settings.general.margin.right + settings.general.margin.left));

                axisMinorGrid
                    .attr("transform", "translate(" + (settings.axis.axisSizeY + settings.general.margin.left) + ", 0)")
                    .style("opacity", 1)
                    .transition()
                    .duration(settings.general.duration)
                    .call(yMinorGrid);

                axisMinorGrid
                    .selectAll("line")
                    .style("stroke", settings.gridLines.minorGridColor)
                    .style("stroke-width", settings.gridLines.minorGridSize);
            }
            else {

                axisMinorGrid.style("opacity", 0);
            }
        }
        else {
            axisMajorGrid.style("opacity", 0);
            axisMinorGrid.style("opacity", 0);
        }
    }

    export function getAxisOptions(min: number, max: number): BoxWhiskerAxisOptions {
        let min1 = min === 0 ? 0 : min > 0 ? (min * .99) - ((max - min) / 100) : (min * 1.01) - ((max - min) / 100);
        let max1 = max === 0 ? min === 0 ? 1 : 0 : max < 0 ? (max * .99) + ((max - min) / 100) : (max * 1.01) + ((max - min) / 100);

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
        let ticks = ((maxValue - minValue) / tickSize) + 1;

        return {
            tickSize: tickSize,
            max: maxValue,
            min: minValue,
            ticks: ticks,
        };
    }
}