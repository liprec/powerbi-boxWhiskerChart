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
            axisCategoryHeight: 0,
            axisCategoryWidth: 0,
            axisLabelSizeCategory: 0,
            axisAngleCategory: 0,
            axisValueHeight: 0,
            axisValueWidth: 0,
            axisLabelSizeValue: 0,
            axisScaleValue: undefined,
            axisOptions: {
                max: 0,
                min: 0,
                ticks: 0,
                tickSize: 0
            },
            drawScaleCategory: undefined,
            drawScaleValue: undefined
        };
        let sin, cos, tan;

        switch (settings.xAxis.orientation) {
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
        sin = Math.sin(axisSettings.axisAngleCategory * (Math.PI / 180));
        cos = Math.cos(axisSettings.axisAngleCategory * (Math.PI / 180));
        tan = Math.tan(axisSettings.axisAngleCategory * (Math.PI / 180));

        // Caclulate optimum min/max of value axis
        let stack = d3.layout.stack();
        let layers = stack(data.dataPoints);
        let refLines = data.referenceLines;
        axisSettings.axisOptions = getAxisOptions(
            d3.min([
                d3.min(refLines, (refLine: BoxWhiskerChartReferenceLine) => refLine.value),
                d3.min(layers, (layer) => {
                    return d3.min(layer, (point) => {
                        return  d3.min([
                                    (<BoxWhiskerChartDatapoint>point).min,
                                    (<BoxWhiskerChartDatapoint>point).median,
                                    (<BoxWhiskerChartDatapoint>point).average,
                                d3.min((<BoxWhiskerChartDatapoint>point).outliers, (outlier) => outlier.value)]);
                    });
                })
            ]),
            d3.max([
                d3.max(refLines, (refLine: BoxWhiskerChartReferenceLine) => refLine.value),
                d3.max(layers, (layer) => {
                    return d3.max(layer, (point) => {
                        return  d3.max([
                                    (<BoxWhiskerChartDatapoint>point).max,
                                    (<BoxWhiskerChartDatapoint>point).median,
                                    (<BoxWhiskerChartDatapoint>point).average,
                                d3.max((<BoxWhiskerChartDatapoint>point).outliers, (outlier) => outlier.value)]);
                    });
                })
            ]),
            settings.yAxis.start,
            settings.yAxis.end
        );

        if (data.dataPointLength > 0) {
            // calculate AxisSizeX, AxisSizeY
            if (settings.xAxis.show) { // Show category axis
                axisSettings.axisCategoryHeight = d3.max(data.categories.map((category: string) => {
                    let size1 = cos * textMeasurementService.measureSvgTextHeight(
                        settings.xAxis.axisTextProperties,
                        category);
                    let size2 = sin * textMeasurementService.measureSvgTextWidth(
                        settings.xAxis.axisTextProperties,
                        category);
                    return size1 + size2 + 10; // Axis width/margin itself;
                }));
                axisSettings.axisCategoryWidth = d3.max(data.categories.map((category: string) => {
                    return textMeasurementService.measureSvgTextWidth(
                        settings.xAxis.axisTextProperties,
                        settings.formatting.categoryFormatter.format(category));
                }));

                if (settings.xAxis.showTitle) {
                    axisSettings.axisLabelSizeCategory = textMeasurementService.measureSvgTextHeight(
                        settings.xAxis.titleTextProperties,
                        settings.formatting.categoryFormatter.format(settings.xAxis.title || settings.xAxis.defaultTitle)
                    );
                    axisSettings.axisCategoryHeight += axisSettings.axisLabelSizeCategory;
                }
            }

            if (settings.yAxis.show) { // Show value azis
                for (let i = axisSettings.axisOptions.min; i < axisSettings.axisOptions.max; i += axisSettings.axisOptions.tickSize) {
                    let tempSize = textMeasurementService.measureSvgTextWidth(
                        settings.yAxis.axisTextProperties,
                        settings.formatting.valuesFormatter.format(i));
                        axisSettings.axisValueWidth = tempSize > axisSettings.axisValueWidth ? tempSize : axisSettings.axisValueWidth;
                }
                axisSettings.axisValueWidth += 10; // Axis width itself

                axisSettings.axisValueHeight = textMeasurementService.measureSvgTextHeight(
                    settings.yAxis.axisTextProperties,
                    settings.formatting.valuesFormatter.format(axisSettings.axisOptions.max));

                if (settings.yAxis.showTitle) {
                    axisSettings.axisLabelSizeValue = textMeasurementService.measureSvgTextHeight(
                        settings.yAxis.titleTextProperties,
                        settings.formatting.valuesFormatter.format(settings.yAxis.title || settings.yAxis.defaultTitle)
                    );
                    axisSettings.axisValueWidth += axisSettings.axisLabelSizeValue;
                }
            }
        }

        if ((settings.yAxis.start !== undefined) && (settings.yAxis.scaleType === BoxWhiskerEnums.ScaleType.Linear)) {
            if (settings.yAxis.start !== axisSettings.axisOptions.min) {
                settings.yAxis.start = axisSettings.axisOptions.min;
            }
        }

        if (settings.yAxis.scaleType === BoxWhiskerEnums.ScaleType.Log) {
            if (axisSettings.axisOptions.min <= 0) {
                axisSettings.axisOptions.min = settings.yAxis.start = settings.yAxis.start || 1;
            }
        }

        if (settings.yAxis.end !== undefined) {
            if (settings.yAxis.end !== axisSettings.axisOptions.max) {
                settings.yAxis.end = axisSettings.axisOptions.max;
            }
        }

        switch (settings.yAxis.scaleType) {
            case BoxWhiskerEnums.ScaleType.Linear:
                axisSettings.axisScaleValue = d3.scale.linear()
                    .domain([axisSettings.axisOptions.min || 0, axisSettings.axisOptions.max || 0]);
                break;
            case BoxWhiskerEnums.ScaleType.Log:
                axisSettings.axisScaleValue = d3.scale.log()
                    .domain([axisSettings.axisOptions.min || 1, axisSettings.axisOptions.max || 1]);
                break;
        }

        axisSettings.axisScaleValue
            .range([settings.general.margin.bottom + axisSettings.axisCategoryHeight, settings.general.viewport.height - settings.general.margin.top]);

        axisSettings.axisScaleCategory = d3.scale.linear()
            .domain([0, data.dataPointLength])
            .range([settings.general.margin.left + axisSettings.axisValueWidth, settings.general.viewport.width - settings.general.margin.right]);

        return axisSettings;
    }

    export function drawAxis(rootElement: Selection<any>, settings: BoxWhiskerChartSettings, data: BoxWhiskerChartData, axisSettings: BoxWhiskerAxisSettings) {
        let axisCategory: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisX.selectorName);
        let axisValue: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisY.selectorName);
        let axisCategoryLabel: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisXLabel.selectorName);
        let axisValueLabel: Selection<any> = rootElement.selectAll(BoxWhiskerChart.AxisYLabel.selectorName);
        let axisMajorGrid: Selection<any> = rootElement.select(BoxWhiskerChart.AxisMajorGrid.selectorName);
        let axisMinorGrid: Selection<any> = rootElement.select(BoxWhiskerChart.AxisMinorGrid.selectorName);
        let sin = Math.sin(axisSettings.axisAngleCategory * (Math.PI / 180));
        let cos = Math.cos(axisSettings.axisAngleCategory * (Math.PI / 180));

        let categoryScale = d3.scale.ordinal();
        // Can we draw at least one Category label?
        if (axisSettings.axisCategoryWidth < (settings.general.viewport.width - settings.general.margin.right - settings.general.margin.left - axisSettings.axisValueWidth)) {
            let overSamplingX = 1;
            let visibleDataPoints = data.categories.filter((category, i) => i % overSamplingX === 0);
            let totalXAxisWidth = d3.max(visibleDataPoints
                .map((category) => calcWidth(settings.xAxis.orientation, category))) * visibleDataPoints.length;
            while (totalXAxisWidth > (settings.general.viewport.width - settings.general.margin.right - settings.general.margin.left - axisSettings.axisValueWidth)) {
                overSamplingX += 1;
                visibleDataPoints = data.categories.filter((category, i) => i % overSamplingX === 0);
                totalXAxisWidth = d3.max(visibleDataPoints
                    .map((category) => calcWidth(settings.xAxis.orientation, category))) * visibleDataPoints.length;
            }
            categoryScale.domain(data.categories.map((category, index) => { return (index % overSamplingX === 0) ? category : null; })
                .filter((d) => d !== null)
            )
                .rangeBands([settings.general.margin.left + axisSettings.axisValueWidth, settings.general.viewport.width - settings.general.margin.right], 0);
        } else {
            categoryScale.domain([])
                .rangeBands([settings.general.margin.left + axisSettings.axisValueWidth, settings.general.viewport.width - settings.general.margin.right]);
        }

        let valueScale = axisSettings.axisScaleValue.range([settings.general.viewport.height - axisSettings.axisCategoryHeight - settings.general.margin.bottom, settings.general.margin.top]);
        let yAxisTicks = axisSettings.axisOptions.ticks;

        if (axisSettings.axisValueHeight < (settings.general.viewport.height - axisSettings.axisCategoryHeight - settings.general.margin.bottom - settings.general.margin.top)) {
            let totalYAxisHeight = yAxisTicks * axisSettings.axisValueHeight;

            // Calculate minimal ticks that fits the height
            while (totalYAxisHeight > settings.general.viewport.height - axisSettings.axisCategoryHeight - settings.general.margin.bottom - settings.general.margin.top) {
                yAxisTicks /= 2;
                totalYAxisHeight = yAxisTicks * axisSettings.axisValueHeight;
            }
        } else {
            yAxisTicks = 0;
        }

        let xAxisTransform =
            axisSettings.axisOptions.min > 0 ?
                valueScale(axisSettings.axisOptions.min) :
                axisSettings.axisOptions.max < 0 ?
                    valueScale(axisSettings.axisOptions.min) :
                    settings.yAxis.scaleType === BoxWhiskerEnums.ScaleType.Log ? valueScale(1) : valueScale(0);

        if (settings.xAxis.show) {
            let categoryAxis = d3.svg.axis()
                .scale(categoryScale)
                .orient("bottom")
                .tickSize(0)
                .innerTickSize(8 + ((settings.general.viewport.height - settings.general.margin.top - axisSettings.axisCategoryHeight) - xAxisTransform));

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
                .style("font-size", settings.xAxis.fontSize + "px")
                .style("text-anchor", axisSettings.axisAngleCategory === BoxWhiskerEnums.LabelOrientation.Horizontal ? "middle" : "end")
                .attr("dx", (d) => {
                    return (-0.0044 * axisSettings.axisAngleCategory) + "em";
                })
                .attr("dy", (d) => {
                    return ((-0.0139 * axisSettings.axisAngleCategory) + 0.75) + "em";
                })
                .attr("transform", function(d) {
                    return `rotate(-${axisSettings.axisAngleCategory})`;
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
                        xTransform = settings.general.margin.left + axisSettings.axisValueWidth;
                        break;
                    case "right":
                        xTransform = settings.general.viewport.width - settings.general.margin.left -
                            labelWidth;
                        break;
                    case "center":
                    default:
                        xTransform = (((settings.general.viewport.width - settings.general.margin.left -
                            settings.general.margin.right - axisSettings.axisValueWidth) / 2) +
                            settings.general.margin.left + axisSettings.axisValueWidth) -
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
                    .style("font-size", settings.xAxis.titleFontSize + "px");
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
                .scale(valueScale)
                .orient("left")
                .tickFormat(d => settings.formatting.valuesFormatter.format(d))
                .ticks(yAxisTicks);

            axisValue
                .attr("transform", "translate(" + (axisSettings.axisValueWidth + settings.general.margin.left) + ", 0)")
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
                .style("font-size", settings.yAxis.fontSize + "px");

            if (settings.yAxis.showTitle) {
                let xTransform = settings.general.margin.left + (axisSettings.axisLabelSizeValue / 2);
                let labelWidth = textMeasurementService.measureSvgTextWidth(
                    settings.yAxis.axisTextProperties,
                    settings.yAxis.title || settings.yAxis.defaultTitle
                );
                let yTransform;
                switch (settings.yAxis.titleAlignment) {
                    case "left":
                        yTransform = settings.general.viewport.height - axisSettings.axisCategoryHeight;
                        break;
                    case "right":
                        yTransform = settings.general.margin.top + labelWidth;
                        break;
                    case "center":
                    default:
                        yTransform = ((settings.general.viewport.height - settings.general.margin.bottom -
                            settings.general.margin.top - axisSettings.axisCategoryHeight) / 2) +
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
                    .style("font-size", settings.yAxis.titleFontSize + "px");
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
                .scale(valueScale)
                .orient("left")
                .ticks(yAxisTicks)
                .outerTickSize(0)
                .innerTickSize(0);

            axisMajorGrid
                .attr("transform", "translate(" + (axisSettings.axisValueWidth + settings.general.margin.left) + ", 0)")
                .transition()
                .duration(settings.general.duration)
                .style("opacity", 1)
                .call(yMajorGrid);

            axisMajorGrid
                .selectAll("line")
                .transition()
                .duration(settings.general.duration)
                .style("stroke", settings.gridLines.majorGridColor)
                .style("stroke-width", settings.gridLines.majorGridSize)
                .attr("x2", settings.general.viewport.width - axisSettings.axisValueWidth - settings.general.margin.right + settings.general.margin.left);

            if (settings.gridLines.minorGrid) {
                let yMinorGrid = d3.svg.axis()
                    .scale(valueScale)
                    .orient("left")
                    .ticks(yAxisTicks * 5)
                    .outerTickSize(0)
                    .innerTickSize(0);

                axisMinorGrid
                    .attr("transform", "translate(" + (axisSettings.axisValueWidth + settings.general.margin.left) + ", 0)")
                    .transition()
                    .duration(settings.general.duration)
                    .style("opacity", 1)
                    .call(yMinorGrid);

                axisMinorGrid
                    .selectAll("line")
                    .transition()
                    .duration(settings.general.duration)
                    .style("stroke", settings.gridLines.minorGridColor)
                    .style("stroke-width", settings.gridLines.minorGridSize)
                    .attr("x2", settings.general.viewport.width - axisSettings.axisValueWidth - settings.general.margin.right + settings.general.margin.left);

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

        function calcWidth(orientation: BoxWhiskerEnums.LabelOrientation, category: string) {
            let width = 0,
                cos = Math.cos(axisSettings.axisAngleCategory * (Math.PI / 180));
            switch (orientation) {
                case BoxWhiskerEnums.LabelOrientation.Vertical:
                    width = textMeasurementService.measureSvgTextHeight(settings.xAxis.axisTextProperties, category) * .75;
                    break;
                case BoxWhiskerEnums.LabelOrientation.Diagonal:
                    width = (textMeasurementService.measureSvgTextHeight(settings.xAxis.axisTextProperties, category) * .75) / cos;
                    break;
                case BoxWhiskerEnums.LabelOrientation.Horizontal:
                default:
                    width = textMeasurementService.measureSvgTextWidth(settings.xAxis.axisTextProperties, category);
            }
            return width;
        }
    }

    export function getAxisOptions(min: number, max: number, fixedMin: number, fixedMax: number): BoxWhiskerAxisOptions {
        let isFixedMin = fixedMin !== undefined ;
        let isFixedMax = fixedMax !== undefined;
        // let min1 = isFixedMin ? fixedMin < max ? fixedMin : max : (min === 0 ? 0 : min > 0 ? (min * .99) - ((max - min) / 100) : (min * 1.01) - ((max - min) / 100));
        // let max1 = isFixedMax ? fixedMax > min ? fixedMax : min : (max === 0 ? min === 0 ? 1 : 0 : max < 0 ? (max * .99) + ((max - min) / 100) : (max * 1.01) + ((max - min) / 100));
        let min1 = (min === 0 ? 0 : min > 0 ? (min * .99) - ((max - min) / 100) : (min * 1.01) - ((max - min) / 100));
        let max1 = (max === 0 ? min === 0 ? 1 : 0 : max < 0 ? (max * .99) + ((max - min) / 100) : (max * 1.01) + ((max - min) / 100));

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
            // max: maxValue,
            // min: minValue,
            min: isFixedMin ? fixedMin < max ? fixedMin : minValue : minValue,
            max: isFixedMax ? fixedMax > min ? fixedMax : maxValue : maxValue,
            ticks: ticks,
        };
    }
}