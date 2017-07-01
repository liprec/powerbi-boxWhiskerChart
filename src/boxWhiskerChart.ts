/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    // utils.svg
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;
    import translate = powerbi.extensibility.utils.svg.translate;
    import IMargin = powerbi.extensibility.utils.svg.IMargin;

    // utils.formatting
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;

    // utils.type
    import ValueType = powerbi.extensibility.utils.type.ValueType;
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    // utils.dataview
    import DataViewObjectsModule = powerbi.extensibility.utils.dataview.DataViewObjects;
    
    // powerbi 
    import TooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

    // d3
    import Selection = d3.Selection;

    export interface BoxWhiskerChartConstructorOptions {
        svg?: Selection<any>;
        margin?: IMargin;
    }

    export interface BoxWhiskerChartDatapoint {
        min: number;
        max: number;
        median: number;
        quartile1: number;
        quartile3: number;
        average: number;
        samples: number;
        category: number;
        color?: string;
        label?: string;
        outliers: number[];
        dataLabels: BoxWhiskerDataLabel[];
        identity: ISelectionId;
        tooltipInfo?: TooltipDataItem[];
        x: number;
        y: number;
    }

    export interface BoxWhiskerChartData {
        dataPoints: BoxWhiskerChartDatapoint[][];
    }

    export interface BoxWhiskerDataLabel {
        value: number;
        y: number;
        x: number;
    }

    export interface BoxWhiskerAxisOptions {
        max: number;
        min: number;
        ticks: number;
        tickSize: number;
    }

    export module BoxWhiskerTypeOptions {
        export enum ChartType {
            MinMax,
            Standard,
            IQR
        }
    }

    export module BoxWhiskerTypeOptions {
        export enum MarginType {
            Small,
            Medium,
            Large
        }
    }

    export class BoxWhiskerChart implements IVisual {

        private static properties = {
            formatString: { objectName: "general", propertyName: "formatString" },
            whiskerType: { objectName: "chartOptions", propertyName: "whisker" },
            marginType: { objectName: "chartOptions", propertyName: "margin" },
            fontSizeXAxis: { objectName: "xAxis", propertyName: "fontSize" },
            fontSizeYAxis: { objectName: "yAxis", propertyName: "fontSize" },
            showOutliers: { objectName: "chartOptions", propertyName: "outliers" },
            showMajorGridLines: { objectName: "gridLines", propertyName: "majorGrid" },
            sizeMajorGridLines: { objectName: "gridLines", propertyName: "majorGridSize" },
            colorMajorGridLines: { objectName: "gridLines", propertyName: "majorGridColor" },
            showMinorGridLines: { objectName: "gridLines", propertyName: "minorGrid" },
            sizeMinorGridLines: { objectName: "gridLines", propertyName: "minorGridSize" },
            colorMinorGridLines: { objectName: "gridLines", propertyName: "minorGridColor" },
            fill: { objectName: "dataPoint", propertyName: "fill" },
            dataLabelShow: { objectName: "labels", propertyName: "show" },
            dataLabelFontSize: { objectName: "labels", propertyName: "fontSize" },
        };

        private static LocalizationStrings: jsCommon.IStringResourceProvider = {
            get: (stringId: string) => stringId,
            getOptional: (stringId: string) => stringId
        };

        public static formatStringProp: DataViewObjectPropertyIdentifier = {
            objectName: "general",
            propertyName: "formatString",
        };

        private static VisualClassName = "boxWhiskerChart";

        private static Axis: ClassAndSelector = createClassAndSelector("axis");
        private static AxisX: ClassAndSelector = createClassAndSelector("axisX")
        private static AxisMajorGrid: ClassAndSelector = createClassAndSelector("axisMajorGrid");
        private static AxisMinorGrid: ClassAndSelector = createClassAndSelector("axisMinorGrid");
        private static AxisY: ClassAndSelector = createClassAndSelector("axisY");
        private static Chart: ClassAndSelector = createClassAndSelector("chart");
        private static ChartNode: ClassAndSelector = createClassAndSelector("chartNode");
        private static ChartQuartileBox: ClassAndSelector = createClassAndSelector("chartQuartileBox");
        private static ChartMedianLine: ClassAndSelector = createClassAndSelector("chartMedianLine");
        private static ChartAverageDot: ClassAndSelector = createClassAndSelector("chartAverageDot");
        private static ChartOutlierDot: ClassAndSelector = createClassAndSelector("chartOutlierDot");
        private static ChartDataLabel: ClassAndSelector = createClassAndSelector("chartDataLabel");

        private root: JQuery;
        private svg: Selection<any>;
        private axis: Selection<any>;
        private chart: Selection<any>;

        private axisX: Selection<any>;
        private axisY: Selection<any>;
        private axisMajorGrid: Selection<any>;
        private axisMinorGrid: Selection<any>;
        private axisOptions: BoxWhiskerAxisOptions;

        private mainGroupElement: Selection<any>;
        private colorPalette: IColorPalette;
        private selectionManager: ISelectionManager;
        private viewport: IViewport;
        private hostServices: IVisualHost;
        private dataView: DataView;
        private data: BoxWhiskerChartData;
        private tooltipServiceWrapper: ITooltipServiceWrapper

        private defaultFontFamily = "Segoe UI,wf_segoe-ui_normal,helvetica,arial,sans-serif";
        private staticColor: string = "#707070";

        private static DefaultMargin: IMargin = {
            top: 5,
            bottom: 5,
            right: 5,
            left: 5
        };

        private margin: IMargin;
        private defaultFormatY: string = "#,0";
        private formatY: IValueFormatter;
        private formatX: IValueFormatter;
        private dataType: ValueType;

        private AxisSizeY: number = 40;
        private AxisSizeX: number = 20;

        public converter(dataView: DataView, colors: IColorPalette): BoxWhiskerChartData {
            if (!dataView ||
                !dataView.matrix ||
                !dataView.matrix.columns ||
                !dataView.matrix.columns.root.children ||
                !(dataView.matrix.columns.root.children.length > 0) ||
                !(dataView.matrix.columns.root.children[0].levelValues) ||
                !dataView.matrix.valueSources ||
                !dataView.matrix.valueSources[0]) {
                return {
                    dataPoints: []
                };
            }
            var categories = dataView.matrix.rows.root.children;

            var dataPoints: BoxWhiskerChartDatapoint[][] = [];

            if (dataView.matrix.rows.levels.length > 0) {
                this.formatX = valueFormatter.create({
                    format: dataView.matrix.rows.levels[0].sources[0].format,
                    value: categories[0].value,
                    value2: categories[categories.length - 1].value,
                });
            } else {
                this.formatX = valueFormatter.createDefaultFormatter(null);
            }
            
            this.formatY = valueFormatter.create({
                format: dataView.matrix.valueSources[0].format
                    ? dataView.matrix.valueSources[0].format
                    : this.defaultFormatY,
                value: 100, //d3.max(dataView.matrix.rows.root.children, (c) => d3.max([c.values])),
                value2: -100, // d3.min(dataView.matrix.rows.root.children, (c) => d3.min([c.values])),
                precision: 3,
            });

            this.dataType = ValueType.fromDescriptor(dataView.matrix.valueSources[0].type);
            var hasStaticColor = categories.length > 15;
            var staticColor = this.getStaticColor(this.dataView);

            for (var i = 0, iLen = categories.length; i < iLen && i < 100; i++) {
                var values = this.getValueArray(dataView.matrix.rows.root.children[i].values)
                    .filter((value) => { return value != null; });

                if (values.length === 0) {
                    break;
                }

                var selector, id;
                let SelectionId: ISelectionIdBuilder = this.hostServices.createSelectionIdBuilder();

                if (categories.length === 1) {
                    id = SelectionId
                            .withMeasure(dataView.matrix.valueSources[0].queryName)
                            .createSelectionId();
                }
                else {
                    selector = { data: [categories[i].identity], };
                    //id = new ISelectionId(selector, false);
                }

                var sortedValue = values.sort((n1, n2) => n1 - n2);

                var median = (
                    sortedValue[Math.floor((sortedValue.length - 1) / 2)] +
                    sortedValue[Math.ceil((sortedValue.length - 1) / 2)]) / 2;

                var q1 = sortedValue.length === 3 ? 0 : (sortedValue.length - 1) / 4;

                var q1LowValue = sortedValue[Math.floor(q1)];
                var q1HighValue = sortedValue[Math.ceil(q1)];

                var quartile1 = sortedValue.length <= 2 ? null : q1LowValue + ((q1 - Math.floor(q1)) * (q1HighValue - q1LowValue));

                var q3 = sortedValue.length === 3 ? 2 : 3 * q1;

                var q3LowValue = sortedValue[Math.floor(q3)];
                var q3HighValue = sortedValue[Math.ceil(q3)];

                var quartile3 = sortedValue.length <= 2 ? null : q3LowValue + (((3 * q1) - Math.floor(3 * q1)) * (q3HighValue - q3LowValue));

                var minValue;
                var maxValue;
                var minValueLabel;
                var maxValueLabel;
                var whiskerType = this.getWhiskerType(this.dataView);

                if (!quartile1 || !quartile3) {
                    whiskerType = BoxWhiskerTypeOptions.ChartType.MinMax;
                }

                switch (whiskerType) {
                    case BoxWhiskerTypeOptions.ChartType.MinMax:
                        minValue = sortedValue[0];
                        maxValue = sortedValue[sortedValue.length - 1];
                        minValueLabel = "Minimum";
                        maxValueLabel = "Maximum";
                        break;
                    case BoxWhiskerTypeOptions.ChartType.Standard:
                        var IQR = quartile3 - quartile1;
                        minValue = sortedValue.filter((value) => value >= quartile1 - (1.5 * IQR))[0];
                        maxValue = sortedValue.filter((value) => value <= quartile3 + (1.5 * IQR)).reverse()[0];
                        minValueLabel = "Minimum";
                        maxValueLabel = "Maximum";
                        break;
                    case BoxWhiskerTypeOptions.ChartType.IQR:
                        var IQR = quartile3 - quartile1;
                        minValue = quartile1 - (1.5 * IQR);
                        maxValue = quartile3 + (1.5 * IQR);
                        minValueLabel = "Q1 - 1.5 x IQR";
                        maxValueLabel = "Q3 + 1.5 x IQR";
                        break;
                    default:
                        minValue = sortedValue[0];
                        maxValue = sortedValue[sortedValue.length - 1];
                        minValueLabel = "Minimum";
                        maxValueLabel = "Maximum";
                        break;
                }

                var ttl: number = 0;
                sortedValue.forEach(value => { ttl += value; });
                var avgvalue = ttl / sortedValue.length;

                dataPoints.push([]);

                var outliers = this.getShowOutliers(this.dataView) ?
                    sortedValue
                        .filter((value) => value < minValue || value > maxValue) // Filter outliers 
                        .filter((value, index, self) => self.indexOf(value) === index) // Make unique
                    : [];

                let colorPalette: IColorPalette;
                if (!hasStaticColor) {
                     colorPalette = this.colorPalette;
                }

                dataPoints[i].push({
                    x:0,
                    y:0,
                    min: minValue,
                    max: maxValue,
                    quartile1: quartile1,
                    quartile3: quartile3,
                    median: median,
                    average: avgvalue,
                    samples: sortedValue.length,
                    category: i + 1,
                    outliers: outliers,
                    dataLabels: (this.getDataLabelShow(this.dataView)) ?
                        [maxValue, minValue, avgvalue, median, quartile1, quartile3]
                            .filter((value, index, self) => self.indexOf(value) === index) // Make unique
                            .filter((value) => { return value != null; }) // Remove empties
                            .map((dataPoint) => { return { value: dataPoint, x: 0, y: 0 }; })
                            .concat(outliers.map((outlier) => { return { value: outlier, x: 0, y: 0 }; }))
                        : [],
                    label: categories[0].value === undefined
                        ? dataView.matrix.valueSources[0].displayName
                        : this.formatX.format(categories[i].value),
                    identity: id,
                    color: hasStaticColor ? staticColor : //colorHelper.getColorForSeriesValue(categories[i].objects, dataView.matrix.rows.root.childIdentityFields, categories[i].name),
                        colorPalette.getColor(dataView.categorical.categories[0].values[i] + '').value,
                    tooltipInfo: [
                        {
                            displayName: 'Group',
                            value: categories[0].value === undefined
                                ? dataView.matrix.valueSources[0].displayName
                                : this.formatX.format(categories[i].value),
                        },
                        {
                            displayName: '# Samples',
                            value: valueFormatter.format(sortedValue.length, 'd', false),
                        },
                        {
                            displayName: maxValueLabel,
                            value: this.formatY.format(maxValue),
                        },
                        {
                            displayName: 'Quartile 3',
                            value: this.formatY.format(quartile3),
                        },
                        {
                            displayName: 'Median',
                            value: this.formatY.format(median),
                        },
                        {
                            displayName: 'Average',
                            value: this.formatY.format(avgvalue),
                        },
                        {
                            displayName: 'Quartile 1',
                            value: this.formatY.format(quartile1),
                        },
                        {
                            displayName: minValueLabel,
                            value: this.formatY.format(minValue),
                        }]
                });
            }
            return {
                dataPoints: dataPoints
            };
        }

        constructor(options: VisualConstructorOptions) {
            if (options.element) {
                this.root = $(options.element);
            }
            
            var element = options.element;
            this.hostServices = options.host;
            this.colorPalette = options.host.colorPalette;
            this.selectionManager = options.host.createSelectionManager();
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.hostServices.tooltipService, options.element);
            
            if (!this.svg) {
                this.svg = d3.select(this.root.get(0))
                    .append('svg')
                    .classed(BoxWhiskerChart.VisualClassName, true);
                console.log("3");
            }
            
            this.margin = BoxWhiskerChart.DefaultMargin;
            this.mainGroupElement = this.svg.append("g");

            this.axis = this.mainGroupElement
                .append("g")
                .classed(BoxWhiskerChart.Axis.className, true);

            this.axisX = this.axis
                .append("g")
                .classed(BoxWhiskerChart.AxisX.className, true);

            this.axisMajorGrid = this.axis
                .append("g")
                .classed(BoxWhiskerChart.AxisMajorGrid.className, true);

            this.axisMinorGrid = this.axis
                .append("g")
                .classed(BoxWhiskerChart.AxisMinorGrid.className, true);

            this.axisY = this.axis
                .append("g")
                .classed(BoxWhiskerChart.AxisY.className, true);

            this.chart = this.mainGroupElement
                .append("g")
                .classed(BoxWhiskerChart.Chart.className, true);
        }

        public update(options: VisualUpdateOptions): void {
            if (!options.dataViews || !options.dataViews[0]) {
                this.chart.selectAll(BoxWhiskerChart.ChartNode.selectorName).remove();
                this.axis.selectAll(BoxWhiskerChart.AxisX.selectorName).remove();
                this.axis.selectAll(BoxWhiskerChart.AxisY.selectorName).remove();
                this.axis.selectAll(BoxWhiskerChart.AxisMajorGrid.selectorName).remove();
                this.axis.selectAll(BoxWhiskerChart.AxisMinorGrid.selectorName).remove();
                return;
            };

            var dataView = this.dataView = options.dataViews[0],
                data = this.data = this.converter(dataView, this.colorPalette),
                dataPoints = data.dataPoints,
                duration = 250;

            this.viewport = {
                height: options.viewport.height > 0 ? options.viewport.height : 0,
                width: options.viewport.width > 0 ? options.viewport.width : 0
            };

            this.svg
                .attr({
                    'height': this.viewport.height,
                    'width': this.viewport.width
                });

            if (dataPoints.length === 0) {
                this.chart.selectAll(BoxWhiskerChart.ChartNode.selectorName).remove();
                this.axis.selectAll(BoxWhiskerChart.AxisX.selectorName).remove();
                this.axis.selectAll(BoxWhiskerChart.AxisY.selectorName).remove();
                this.axis.selectAll(BoxWhiskerChart.AxisMajorGrid.selectorName).remove();
                this.axis.selectAll(BoxWhiskerChart.AxisMinorGrid.selectorName).remove();
                return;
            }

            // calculate AxisSizeX, AxisSizeY
            this.AxisSizeX = textMeasurementService.estimateSvgTextHeight({
                text: "XXXX",
                fontFamily: this.defaultFontFamily,
                fontSize: PixelConverter.fromPoint(this.getXAxisFontSize(this.dataView)),
            });

            var mainGroup = this.chart;
            mainGroup.attr('transform', 'scale(1, -1)' + translate(0, -(this.viewport.height - this.AxisSizeX)));

            // calculate scalefactor
            var stack = d3.layout.stack();
            var layers = stack(dataPoints);

            this.axisOptions = this.getAxisOptions(
                d3.min(layers, (layer) => {
                    return d3.min(layer, (point) => {
                        return  d3.min([(<BoxWhiskerChartDatapoint>point).min, 
                                d3.min((<BoxWhiskerChartDatapoint>point).outliers)]);
                    });
                }),
                d3.max(layers, (layer) => {
                    return d3.max(layer, (point) => {
                        return  d3.max([(<BoxWhiskerChartDatapoint>point).max, 
                                d3.max((<BoxWhiskerChartDatapoint>point).outliers)]);
                    });
                }));

            this.AxisSizeY = textMeasurementService.measureSvgTextWidth({
                text: this.formatY.format(this.axisOptions.max),
                fontFamily: this.defaultFontFamily,
                fontSize: PixelConverter.fromPoint(this.getYAxisFontSize(this.dataView)),
            });

            this.margin.top = textMeasurementService.measureSvgTextHeight({
                text: this.formatY.format(this.axisOptions.max),
                fontFamily: this.defaultFontFamily,
                fontSize: PixelConverter.fromPoint(this.getYAxisFontSize(this.dataView)),
            }) / 2.;

            if (this.getDataLabelShow(this.dataView) && this.data.dataPoints.length > 0) {
                var dataLabelTop = textMeasurementService.measureSvgTextHeight({
                    text: this.formatY.format(this.data.dataPoints[0][0].dataLabels[0].value),
                    fontFamily: this.defaultFontFamily,
                    fontSize: PixelConverter.fromPoint(this.getYAxisFontSize(this.dataView)),
                }) / 2.;
            }

            var yScale = d3.scale.linear()
                .domain([this.axisOptions.min, this.axisOptions.max])
                .range([this.margin.bottom, this.viewport.height - this.AxisSizeX - this.margin.top]);

            var xScale = d3.scale.linear()
                .domain([1, dataPoints.length + 1])
                .range([this.margin.left + this.AxisSizeY, this.viewport.width - this.margin.right]);

            this.drawChart(dataPoints, xScale, yScale, duration);
            this.drawAxis(dataPoints, yScale, duration);
        }

        private drawAxis(dataPoints: BoxWhiskerChartDatapoint[][], yScale: d3.scale.Linear<any, any>, duration: number) {
            if ((this.axis.selectAll(BoxWhiskerChart.AxisX.selectorName)[0].length === 0) ||
                (this.axis.selectAll(BoxWhiskerChart.AxisY.selectorName)[0].length === 0) ||
                (this.axis.selectAll(BoxWhiskerChart.AxisMajorGrid.selectorName)[0].length === 0) ||
                (this.axis.selectAll(BoxWhiskerChart.AxisMinorGrid.selectorName)[0].length === 0)) {
                this.axisMajorGrid = this.axis
                    .append("g")
                    .classed(BoxWhiskerChart.AxisMajorGrid.className, true);

                this.axisMinorGrid = this.axis
                    .append("g")
                    .classed(BoxWhiskerChart.AxisMinorGrid.className, true);

                this.axisX = this.axis
                    .append("g")
                    .classed(BoxWhiskerChart.AxisX.className, true);

                this.axisY = this.axis
                    .append("g")
                    .classed(BoxWhiskerChart.AxisY.className, true);
            }

            // var textHelperX = this.axisX.append("text")
            //     .classed("helperX", true)
            //     .style("visibility", "hidden")
            //     .style("font-size", this.getXAxisFontSize(this.dataView) + "px")
            //     .text(dataPoints[0][0].label);

            // var textHelperY = this.axisY.append("text")
            //     .classed("helperY", true)
            //     .style("visibility", "hidden")
            //     .style("font-size", this.getYAxisFontSize(this.dataView) + "px")
            //     .text(this.formatY.format(this.axisOptions.max));
            let textXProperties: TextProperties = {
                fontFamily: this.defaultFontFamily,
                fontSize: this.getXAxisFontSize(this.dataView) + "px"
            }

            let textYProperties: TextProperties = {
                fontFamily: this.defaultFontFamily,
                fontSize: this.getYAxisFontSize(this.dataView) + "px"
            }

            let yAxisLabelHeight = textMeasurementService.measureSvgTextHeight(textYProperties, dataPoints[0][0].label);
            
            let xAxisLabelWidth = textMeasurementService.measureSvgTextWidth(textXProperties, this.formatY.format(this.axisOptions.max));

            var xs = d3.scale.ordinal();
            // Can we draw at least one X-axis label?
            if (xAxisLabelWidth < (this.viewport.width - this.margin.right - this.margin.left - this.AxisSizeY)) {
                var overSamplingX = 1;
                var visibleDataPoints = dataPoints.filter((d, i) => i % overSamplingX === 0);
                var totalXAxisWidth = d3.max(visibleDataPoints
                    .map((d) =>
                        textMeasurementService.measureSvgTextWidth(
                            textYProperties,
                            d[0].label) + 2 //margin
                    )) * visibleDataPoints.length;

                while (totalXAxisWidth > (this.viewport.width - this.margin.right - this.margin.left - this.AxisSizeY)) {
                    overSamplingX += 1;
                    visibleDataPoints = dataPoints.filter((d, i) => i % overSamplingX === 0);
                    var totalXAxisWidth = d3.max(visibleDataPoints
                        .map((d) =>
                            textMeasurementService.measureSvgTextWidth(
                                textYProperties,
                                d[0].label) + 2 //margin
                        )) * visibleDataPoints.length;
                }

                xs.domain(dataPoints.map((values, index) => { return (index % overSamplingX === 0) ? values[0].label : null; })
                    .filter((d) => d !== null)
                )
                    .rangeBands([this.margin.left + this.AxisSizeY, this.viewport.width - this.margin.right]);
            } else {
                xs.domain([])
                    .rangeBands([this.margin.left + this.AxisSizeY, this.viewport.width - this.margin.right]);
            }

            var ys = yScale.range([this.viewport.height - this.AxisSizeX - this.margin.bottom, this.margin.top]);
            var yAxisTicks = this.axisOptions.ticks;

            if (yAxisLabelHeight < (this.viewport.height - this.AxisSizeX - this.margin.bottom - this.margin.top)) {
                var totalYAxisHeight = yAxisTicks * yAxisLabelHeight;

                // Calculate minimal ticks that fits the height
                while (totalYAxisHeight > this.viewport.height - this.AxisSizeX - this.margin.bottom - this.margin.top) {
                    yAxisTicks /= 2;
                    totalYAxisHeight = yAxisTicks * yAxisLabelHeight;
                }
            } else {
                yAxisTicks = 0;
            }

            var xAxisTransform =
                this.axisOptions.min > 0 ?
                    ys(this.axisOptions.min) :
                    this.axisOptions.max < 0 ?
                        ys(this.axisOptions.min) :
                        ys(0);

            var xAxis = d3.svg.axis()
                .scale(xs)
                .orient("bottom")
                .tickSize(0)
                .innerTickSize(8 + ((this.viewport.height - this.margin.top - this.AxisSizeX) - xAxisTransform));

            var getValueFn: (index: number, type: ValueType) => any;
            getValueFn = data => data;
            var yAxis = d3.svg.axis()
                .scale(ys)
                .orient("left")
                .tickFormat(d => this.formatY.format(getValueFn(d, this.dataType)))
                .ticks(yAxisTicks);

            this.axisX
                .attr("transform", "translate(0, " + xAxisTransform + ")")
                .transition()
                .duration(duration)
                .call(xAxis);

            this.axisY
                .attr("transform", "translate(" + (this.AxisSizeY + this.margin.left) + ", 0)")
                .transition()
                .duration(duration)
                .call(yAxis);

            this.axisX
                .selectAll("text")
                .style("font-size", this.getXAxisFontSize(this.dataView) + "px");

            this.axisY
                .selectAll("text")
                .style("font-size", this.getYAxisFontSize(this.dataView) + "px");

            if (this.getShowMajorGridLines(this.dataView)) {
                var yMajorGrid = d3.svg.axis()
                    .scale(ys)
                    .orient("left")
                    .ticks(yAxisTicks)
                    .outerTickSize(0)
                    .innerTickSize(-(this.viewport.width - this.AxisSizeY - this.margin.right - this.margin.left));

                this.axisMajorGrid
                    .attr("transform", "translate(" + (this.AxisSizeY + this.margin.left) + ", 0)")
                    .attr("opacity", 1)
                    .transition()
                    .duration(duration)
                    .call(yMajorGrid);

                this.axisMajorGrid
                    .selectAll("line")
                    .style("stroke", this.getColorMajorGridLines(this.dataView))
                    .style("stroke-width", this.getSizeMajorGridLines(this.dataView));

                if (this.getShowMinorGridLines(this.dataView)) {
                    var yMinorGrid = d3.svg.axis()
                        .scale(ys)
                        .orient("left")
                        .ticks(yAxisTicks * 5)
                        .outerTickSize(0)
                        .innerTickSize(-(this.viewport.width - this.AxisSizeY - this.margin.right + this.margin.left));

                    this.axisMinorGrid
                        .attr("transform", "translate(" + (this.AxisSizeY + this.margin.left) + ", 0)")
                        .attr("opacity", 1)
                        .transition()
                        .duration(duration)
                        .call(yMinorGrid);

                    this.axisMinorGrid
                        .selectAll("line")
                        .style("stroke", this.getColorMinorGridLines(this.dataView))
                        .style("stroke-width", this.getSizeMinorGridLines(this.dataView));
                }
                else {

                    this.axisMinorGrid.attr("opacity", 0);
                }
            }
            else {
                this.axisMajorGrid.attr("opacity", 0);
                this.axisMinorGrid.attr("opacity", 0);
            }

            //Cleanup labelhelpers
            this.axisX.selectAll(".helperX").remove();
            this.axisY.selectAll(".helperY").remove();
        }

        private drawChart(dataPoints: BoxWhiskerChartDatapoint[][], xScale: d3.scale.Linear<any, any>, yScale: d3.scale.Linear<any, any>, duration: number): void {
            var dotRadius: number = 4,
                leftBoxMargin: number = 0.1;
            if (!this.getDataLabelShow(this.dataView)) {
                switch (this.getMarginType(this.dataView)) {
                    case BoxWhiskerTypeOptions.MarginType.Small:
                        leftBoxMargin = 0.05;
                        break;
                    case BoxWhiskerTypeOptions.MarginType.Medium:
                        leftBoxMargin = 0.1;
                        break;
                    case BoxWhiskerTypeOptions.MarginType.Large:
                        leftBoxMargin = 0.2;
                        break;
                    default:
                        leftBoxMargin = 0.1;
                        break;
                }
            }

            var stack = d3.layout.stack();
            var layers = stack(dataPoints);

            var sm = this.selectionManager;

            var selection = this.chart.selectAll(BoxWhiskerChart.ChartNode.selectorName).data(layers);

            selection
                .enter()
                .append('g')
                .classed(BoxWhiskerChart.ChartNode.className, true);

                var quartile = selection.selectAll(BoxWhiskerChart.ChartQuartileBox.selectorName).data(d => {
                if (d && d.length > 0) { return [d]; }
                return [];
            });

            this.svg.on('click', () => this.selectionManager.clear().then(() => quartile.style('opacity', 1)));

            var fontSize = this.getDataLabelFontSize(this.dataView) + "px";
            var dataLabelsShow = this.getDataLabelShow(this.dataView);

            var dataLabelwidth = xScale.invert(xScale(0) +
                (Math.ceil(
                    d3.max(dataPoints, (value) => {
                        return d3.max(value, (point) => {
                            return d3.max((point.dataLabels), (dataLabel) => {
                                return textMeasurementService.measureSvgTextWidth({
                                    text: this.formatY.format(dataLabel.value),
                                    fontFamily: this.defaultFontFamily,
                                    fontSize: PixelConverter.fromPoint(this.getDataLabelFontSize(this.dataView)),
                                });
                            });
                        });
                    })
                    * 10) / 10.));

            if (dataLabelwidth > 0.8) {
                dataLabelsShow = false;
            }

            var rightBoxMargin = 1. - (dataLabelsShow && (dataLabelwidth > leftBoxMargin) ? dataLabelwidth : leftBoxMargin);
            var boxMiddle = dataLabelsShow ? leftBoxMargin + ((rightBoxMargin - leftBoxMargin) / 2.) : 0.5;

            var quartileData = (points) => {
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

            var outlierData = (points) => {
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
                .attr('opacity', 1)
                .on('click', function (d) {
                    let dp:BoxWhiskerChartDatapoint = (<BoxWhiskerChartDatapoint>d[0]);
                    sm.select(dp.identity).then((ids) => {
                        if (ids.length > 0) {
                            quartile.style('opacity', 0.5);
                            d3.select(this).transition()
                                .duration(duration)
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
                .duration(duration)
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
                .style('fill', 'black')
                .transition()
                .duration(duration)
                .attr('d', avgData);

            average.exit().remove();

            var median = selection.selectAll(BoxWhiskerChart.ChartMedianLine.selectorName).data(d => {
                if (d && d.length > 0) { return [d]; }
                return [];
            });

            median
                .enter()
                .append('path')
                .classed(BoxWhiskerChart.ChartMedianLine.className, true);

            median
                .style('stroke', 'black')
                .style('stroke-width', 2)
                .transition()
                .duration(duration)
                .attr('d', medianData);

            median.exit().remove();

            var outliers = selection.selectAll(BoxWhiskerChart.ChartOutlierDot.selectorName).data(d => {
                let dp: BoxWhiskerChartDatapoint = <BoxWhiskerChartDatapoint>d[0];
                if (dp.outliers && dp.outliers.length > 0) {
                    return dp.outliers.map((dataPoint) => {
                        return [{
                            category: dp.category,
                            color: dp.color,
                            value: dataPoint
                        }
                        ];
                    });
                }
                return [];
            });

            outliers
                .enter()
                .append('path')
                .classed(BoxWhiskerChart.ChartOutlierDot.className, true);

            outliers
                .style('fill', value => value[0].color)
                .transition()
                .duration(duration)
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

                    var adjustment = 0;
                    var textHeight = (textMeasurementService.measureSvgTextHeight({
                        text: "XXXX",
                        fontFamily: this.defaultFontFamily,
                        fontSize: PixelConverter.fromPoint(this.getDataLabelFontSize(this.dataView)),
                    }) / 2) + 1;

                    for (var i = 1; i < topLabels.length; i++) {
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

            var y0 = this.viewport.height + this.AxisSizeX;

            dataLabels
                .attr("transform", dataLabel => `translate(0 ${y0}) scale(1, -1)`)
                .transition()
                .duration(duration)
                .text(dataLabel => this.formatY.format(dataLabel.value))
                .attr("x", dataLabel => dataLabel.x)
                .attr("y", dataLabel => y0 - dataLabel.y)
                .attr("fill", "black");

            this.chart
                .selectAll("text")
                .style("font-size", fontSize);

            dataLabels.exit().remove();

            this.tooltipServiceWrapper.addTooltip(this.svg.selectAll(BoxWhiskerChart.ChartQuartileBox.selectorName),
                (tooltipEvent: TooltipEventArgs<number>) => (<BoxWhiskerChartDatapoint>tooltipEvent.data[0]).tooltipInfo,
                (tooltipEvent: TooltipEventArgs<number>) => null);

            this.tooltipServiceWrapper.addTooltip(this.svg.selectAll(BoxWhiskerChart.ChartMedianLine.selectorName),
                (tooltipEvent: TooltipEventArgs<number>) => (<BoxWhiskerChartDatapoint>tooltipEvent.data[0]).tooltipInfo,
                (tooltipEvent: TooltipEventArgs<number>) => null);

            this.tooltipServiceWrapper.addTooltip(this.svg.selectAll(BoxWhiskerChart.ChartAverageDot.selectorName),
                (tooltipEvent: TooltipEventArgs<number>) => (<BoxWhiskerChartDatapoint>tooltipEvent.data[0]).tooltipInfo,
                (tooltipEvent: TooltipEventArgs<number>) => null);

            this.tooltipServiceWrapper.addTooltip(this.svg.selectAll(BoxWhiskerChart.ChartOutlierDot.selectorName),
                (tooltipEvent: TooltipEventArgs<number>) => (<BoxWhiskerChartDatapoint>tooltipEvent.data[0]).tooltipInfo,
                (tooltipEvent: TooltipEventArgs<number>) => null);

            selection.exit().remove();
        }

        private static getTooltipData(value: any): VisualTooltipDataItem[] { 
            return [{ 
                displayName: value.category, 
                value: value.value.toString(), 
                color: value.color 
            }]; 
        } 

        public getValueArray(nodes: any): Array<number> {
            var rArray: Array<number> = [];

            for (var i = 0; i < 50000; i++) {
                if (nodes[i] === undefined) {
                    break;
                }
                rArray.push(nodes[i].value);
            }

            return rArray;
        }

        private getAxisOptions(min: number, max: number): BoxWhiskerAxisOptions {
            var min1 = min === 0 ? 0 : min > 0 ? (min * .99) - ((max - min) / 100) : (min * 1.01) - ((max - min) / 100);
            var max1 = max === 0 ? min === 0 ? 1 : 0 : max < 0 ? (max * .99) + ((max - min) / 100) : (max * 1.01) + ((max - min) / 100);

            var p = Math.log(max1 - min1) / Math.log(10);
            var f = Math.pow(10, p - Math.floor(p));

            var scale = 0.2;

            if (f <= 1.2) scale = 0.2;
            else if (f <= 2.5) scale = 0.2;
            else if (f <= 5) scale = 0.5;
            else if (f <= 10) scale = 1;
            else scale = 2;

            var tickSize = scale * Math.pow(10, Math.floor(p));
            var maxValue = tickSize * (Math.floor(max1 / tickSize) + 1);
            var minValue = tickSize * Math.floor(min1 / tickSize);
            var ticks = ((maxValue - minValue) / tickSize) + 1;

            return {
                tickSize: tickSize,
                max: maxValue,
                min: minValue,
                ticks: ticks,
            };
        }

        private getWhiskerType(dataView: DataView): BoxWhiskerTypeOptions.ChartType {
            return DataViewObjectsModule.getValue(this.dataView.metadata.objects, BoxWhiskerChart.properties.whiskerType, BoxWhiskerTypeOptions.ChartType.MinMax);
        }

        private getMarginType(dataView: DataView): BoxWhiskerTypeOptions.MarginType {
            return DataViewObjectsModule.getValue(this.dataView.metadata.objects, BoxWhiskerChart.properties.marginType, BoxWhiskerTypeOptions.MarginType.Medium);
        }

        private getShowOutliers(dataView: DataView): boolean {
            return dataView.metadata && DataViewObjectsModule.getValue<boolean>(dataView.metadata.objects, BoxWhiskerChart.properties.showOutliers, false);
        }

        private getStaticColor(dataView: DataView): string {
            return DataViewObjectsModule.getFillColor(dataView.metadata.objects, BoxWhiskerChart.properties.fill, "#01b8aa");
        }

        private getXAxisFontSize(dataView: DataView): number {
            return DataViewObjectsModule.getValue<number>(dataView.metadata.objects, BoxWhiskerChart.properties.fontSizeXAxis, 11);
        }

        private getYAxisFontSize(dataView: DataView): number {
            return DataViewObjectsModule.getValue<number>(dataView.metadata.objects, BoxWhiskerChart.properties.fontSizeYAxis, 11);
        }

        private getShowMajorGridLines(dataView: DataView): boolean {
            return dataView.metadata && DataViewObjectsModule.getValue<boolean>(dataView.metadata.objects, BoxWhiskerChart.properties.showMajorGridLines, true);
        }

        private getSizeMajorGridLines(dataView: DataView): number {
            return DataViewObjectsModule.getValue<number>(dataView.metadata.objects, BoxWhiskerChart.properties.sizeMajorGridLines, 1);
        }

        private getColorMajorGridLines(dataView: DataView): string {
            return DataViewObjectsModule.getFillColor(dataView.metadata.objects, BoxWhiskerChart.properties.colorMajorGridLines, "#666666");
        }

        private getShowMinorGridLines(dataView: DataView): boolean {
            return dataView.metadata && DataViewObjectsModule.getValue<boolean>(dataView.metadata.objects, BoxWhiskerChart.properties.showMinorGridLines, false);
        }

        private getSizeMinorGridLines(dataView: DataView): number {
            return DataViewObjectsModule.getValue<number>(dataView.metadata.objects, BoxWhiskerChart.properties.sizeMinorGridLines, 1);
        }

        private getColorMinorGridLines(dataView: DataView): string {
            return DataViewObjectsModule.getFillColor(dataView.metadata.objects, BoxWhiskerChart.properties.colorMinorGridLines, "#9c9c9c");
        }

        private getDataLabelShow(dataView: DataView): boolean {
            return DataViewObjectsModule.getValue<boolean>(this.dataView.metadata.objects, BoxWhiskerChart.properties.dataLabelShow, false);
        }

        private getDataLabelFontSize(dataView: DataView): number {
            return DataViewObjectsModule.getValue<number>(dataView.metadata.objects, BoxWhiskerChart.properties.dataLabelFontSize, 11);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var instances: VisualObjectInstance[] = [];

            switch (options.objectName) {
                case "chartOptions":
                    var chartOptions: VisualObjectInstance = {
                        objectName: "chartOptions",
                        displayName: "Chart Options",
                        selector: null,
                        properties: {
                            whisker: this.getWhiskerType(this.dataView),
                            outliers: this.getShowOutliers(this.dataView),
                            margin: this.getMarginType(this.dataView),
                        }
                    };
                    instances.push(chartOptions);
                    break;
                case "dataPoint":
                    var categories = this.dataView.matrix.rows.root.children;
                    if (categories.length > 25) {
                        var dataPoint: VisualObjectInstance = {
                            objectName: "dataPoint",
                            displayName: "Fill color",
                            selector: null,
                            properties: {
                                fill: { solid: { color: this.getStaticColor(this.dataView) } }
                            }
                        };
                        instances.push(dataPoint);
                    } else {
                        for (var i = 0; i < categories.length; i++) {
                            var dataPoint: VisualObjectInstance = {
                                objectName: "dataPoint",
                                displayName: this.data.dataPoints[i][0].label,
                                selector: this.data.dataPoints[i][0].identity,
                                properties: {
                                    fill: { solid: { color: this.data.dataPoints[i][0].color } }
                                }
                            };
                            instances.push(dataPoint);
                        }
                    }
                    break;
                case "xAxis":
                    var xAxis: VisualObjectInstance = {
                        objectName: "xAxis",
                        displayName: "X-Axis",
                        selector: null,
                        properties: {
                            fontSize: this.getXAxisFontSize(this.dataView),
                        }
                    };
                    instances.push(xAxis);
                    break;
                case "yAxis":
                    var yAxis: VisualObjectInstance = {
                        objectName: "yAxis",
                        displayName: "Y-Axis",
                        selector: null,
                        properties: {
                            fontSize: this.getYAxisFontSize(this.dataView),
                        }
                    };
                    instances.push(yAxis);
                    break;
                case "gridLines":
                    var gridLines: VisualObjectInstance = {
                        objectName: "gridLines",
                        displayName: "Grid lines",
                        selector: null,
                        properties: {
                            majorGrid: this.getShowMajorGridLines(this.dataView),
                            majorGridSize: this.getSizeMajorGridLines(this.dataView),
                            majorGridColor: { solid: { color: this.getColorMajorGridLines(this.dataView) } },
                            minorGrid: this.getShowMinorGridLines(this.dataView),
                            minorGridSize: this.getSizeMinorGridLines(this.dataView),
                            minorGridColor: { solid: { color: this.getColorMinorGridLines(this.dataView) } },
                        }
                    };
                    instances.push(gridLines);
                    break;
                case "labels":
                    var labels: VisualObjectInstance = {
                        objectName: "labels",
                        displayName: "Data labels",
                        selector: null,
                        properties: {
                            show: this.getDataLabelShow(this.dataView),
                            fontSize: this.getDataLabelFontSize(this.dataView),
                        }
                    };
                    instances.push(labels);
                    break;
            }

            return instances;
        }
    }
}