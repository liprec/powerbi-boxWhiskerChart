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
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    // d3
    import Selection = d3.Selection;
    
    export function calcAxisSettings(settings: BoxWhiskerChartSettings, data: BoxWhiskerChartData): BoxWhiskerAxisSettings {
        let axisSettings: BoxWhiskerAxisSettings = {
            axisScaleCategory: undefined,
            axisSizeCategory: 0,
            axisLabelSizeCategory: 0,
            axisAngleCategory: 0,
            axisSizeValue: 0,
            axisLabelSizeValue: 0,
            axisScaleValue: undefined,
            axisOptions: {
                max:0,
                min: 0,
                ticks: 0,
                tickSize: 0
            }
        }
        let sin, cos, tan;

        switch(settings.xAxis.orientation) {
            case BoxWhiskerEnums.LabelOrientation.Vertical:
                axisSettings.axisAngleCategory = 90;
                break;
            case BoxWhiskerEnums.LabelOrientation.Diagonal:
            axisSettings.axisAngleCategory = 45;
                break;
            case BoxWhiskerEnums.LabelOrientation.Horizontal:
            default:
            axisSettings.axisAngleCategory = 0;
        }
        sin = Math.sin(axisSettings.axisAngleCategory * (Math.PI/180));
        cos = Math.cos(axisSettings.axisAngleCategory * (Math.PI/180));
        tan = Math.tan(axisSettings.axisAngleCategory * (Math.PI/180));

        // Caclulate optimum min/max of value axis 
        let stack = d3.layout.stack();
        let layers = stack(data.dataPoints);
        let refLines = data.referenceLines;
        axisSettings.axisOptions = getAxisOptions(
            d3.min([
                d3.min(refLines, (refLine: BoxWhiskerChartReferenceLine) => refLine.value),
                d3.min(layers, (layer) => {
                    return d3.min(layer, (point) => {
                        return  d3.min([(<BoxWhiskerChartDatapoint>point).min, 
                                d3.min((<BoxWhiskerChartDatapoint>point).outliers, (outlier) => outlier.value)]);
                    });
                })
            ]),
            d3.max([
                d3.max(refLines, (refLine: BoxWhiskerChartReferenceLine) => refLine.value),
                d3.max(layers, (layer) => {
                    return d3.max(layer, (point) => {
                        return  d3.max([(<BoxWhiskerChartDatapoint>point).max, 
                                d3.max((<BoxWhiskerChartDatapoint>point).outliers, (outlier) => outlier.value)]);
                    });
                })
            ])
        );

        if (data.dataPointLength > 0) {
            // calculate AxisSizeX, AxisSizeY
            if (settings.xAxis.show) { // Show category axis
                axisSettings.axisSizeCategory = d3.max(data.categories.map((category: string) => {
                    let size1 = cos * textMeasurementService.measureSvgTextHeight(
                        settings.xAxis.axisTextProperties,
                        category);
                    let size2 = sin * textMeasurementService.measureSvgTextWidth(
                        settings.xAxis.axisTextProperties,
                        category);
                    return size1 + size2 + 10; // Axis width/margin itself;
                }));
                if (settings.xAxis.showTitle) {
                    axisSettings.axisLabelSizeCategory = textMeasurementService.measureSvgTextHeight(
                        settings.xAxis.titleTextProperties,
                        settings.formatting.categoryFormatter.format(settings.xAxis.title || settings.xAxis.defaultTitle)
                    );
                    axisSettings.axisSizeCategory += axisSettings.axisLabelSizeCategory;
                }
            }
        
            if (settings.yAxis.show) { // Show value azis
                for (let i = axisSettings.axisOptions.min; i < axisSettings.axisOptions.max; i += axisSettings.axisOptions.tickSize) {
                    let tempSize = textMeasurementService.measureSvgTextWidth(
                        settings.yAxis.axisTextProperties,
                        settings.formatting.valuesFormatter.format(i));
                        axisSettings.axisSizeValue = tempSize > axisSettings.axisSizeValue ? tempSize : axisSettings.axisSizeValue
                }
                axisSettings.axisSizeValue += 10; // Axis width itself

                if (settings.yAxis.showTitle) {
                    axisSettings.axisLabelSizeValue = textMeasurementService.measureSvgTextHeight(
                        settings.yAxis.titleTextProperties,
                        settings.formatting.valuesFormatter.format(settings.yAxis.title || settings.yAxis.defaultTitle)
                    );
                    axisSettings.axisSizeValue += axisSettings.axisLabelSizeValue;
                }
            }
        }

        axisSettings.axisScaleValue = d3.scale.linear()
            .domain([axisSettings.axisOptions.min || 0, axisSettings.axisOptions.max || 0])
            .range([settings.general.margin.bottom + axisSettings.axisSizeCategory, settings.general.viewport.height - settings.general.margin.top]);

        axisSettings.axisScaleCategory = d3.scale.linear()
            .domain([0, data.dataPointLength])
            .range([settings.general.margin.left + axisSettings.axisSizeValue, settings.general.viewport.width - settings.general.margin.right]);

        return axisSettings
    }

    export function drawAxis(rootElement: Selection<any>, settings: BoxWhiskerChartSettings, data: BoxWhiskerChartData, axisSettings: BoxWhiskerAxisSettings) {
        let axisCategory: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisX.selectorName);
        let axisValue: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisY.selectorName);
        let axisCategoryLabel: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisXLabel.selectorName);
        let axisValueLabel: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisYLabel.selectorName);
        let axisMajorGrid: Selection<any> = rootElement.select(BoxWhiskerChart.AxisMajorGrid.selectorName);
        let axisMinorGrid: Selection<any> = rootElement.select(BoxWhiskerChart.AxisMinorGrid.selectorName);
        let valueAxisLabelHeight = 0;
        let categoryAxisLabelWidth = 0;

        if (data.dataPoints.length > 0) {
            valueAxisLabelHeight = textMeasurementService.measureSvgTextHeight(
                settings.yAxis.axisTextProperties, 
                settings.formatting.valuesFormatter.format(data.dataPoints[0][0].label));
        
            categoryAxisLabelWidth = textMeasurementService.measureSvgTextWidth(
                settings.xAxis.axisTextProperties,
                settings.formatting.categoryFormatter.format(axisSettings.axisOptions.max));
        }

        let xs = d3.scale.ordinal();
        // Can we draw at least one X-axis label?
        if (categoryAxisLabelWidth < (settings.general.viewport.width - settings.general.margin.right - settings.general.margin.left - axisSettings.axisSizeValue)) {
            let overSamplingX = 1;
            let visibleDataPoints = data.categories.filter((category, i) => i % overSamplingX === 0);
            let totalXAxisWidth = d3.max(visibleDataPoints
                .map((category) =>
                    textMeasurementService.measureSvgTextWidth(
                        settings.yAxis.axisTextProperties,
                        category) + 2 //margin
                )) * visibleDataPoints.length;

            while (totalXAxisWidth > (settings.general.viewport.width - settings.general.margin.right - settings.general.margin.left - axisSettings.axisSizeValue)) {
                overSamplingX += 1;
                visibleDataPoints = data.categories.filter((category, i) => i % overSamplingX === 0);
                totalXAxisWidth = d3.max(visibleDataPoints
                    .map((category) =>
                        textMeasurementService.measureSvgTextWidth(
                            settings.yAxis.axisTextProperties,
                            category) + 2 //margin
                    )) * visibleDataPoints.length;
            }

            xs.domain(data.categories.map((category, index) => { return (index % overSamplingX === 0) ? category : null; })
                .filter((d) => d !== null)
            )
                .rangeBands([settings.general.margin.left + axisSettings.axisSizeValue, settings.general.viewport.width - settings.general.margin.right]);
        } else {
            xs.domain([])
                .rangeBands([settings.general.margin.left + axisSettings.axisSizeValue, settings.general.viewport.width - settings.general.margin.right]);
        }

        let ys = axisSettings.axisScaleValue.range([settings.general.viewport.height - axisSettings.axisSizeCategory - settings.general.margin.bottom, settings.general.margin.top]);
        let yAxisTicks = axisSettings.axisOptions.ticks;

        if (valueAxisLabelHeight < (settings.general.viewport.height - axisSettings.axisSizeCategory - settings.general.margin.bottom - settings.general.margin.top)) {
            let totalYAxisHeight = yAxisTicks * valueAxisLabelHeight;

            // Calculate minimal ticks that fits the height
            while (totalYAxisHeight > settings.general.viewport.height - axisSettings.axisSizeCategory - settings.general.margin.bottom - settings.general.margin.top) {
                yAxisTicks /= 2;
                totalYAxisHeight = yAxisTicks * valueAxisLabelHeight;
            }
        } else {
            yAxisTicks = 0;
        }

        let xAxisTransform =
            axisSettings.axisOptions.min > 0 ?
                ys(axisSettings.axisOptions.min) :
                axisSettings.axisOptions.max < 0 ?
                    ys(axisSettings.axisOptions.min) :
                    ys(0);

        if (settings.xAxis.show) {
            let categoryAxis = d3.svg.axis()
                .scale(xs)
                .orient("bottom")
                .tickSize(0)
                .innerTickSize(8 + ((settings.general.viewport.height - settings.general.margin.top - axisSettings.axisSizeCategory) - xAxisTransform));

            axisCategory
                .attr("transform", "translate(0, " + xAxisTransform + ")")
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 1)
                .call(categoryAxis);

            axisCategory
                .selectAll("text")
                .style("fill", settings.xAxis.fontColor)
                .style("font-family", settings.xAxis.fontFamily)                
                .style("font-size", settings.xAxis.fontSize + "pt")
                .style("text-anchor", axisSettings.axisAngleCategory === BoxWhiskerEnums.LabelOrientation.Horizontal ? "middle" : "end")
                .attr("dx", (d) => {
                    return (-0.0044 * axisSettings.axisAngleCategory) + "em"
                })
                .attr("dy", (d) => {
                    return ((-0.0083 * axisSettings.axisAngleCategory) + 0.75) + "em"
                })
                .attr("transform", function(d) {
                    return `rotate(-${axisSettings.axisAngleCategory})` 
                });
            
            if (settings.xAxis.showTitle) {
                let yTransform = settings.general.viewport.height - settings.general.margin.bottom;
                let labelWidth = textMeasurementService.measureSvgTextWidth(
                    settings.xAxis.titleTextProperties,
                    settings.xAxis.title || settings.xAxis.defaultTitle
                );
                let xTransform;
                switch (settings.xAxis.titleAlignment) {
                    case "left":
                        xTransform = settings.general.margin.left + axisSettings.axisSizeValue;
                        break;
                    case "right":
                        xTransform = settings.general.viewport.width - settings.general.margin.left -
                            labelWidth;
                        break;
                    case "center":
                    default:
                        xTransform = (((settings.general.viewport.width - settings.general.margin.left - 
                            settings.general.margin.right - axisSettings.axisSizeValue) / 2) +
                            settings.general.margin.left + axisSettings.axisSizeValue) -
                            (labelWidth / 2);
                        break;
                }
                axisCategoryLabel
                    .attr("transform", "translate(" + xTransform + ", " + yTransform + ")")
                    .transition()
                    .duration(settings.general.duration)
                    .style("opacity", 1)
                    .text(settings.xAxis.title || settings.xAxis.defaultTitle)
                    .style("fill", settings.xAxis.titleFontColor)
                    .style("font-family", settings.xAxis.titleFontFamily)                
                    .style("font-size", settings.xAxis.titleFontSize + "pt")
            } else {
                axisCategoryLabel.transition()
                    .duration(settings.general.duration)
                    .style("opacity", 0);
            }
        } else {
            axisCategory.transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
            axisCategoryLabel.transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
        }

        if (settings.yAxis.show) {
            let valueAxis = d3.svg.axis()
                .scale(ys)
                .orient("left")
                .tickFormat(d => settings.formatting.valuesFormatter.format(d))
                .ticks(yAxisTicks);

            axisValue
                .attr("transform", "translate(" + (axisSettings.axisSizeValue + settings.general.margin.left) + ", 0)")
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 1)
                .call(valueAxis);

            axisValue
                .selectAll("text")
                .transition()
                .duration(settings.general.duration)
                .style("fill", settings.yAxis.fontColor)
                .style("font-family", settings.yAxis.fontFamily)
                .style("font-size", settings.yAxis.fontSize + "pt");

            if (settings.yAxis.showTitle) {
                let xTransform = settings.general.margin.left + (axisSettings.axisLabelSizeValue / 2);
                let labelWidth = textMeasurementService.measureSvgTextWidth(
                    settings.yAxis.axisTextProperties,
                    settings.yAxis.title || settings.yAxis.defaultTitle
                );
                let yTransform;
                switch (settings.yAxis.titleAlignment) {
                    case "left":
                        yTransform = settings.general.viewport.height - axisSettings.axisSizeCategory;
                        break;
                    case "right":
                        yTransform = settings.general.margin.top + labelWidth;
                        break;
                    case "center":
                    default:
                        yTransform = ((settings.general.viewport.height - settings.general.margin.bottom - 
                            settings.general.margin.top - axisSettings.axisSizeCategory) / 2) +
                            (labelWidth / 2);
                        break;
                }
                axisValueLabel
                    .attr("transform", "translate(" + xTransform + ", " + yTransform + ") rotate(-90)")
                    .transition()
                    .duration(settings.general.duration)
                    .style("opacity", 1)
                    .text(settings.yAxis.title || settings.yAxis.defaultTitle)
                    .style("fill", settings.yAxis.titleFontColor)
                    .style("font-family", settings.yAxis.titleFontFamily)                
                    .style("font-size", settings.yAxis.titleFontSize + "pt")
            } else {
                axisValueLabel.transition()
                    .duration(settings.general.duration)
                    .style("opacity", 0);
            }
        } else {
            axisValue.transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
            axisValueLabel.transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
        }

        if (settings.gridLines.show) {
            let yMajorGrid = d3.svg.axis()
                .scale(ys)
                .orient("left")
                .ticks(yAxisTicks)
                .outerTickSize(0)
                .innerTickSize(-(settings.general.viewport.width - axisSettings.axisSizeValue - settings.general.margin.right - settings.general.margin.left));

            axisMajorGrid
                .attr("transform", "translate(" + (axisSettings.axisSizeValue + settings.general.margin.left) + ", 0)")
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 1)
                .call(yMajorGrid);

            axisMajorGrid
                .selectAll("line")
                .transition()
                .duration(settings.general.duration)
                .style("stroke", settings.gridLines.majorGridColor)
                .style("stroke-width", settings.gridLines.majorGridSize);

            if (settings.gridLines.minorGrid) {
                let yMinorGrid = d3.svg.axis()
                    .scale(ys)
                    .orient("left")
                    .ticks(yAxisTicks * 5)
                    .outerTickSize(0)
                    .innerTickSize(-(settings.general.viewport.width - axisSettings.axisSizeValue - settings.general.margin.right + settings.general.margin.left));

                axisMinorGrid
                    .attr("transform", "translate(" + (axisSettings.axisSizeValue + settings.general.margin.left) + ", 0)")
                    .transition()
                    .duration(settings.general.duration)
                    .style("opacity", 1)
                    .call(yMinorGrid);

                axisMinorGrid
                    .selectAll("line")
                    .transition()
                    .duration(settings.general.duration)
                    .style("stroke", settings.gridLines.minorGridColor)
                    .style("stroke-width", settings.gridLines.minorGridSize);
            }
            else {
                axisMinorGrid.transition()
                    .duration(settings.general.duration)
                    .style("opacity", 0);
            }
        }
        else {
            axisMajorGrid.transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
            axisMinorGrid.transition()
                .duration(settings.general.duration)
                .style("opacity", 0);
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