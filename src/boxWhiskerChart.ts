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
    
    // utils.color
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId

    // powerbi.extensibility
    import IColorPalette = powerbi.extensibility.IColorPalette;
    import TooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

    import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;

    // d3
    import Selection = d3.Selection;

    export class BoxWhiskerChart implements IVisual {

        private static LocalizationStrings: jsCommon.IStringResourceProvider = {
            get: (stringId: string) => stringId,
            getOptional: (stringId: string) => stringId
        };

        public static formatStringProp: DataViewObjectPropertyIdentifier = {
            objectName: "general",
            propertyName: "formatString",
        };

        private static VisualClassName = "boxWhiskerChart";

        public static Axis: ClassAndSelector = createClassAndSelector("axis");
        public static AxisX: ClassAndSelector = createClassAndSelector("axisX")
        public static AxisY: ClassAndSelector = createClassAndSelector("axisY");
        public static AxisXLabel: ClassAndSelector = createClassAndSelector("axisXLabel")
        public static AxisYLabel: ClassAndSelector = createClassAndSelector("axisYLabel");
        public static AxisMajorGrid: ClassAndSelector = createClassAndSelector("axisMajorGrid");
        public static AxisMinorGrid: ClassAndSelector = createClassAndSelector("axisMinorGrid");
        public static ChartMain: ClassAndSelector = createClassAndSelector("chartMain");
        public static Chart: ClassAndSelector = createClassAndSelector("chart");
        public static ChartNode: ClassAndSelector = createClassAndSelector("chartNode");
        public static ChartQuartileBox: ClassAndSelector = createClassAndSelector("chartQuartileBox");
        public static ChartMedianLine: ClassAndSelector = createClassAndSelector("chartMedianLine");
        public static ChartAverageDot: ClassAndSelector = createClassAndSelector("chartAverageDot");
        public static ChartOutlierDot: ClassAndSelector = createClassAndSelector("chartOutlierDot");
        public static ChartDataLabel: ClassAndSelector = createClassAndSelector("chartDataLabel");
        public static ChartReferenceLineBackNode: ClassAndSelector = createClassAndSelector("chartReferenceLineBackNode");
        public static ChartReferenceLineFrontNode: ClassAndSelector = createClassAndSelector("chartReferenceLineFrontNode");
        public static ChartReferenceLine: ClassAndSelector = createClassAndSelector("chartReferenceLine");
        public static ChartReferenceLineLabel: ClassAndSelector = createClassAndSelector("chartReferenceLineLabel");

        private root: JQuery;
        private svg: Selection<any>;
        private axis: Selection<any>;
        private chartMain: Selection<any>;
        private settings: BoxWhiskerChartSettings;
        private axisX: Selection<any>;
        private axisY: Selection<any>;
        private axisXLabel: Selection<any>;
        private axisYLabel: Selection<any>;
        private axisMajorGrid: Selection<any>;
        private axisMinorGrid: Selection<any>;

        private mainGroupElement: Selection<any>;
        private colorPalette: IColorPalette;
        private selectionIdBuilder: ISelectionIdBuilder;
        private selectionManager: ISelectionManager;
        private hostServices: IVisualHost;
        private dataView: DataView;
        private data: BoxWhiskerChartData;
        private tooltipServiceWrapper: ITooltipServiceWrapper

        private dataType: ValueType;

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
                    dataPoints: [],
                    referenceLines: []
                };
            }
            let categories = dataView.matrix.rows.root.children;
            let category = dataView.categorical.categories[0];
            let categoryValues = [];
            let dataPoints: BoxWhiskerChartDatapoint[][] = [];
            let referenceLines: BoxWhiskerChartReferenceLine[] = referenceLineReadDataView(dataView.metadata.objects, colors);

            this.settings.xAxis.defaultTitle = category.source.displayName;
            this.settings.yAxis.defaultTitle = dataView.categorical.values[0].source.displayName;

            for (let i = 0, iLen = categories.length; i < iLen && i < 100; i++) {
                categoryValues.push(
                    this.getValueArray(dataView.matrix.rows.root.children[i].values)
                        .filter((value) => { return value != null; })
                );
            }
            let maxValue = d3.max(categoryValues, (val) => d3.max(val));

            this.settings.formatting.valuesFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(dataView.categorical.values[0].source),
                precision: this.settings.yAxis.labelPrecision,
                value: this.settings.yAxis.labelDisplayUnits || maxValue,
                cultureSelector: this.settings.general.locale
            });

            this.settings.formatting.categoryFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(dataView.categorical.categories[0].source),
                precision: this.settings.xAxis.labelPrecision,
                value: this.settings.xAxis.labelDisplayUnits || categories[0].value,
                cultureSelector: this.settings.general.locale
            });

            this.settings.formatting.labelFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(dataView.categorical.values[0].source),
                precision: this.settings.labels.labelPrecision,
                value: this.settings.labels.labelDisplayUnits || maxValue,
                cultureSelector: this.settings.general.locale
            });

            this.dataType = ValueType.fromDescriptor(dataView.matrix.valueSources[0].type);
            let hasStaticColor = categories.length > 15;
            let properties = {};
            let colorHelper: ColorHelper = new ColorHelper(
                colors,
                this.settings.general.ColorProperties,
                this.settings.general.defaultColor
            )

            let queryName = (category && category.source) ? category.source.queryName : undefined;

            for (let i = 0, iLen = categories.length; i < iLen && i < 100; i++) {
                let values = categoryValues[i];

                if (values.length === 0) {
                    break;
                }

                let selector = { data: [categories[i].identity], };
                let selectionId: ISelectionId = this.hostServices.createSelectionIdBuilder()
                        .withCategory(category, i)
                        .createSelectionId();
                let sortedValue = values.sort((n1, n2) => n1 - n2);

                let median
                let lowerValues;
                let higerValues;

                if ((this.settings.chartOptions.quartile === BoxWhiskerEnums.QuartileType.Exclusive) && (sortedValue.length % 2)) { // Exclusive and odd values
                    let medianValue = (sortedValue.length - 1) / 2;
                    median = sortedValue[medianValue];
                    lowerValues = $.extend(true, [], sortedValue);  // Copy values
                    lowerValues.splice(medianValue, 1);             // Remove median value
                    higerValues = lowerValues.splice(medianValue);  // Split lower and higer part
                } else {
                    let medianValue = (sortedValue.length - 1) / 2; // Easy median
                    median = (sortedValue[Math.floor(medianValue)] +
                             sortedValue[Math.ceil(medianValue)]) /2;
                    lowerValues = $.extend(true, [], sortedValue);  // Copy values
                    higerValues = $.extend(true, [], sortedValue);  // Copy values
                    lowerValues.splice(Math.floor(medianValue) + 1);
                    higerValues = higerValues.splice(Math.ceil(medianValue));
                }

                let qValue = (lowerValues.length - 1) / 2;
                let quartile1 = sortedValue.length <= 2 ? null :
                            (lowerValues[Math.floor(qValue)] +
                            lowerValues[Math.ceil(qValue)]) / 2;
                let quartile3 = sortedValue.length <= 2 ? null :
                            (higerValues[Math.floor(qValue)] +
                            higerValues[Math.ceil(qValue)]) / 2;

                let ttl: number = 0;
                sortedValue.forEach(value => { ttl += value; });
                let avgvalue = ttl / sortedValue.length;

                let minValue;
                let maxValue;
                let minValueLabel;
                let maxValueLabel;
                let quartileValue;
                let whiskerValue;
                let whiskerType: BoxWhiskerEnums.WhiskerType = this.settings.chartOptions.whisker;

                if (!quartile1 || !quartile3) {
                    whiskerType = BoxWhiskerEnums.WhiskerType.MinMax;
                }

                switch (whiskerType) {
                    case BoxWhiskerEnums.WhiskerType.Standard:
                        var IQR = quartile3 - quartile1;
                        minValue = sortedValue.filter((value) => value >= quartile1 - (1.5 * IQR))[0];
                        maxValue = sortedValue.filter((value) => value <= quartile3 + (1.5 * IQR)).reverse()[0];
                        minValueLabel = "Minimum";
                        maxValueLabel = "Maximum";
                        quartileValue = this.settings.chartOptions.quartile === BoxWhiskerEnums.QuartileType.Exclusive ? "Exclusive" : "Inclusive" ;
                        whiskerValue = "< 1.5IQR";
                        break;
                    case BoxWhiskerEnums.WhiskerType.IQR:
                        var IQR = quartile3 - quartile1;
                        minValue = quartile1 - (1.5 * IQR);
                        maxValue = quartile3 + (1.5 * IQR);
                        minValueLabel = "Q1 - 1.5 x IQR";
                        maxValueLabel = "Q3 + 1.5 x IQR";
                        quartileValue = this.settings.chartOptions.quartile === BoxWhiskerEnums.QuartileType.Exclusive ? "Exclusive" : "Inclusive" ;
                        whiskerValue = "= 1.5IQR";
                        break;
                    case BoxWhiskerEnums.WhiskerType.Custom:
                        this.settings.chartOptions.lower = Math.max(this.settings.chartOptions.lower || 0, Math.ceil(100/(sortedValue.length + 1)));
                        this.settings.chartOptions.higher = Math.min(this.settings.chartOptions.higher || 100, Math.floor(100-(100/(sortedValue.length + 1))));
                        var xl = (this.settings.chartOptions.lower / 100.) * (sortedValue.length + 1);
                        var xh = (this.settings.chartOptions.higher / 100.) * (sortedValue.length + 1);
                        var il = Math.floor(xl);
                        var ih = Math.floor(xh);
                        var high = sortedValue[ih-1] + (xh-ih)*(sortedValue[ih] - sortedValue[ih-1]);
                        var low = sortedValue[il-1] + (xl-il)*(sortedValue[il] - sortedValue[il-1]);
                        minValue = low;
                        maxValue = high;
                        minValueLabel = "Lower: " + this.settings.chartOptions.lower.toString() + "%";
                        maxValueLabel = "Higher: " + this.settings.chartOptions.higher.toString() + "%";
                        quartileValue = this.settings.chartOptions.quartile === BoxWhiskerEnums.QuartileType.Exclusive ? "Exclusive" : "Inclusive" ;
                        whiskerValue = "Custom";
                        break;
                    case BoxWhiskerEnums.WhiskerType.MinMax:
                    default:
                        minValue = sortedValue[0];
                        maxValue = sortedValue[sortedValue.length - 1];
                        minValueLabel = "Minimum";
                        maxValueLabel = "Maximum";
                        quartileValue = this.settings.chartOptions.quartile === BoxWhiskerEnums.QuartileType.Exclusive ? "Exclusive" : "Inclusive" ;
                        whiskerValue = "Min/Max";
                        break;
                }

                dataPoints.push([]);

                let dataPointColor: string;

                if (this.settings.dataPoint.oneColor) {
                    if (category.objects && category.objects[0]) {
                        dataPointColor = colorHelper.getColorForMeasure(category.objects[0], "");
                    } else {
                        dataPointColor = colors.getColor("0").value;
                    }
                } else {
                    if (category.objects && category.objects[i]) {
                        dataPointColor = colorHelper.getColorForMeasure(category.objects[i], "");
                    } else {
                        dataPointColor = colors.getColor(i.toString()).value;
                    }
                }
                
                let outliers: BoxWhiskerChartOutlier[] = this.settings.chartOptions.outliers ?
                    sortedValue
                        .filter((value) => value < minValue || value > maxValue) // Filter outliers 
                        .filter((value, index, self) => self.indexOf(value) === index) // Make unique
                        .map((value) => { 
                            return { 
                                category: i + 1,
                                color: dataPointColor, 
                                value: value, 
                                tooltipInfo: [
                                    {
                                        displayName: "Category",
                                        value: categories[0].value === undefined
                                            ? dataView.matrix.valueSources[0].displayName
                                            : this.settings.formatting.categoryFormatter.format(categories[i].value),
                                    },
                                    {
                                        displayName: "Value",
                                        value: value
                                    }
                                ]
                            }
                        })
                    : [];

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
                    dataLabels: (this.settings.labels.show) ?
                        [maxValue, minValue, avgvalue, median, quartile1, quartile3]
                            .filter((value, index, self) => self.indexOf(value) === index) // Make unique
                            .filter((value) => { return value != null; }) // Remove empties
                            .map((dataPoint) => { return { value: dataPoint, x: 0, y: 0, visible: 1 }; })
                            .concat(outliers.map((outlier) => { return { value: outlier.value, x: 0, y: 0, visible: 1 }; }))
                        : [],
                    label: categories[0].value === undefined
                        ? dataView.matrix.valueSources[0].displayName
                        : this.settings.formatting.categoryFormatter.format(categories[i].value),
                    selectionId: selectionId,
                    color: dataPointColor,
                    tooltipInfo: [
                        {
                            displayName: "Category",
                            value: categories[0].value === undefined
                                ? dataView.matrix.valueSources[0].displayName
                                : this.settings.formatting.categoryFormatter.format(categories[i].value),
                        },
                        {
                            displayName: "Quartile Calculation",
                            value: quartileValue
                        },
                        {
                            displayName: "Whisker Type",
                            value: whiskerValue
                        },
                        {
                            displayName: "# Samples",
                            value: valueFormatter.format(sortedValue.length, 'd', false),
                        },
                        {
                            displayName: maxValueLabel,
                            value: this.settings.formatting.valuesFormatter.format(maxValue),
                        },
                        {
                            displayName: "Quartile 3",
                            value: this.settings.formatting.valuesFormatter.format(quartile3),
                        },
                        {
                            displayName: "Median",
                            value: this.settings.formatting.valuesFormatter.format(median),
                        },
                        {
                            displayName: "Average",
                            value: this.settings.formatting.valuesFormatter.format(avgvalue),
                        },
                        {
                            displayName: "Quartile 1",
                            value: this.settings.formatting.valuesFormatter.format(quartile1),
                        },
                        {
                            displayName: minValueLabel,
                            value: this.settings.formatting.valuesFormatter.format(minValue),
                        }]
                });
            }
            return {
                dataPoints: dataPoints,
                referenceLines: referenceLines,
            };
        }

        constructor(options: VisualConstructorOptions) {
            if (options.element) {
                this.root = $(options.element);
            }
            
            let element = options.element;
            this.hostServices = options.host;
            this.colorPalette = options.host.colorPalette;
            this.selectionIdBuilder = options.host.createSelectionIdBuilder();
            this.selectionManager = options.host.createSelectionManager();
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.hostServices.tooltipService, options.element);
            
            this.settings = BoxWhiskerChart.parseSettings(this.dataView);
            this.settings.general.locale = options.host.locale;

            if (!this.svg) {
                this.svg = d3.select(this.root.get(0))
                    .append('svg')
                    .classed(BoxWhiskerChart.VisualClassName, true);
            }
            
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

            this.axisXLabel = this.axis
                .append("text")
                .classed(BoxWhiskerChart.AxisXLabel.className, true);

            this.axisYLabel = this.axis
                .append("text")
                .classed(BoxWhiskerChart.AxisYLabel.className, true);

            this.chartMain = this.mainGroupElement
                .append("g")
                .classed(BoxWhiskerChart.ChartMain.className, true);
            
            let backRefLine = this.chartMain
                .append("g")
                .classed(BoxWhiskerChart.ChartReferenceLineBackNode.className, true);

            let chart = this.chartMain
                .append("g")
                .classed(BoxWhiskerChart.Chart.className, true);

            let frontRefLine = this.chartMain
                .append("g")
                .classed(BoxWhiskerChart.ChartReferenceLineFrontNode.className, true);

            }

        public update(options: VisualUpdateOptions): void {
            if (!options ||
                !options.dataViews ||
                !options.dataViews[0] ||
                !options.viewport) {
                return;
            }

            this.dataView = options.dataViews ? options.dataViews[0] : undefined;
            if (!this.dataView) {
                return;
            }

            this.settings = BoxWhiskerChart.parseSettings(this.dataView);

            let dataView = this.dataView = options.dataViews[0],
                data = this.data = this.converter(dataView, this.colorPalette),
                dataPoints = data.dataPoints;

            this.settings.general.viewport = {
                height: options.viewport.height > 0 ? options.viewport.height : 0,
                width: options.viewport.width > 0 ? options.viewport.width : 0
            };    

            this.svg
                .attr({
                    'height': this.settings.general.viewport.height,
                    'width': this.settings.general.viewport.width
                });

            this.chartMain.attr('transform', 'scale(1, -1)' + translate(0, -(this.settings.general.viewport.height - this.settings.axis.axisSizeX)));

            // calculate scalefactor
            let stack = d3.layout.stack();
            let layers = stack(dataPoints);
            let refLines = this.data.referenceLines;

            this.settings.axis.axisOptions = getAxisOptions(
                d3.min([
                    d3.min(refLines, (refLine) => refLine.value),
                    d3.min(layers, (layer) => {
                        return d3.min(layer, (point) => {
                            return  d3.min([(<BoxWhiskerChartDatapoint>point).min, 
                                    d3.min((<BoxWhiskerChartDatapoint>point).outliers, (outlier) => outlier.value)]);
                        });
                    })
                ]),
                d3.max([
                    d3.max(refLines, (refLine) => refLine.value),
                    d3.max(layers, (layer) => {
                        return d3.max(layer, (point) => {
                            return  d3.max([(<BoxWhiskerChartDatapoint>point).max, 
                                    d3.max((<BoxWhiskerChartDatapoint>point).outliers, (outlier) => outlier.value)]);
                        });
                    })
                ]));

            if (this.settings.yAxis.start !== undefined) {
                if (this.settings.yAxis.start <= this.settings.axis.axisOptions.min) {
                    this.settings.axis.axisOptions.min = this.settings.yAxis.start;
                } else {
                    this.settings.yAxis.start = this.settings.axis.axisOptions.min;
                }
            }

            if (this.settings.yAxis.end !== undefined) {
                if (this.settings.yAxis.end >= this.settings.axis.axisOptions.max) {
                    this.settings.axis.axisOptions.max = this.settings.yAxis.end;
                } else {
                    this.settings.yAxis.end = this.settings.axis.axisOptions.max;
                }
            }

            if (this.data.dataPoints.length > 0) {
                // calculate AxisSizeX, AxisSizeY
                if (this.settings.xAxis.show) {
                    this.settings.axis.axisSizeX = textMeasurementService.measureSvgTextHeight(
                        this.settings.xAxis.axisTextProperties,
                        "X"
                    );

                    if (this.settings.xAxis.showTitle) {
                        this.settings.axis.axisLabelSizeX = textMeasurementService.measureSvgTextHeight(
                            this.settings.xAxis.titleTextProperties,
                            this.settings.formatting.categoryFormatter.format(this.settings.xAxis.title || this.settings.xAxis.defaultTitle)
                        );
                        this.settings.axis.axisSizeX += this.settings.axis.axisLabelSizeX;
                    }
                }

                if (this.settings.yAxis.show) {
                    for (let i = this.settings.axis.axisOptions.min; i < this.settings.axis.axisOptions.max; i += this.settings.axis.axisOptions.tickSize) {
                        let tempSize = textMeasurementService.measureSvgTextWidth(
                            this.settings.yAxis.axisTextProperties,
                            this.settings.formatting.valuesFormatter.format(i));
                        this.settings.axis.axisSizeY = tempSize > this.settings.axis.axisSizeY ? tempSize : this.settings.axis.axisSizeY
                    }
                    this.settings.axis.axisSizeY += + 5; // Axis width itself

                    if (this.settings.yAxis.showTitle) {
                        this.settings.axis.axisLabelSizeY = textMeasurementService.measureSvgTextHeight(
                            this.settings.yAxis.titleTextProperties,
                            this.settings.formatting.valuesFormatter.format(this.settings.yAxis.title || this.settings.yAxis.defaultTitle)
                        );
                        this.settings.axis.axisSizeY += this.settings.axis.axisLabelSizeY;
                    }
                }

                this.settings.general.margin.top = textMeasurementService.measureSvgTextHeight(
                    this.settings.yAxis.axisTextProperties,
                    this.settings.formatting.valuesFormatter.format(this.settings.axis.axisOptions.max || 0)
                ) / 2.;

                if (this.settings.labels.show && this.data.dataPoints.length > 0) {
                    let dataLabelTop = textMeasurementService.measureSvgTextHeight(
                        this.settings.yAxis.axisTextProperties,
                        this.settings.formatting.valuesFormatter.format(this.data.dataPoints[0][0].dataLabels[0].value)
                    ) / 2.;
                }
            }

            var yScale = d3.scale.linear()
                .domain([this.settings.axis.axisOptions.min || 0, this.settings.axis.axisOptions.max || 0])
                .range([this.settings.general.margin.bottom + this.settings.axis.axisSizeX, this.settings.general.viewport.height - this.settings.general.margin.top]);

            var xScale = d3.scale.linear()
                .domain([1, dataPoints.length + 1])
                .range([this.settings.general.margin.left + this.settings.axis.axisSizeY, this.settings.general.viewport.width - this.settings.general.margin.right]);

            drawReferenceLines(
                this.svg, 
                this.settings, 
                this.data.referenceLines,
                yScale,
                false);
            drawChart(
                this.svg, 
                this.settings, 
                this.selectionManager, 
                this.tooltipServiceWrapper, 
                dataPoints, 
                xScale, 
                yScale);
            drawReferenceLines(
                this.svg, 
                this.settings, 
                this.data.referenceLines,
                yScale,
                true);
            drawAxis(
                this.axis, 
                this.settings, 
                dataPoints, 
                yScale);
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

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration{
            const instanceEnumeration: VisualObjectInstanceEnumeration = BoxWhiskerChartSettings.enumerateObjectInstances(
                this.settings || BoxWhiskerChartSettings.getDefault(),
                options);
            if (options.objectName === "general") {
                return;
            }
            
            let instances : VisualObjectInstance[] = [];

            switch (options.objectName) {
                case "chartOptions":
                    this.removeEnumerateObject(instanceEnumeration, "orientation");
                    switch (this.settings.chartOptions.whisker) {
                        case BoxWhiskerEnums.WhiskerType.MinMax:
                            this.removeEnumerateObject(instanceEnumeration, "outliers");
                        case BoxWhiskerEnums.WhiskerType.IQR:
                        case BoxWhiskerEnums.WhiskerType.Standard:
                            this.removeEnumerateObject(instanceEnumeration, "lower");
                            this.removeEnumerateObject(instanceEnumeration, "higher");
                    }
                case "xAxis":
                    if (this.settings.chartOptions.orientation === BoxWhiskerEnums.ChartOrientation.Vertical) {
                        this.removeEnumerateObject(instanceEnumeration, "labelDisplayUnits");
                        this.removeEnumerateObject(instanceEnumeration, "labelPrecision");
                    }
                    if (!this.settings.xAxis.showTitle) {
                        this.removeEnumerateObject(instanceEnumeration, "title");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontColor");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontSize");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontFamily");
                        this.removeEnumerateObject(instanceEnumeration, "titleAlignment");
                    }
                    break;
                case "yAxis":
                    if (this.settings.chartOptions.orientation === BoxWhiskerEnums.ChartOrientation.Horizontal) {
                        this.removeEnumerateObject(instanceEnumeration, "labelDisplayUnits");
                        this.removeEnumerateObject(instanceEnumeration, "labelPrecision");
                    }
                    if (!this.settings.yAxis.showTitle) {
                        this.removeEnumerateObject(instanceEnumeration, "title");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontColor");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontSize");
                        this.removeEnumerateObject(instanceEnumeration, "titleFontFamily");
                        this.removeEnumerateObject(instanceEnumeration, "titleAlignment");
                    }
                    break;                    
                case "dataPoint":
                    instances = dataPointEnumerateObjectInstances(this.data.dataPoints, this.colorPalette, this.settings.dataPoint.oneColor);
                    break;
                case "y1AxisReferenceLine":
                    instances = referenceLineEnumerateObjectInstances(this.data.referenceLines, this.colorPalette);
                    break;
            }
            instances.forEach((instance: VisualObjectInstance) => { this.addAnInstanceToEnumeration(instanceEnumeration, instance) })
            return instanceEnumeration;
        }

        public addAnInstanceToEnumeration(instanceEnumeration: VisualObjectInstanceEnumeration, instance: VisualObjectInstance): void {
            if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
                (instanceEnumeration as VisualObjectInstanceEnumerationObject)
                    .instances
                    .push(instance);
            } else {
                (instanceEnumeration as VisualObjectInstance[]).push(instance);
            }
        }

        public removeEnumerateObject(instanceEnumeration: VisualObjectInstanceEnumeration, objectName: string): void {
            if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
                delete (instanceEnumeration as VisualObjectInstanceEnumerationObject)
                    .instances[0].properties[objectName]
            } else {
                delete (instanceEnumeration as VisualObjectInstance[])[0].properties[objectName]
            }
        }

        public destroy(): void {
        }

        private static parseSettings(dataView: DataView): BoxWhiskerChartSettings {
            let settings: BoxWhiskerChartSettings = BoxWhiskerChartSettings.parse<BoxWhiskerChartSettings>(dataView);
            settings.yAxis.axisTextProperties = {
                fontFamily: settings.yAxis.fontFamily,
                fontSize: settings.yAxis.fontSize + "px"
            }
            settings.yAxis.titleTextProperties = {
                fontFamily: settings.yAxis.titleFontFamily,
                fontSize: settings.yAxis.titleFontSize + "px"
            }
            settings.xAxis.axisTextProperties = {
                fontFamily: settings.xAxis.fontFamily,
                fontSize: settings.xAxis.fontSize + "px"
            }
            settings.xAxis.titleTextProperties = {
                fontFamily: settings.xAxis.titleFontFamily,
                fontSize: settings.xAxis.titleFontSize + "px"
            }
            settings.labels.axisTextProperties = {
                fontFamily: settings.labels.fontFamily,
                fontSize: settings.labels.fontSize + "px"
            }

            if (settings.chartOptions.higher > 100) { settings.chartOptions.higher = 100; }
            if (settings.chartOptions.higher < 75) { settings.chartOptions.higher = 75; }
            if (settings.chartOptions.lower > 25) { settings.chartOptions.lower = 25; }
            if (settings.chartOptions.lower < 0) { settings.chartOptions.lower = 0; }
            return settings;
        }
    }
}