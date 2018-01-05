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

    // utils.tooltip
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import createTooltipServiceWrapper = powerbi.extensibility.utils.tooltip.createTooltipServiceWrapper;
    
    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId

    // powerbi.extensibility
    import IColorPalette = powerbi.extensibility.IColorPalette;
    import TooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
    import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;

    // powerbi.extensibility.data
    import SelectionId = powerbi.extensibility.data.SelectionId;

    import telemetry = powerbi.extensibility.utils.telemetry;
    // d3
    import Selection = d3.Selection;

    import Selector = powerbi.data.Selector;

    export interface ISQExpr extends powerbi.data.ISQExpr {
        ref: string
    }

    export class BoxWhiskerChart implements IVisual {

        private static LocalizationStrings: jsCommon.IStringResourceProvider = {
            get: (stringId: string) => stringId,
            getOptional: (stringId: string) => stringId
        };

        public static formatStringProp: DataViewObjectPropertyIdentifier = {
            objectName: "general",
            propertyName: "formatString",
        };

        // Trace messages
        private traceEvents = {
            convertor: 'BoxWhiskerChart1455240051538: Convertor method',
            update: 'BoxWhiskerChart1455240051538: Update method',
            drawChart: 'BoxWhiskerChart1455240051538: DrawChart method',
            drawAxis: 'BoxWhiskerChart1455240051538: DrawAxis method'
        }

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
        public static ChartNodeOutliers: ClassAndSelector = createClassAndSelector("chartNodeOutliers");
        public static ChartNodeHighLight: ClassAndSelector = createClassAndSelector("chartNodeHighLight");
        public static ChartQuartileBox: ClassAndSelector = createClassAndSelector("chartQuartileBox");
        public static ChartQuartileBoxHighlight: ClassAndSelector = createClassAndSelector("chartQuartileBoxHighlight");
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
            let timer = telemetry.PerfTimer.start(this.traceEvents.convertor, this.settings.general.telemetry);
            if (!dataView ||
                !dataView.matrix ||
                !dataView.matrix.columns ||
                !dataView.matrix.columns.root.children ||
                !(dataView.matrix.columns.root.children.length > 0) ||
                !(dataView.matrix.columns.root.children[0].levelValues) ||
                !dataView.matrix.valueSources ||
                !(dataView.matrix.valueSources.length > 0) ||
                !dataView.matrix.valueSources[0]) {
                return {
                    dataPoints: [],
                    dataPointLength: 0,
                    categories: [],
                    referenceLines: [],
                    isHighLighted: false
                };
            }

            let categories = dataView.matrix.rows.root.children;
            let category = dataView.categorical.categories[0];
            let samples = dataView.matrix.columns.levels;
            let valueSources = dataView.matrix.valueSources;
            let categoryValues = [];
            let highlightValues = [];
            let sampleValues = [];
            let dataPoints: BoxWhiskerChartDatapoint[][] = [];
            let referenceLines: BoxWhiskerChartReferenceLine[] = referenceLineReadDataView(dataView.metadata.objects, colors);
            let maxPoints = this.settings.general.maxPoints;
            let types = 1;
            this.settings.xAxis.defaultTitle = dataView.metadata.columns.filter((d) => { return d.index===1 })[0].displayName;
            this.settings.yAxis.defaultTitle = dataView.metadata.columns.filter((d) => { return d.index===0 })[0].displayName;;
            let categoriesLables = [];

            let hasHighlight = this.settings.shapes.highlight && categories[0].values[0].highlight!==undefined;

            for (let c=0; c<categories.length;c++) {
                let values = categories[c].values;
                let categoryValue = [];
                for (let v=0; v<maxPoints;v++) {
                    let value = values[v.toString()];
                    if (value && value.value) {
                        if (!this.settings.shapes.highlight) {
                            if (value.highlight) {
                                categoryValue.push(value.highlight);
                            }
                        } else {
                            categoryValue.push(value.value);
                        }
                    }
                }
                categoryValues.push(categoryValue);
            }

            if (hasHighlight) {
                types = 2;
                for (let c=0; c<categories.length;c++) {
                    let values = categories[c].values;
                    let categoryValue = [];
                    for (let v=0; v<maxPoints;v++) {
                        let value = values[v.toString()];
                        if (value && value.highlight) {
                            categoryValue.push(value.highlight);
                        }
                    }
                    highlightValues.push(categoryValue);
                }
            }

            for (let s=0;s<samples.length;s++) {
                sampleValues.push(samples[s].sources[0].displayName);
            }

            let maxValue = d3.max(categoryValues, (val) => d3.max(val));

            this.settings.formatting.valuesFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(valueSources[0]),
                precision: this.settings.yAxis.labelPrecision,
                value: this.settings.yAxis.labelDisplayUnits || maxValue,
                cultureSelector: this.settings.general.locale
            });

            this.settings.formatting.categoryFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(categoryValues[0]),
                precision: this.settings.xAxis.labelPrecision,
                value: this.settings.xAxis.labelDisplayUnits || categories[0].value,
                cultureSelector: this.settings.general.locale
            });

            this.settings.formatting.labelFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(valueSources[0]),
                precision: this.settings.labels.labelPrecision,
                value: this.settings.labels.labelDisplayUnits || maxValue,
                cultureSelector: this.settings.general.locale
            });

            this.dataType = ValueType.fromDescriptor(valueSources[0].type);
            let hasStaticColor = categories.length > 15;
            let properties = {};
            let colorHelper: ColorHelper = new ColorHelper(
                colors,
                this.settings.general.ColorProperties,
                this.settings.general.defaultColor
            )

            for (let t = 0; t < types; t++) {
                for (let i = 0, iLen = categories.length; i < iLen && i < 100; i++) {
                    let values = t==1 ? highlightValues[i] : categoryValues[i];
                    if ((t===0) && ((values.length !== 0) || this.settings.shapes.fixedCategory)) {
                        categoriesLables.push(this.settings.formatting.categoryFormatter.format(categories[i].value));
                    }

                    if (values.length !== 0) {
                        let selectionId = new SelectionId({ data: [ categories[i].identity ]}, false);
                        let sortedValue = values.sort((n1, n2) => n1 - n2);

                        // Exclusive / Inclusive array correction
                        let corr = this.settings.chartOptions.quartile === BoxWhiskerEnums.QuartileType.Exclusive ? 1 : -1;
                        let corr1 = this.settings.chartOptions.quartile === BoxWhiskerEnums.QuartileType.Exclusive ? 0 : 1;
                        let q1 = (0.25 * (sortedValue.length + corr)) + corr1;
                        let m  = (0.50 * (sortedValue.length + corr)) + corr1;
                        let q3 = (0.75 * (sortedValue.length + corr)) + corr1;
                        let q1l = Math.floor(q1);
                        let ml  = Math.floor(m);
                        let q3l = Math.floor(q3);
                        let quartile1 = sortedValue[q1l-1] + (q1-q1l)*(sortedValue[q1l] - sortedValue[q1l-1]);
                        let median    = sortedValue[ml-1] + (m-ml)*(sortedValue[ml] - sortedValue[ml-1]);
                        let quartile3 = sortedValue[q3l-1] + (q3-q3l)*(sortedValue[q3l] - sortedValue[q3l-1]);

                        let ttl: number = 0;
                        sortedValue.forEach(value => { ttl += value; });
                        let avgvalue = ttl / sortedValue.length;

                        let minValue, maxValue, minValueLabel, maxValueLabel,
                            quartileValue, whiskerValue, IQR,
                            whiskerType: BoxWhiskerEnums.WhiskerType = this.settings.chartOptions.whisker;

                        if (!quartile1 || !quartile3) {
                            whiskerType = BoxWhiskerEnums.WhiskerType.MinMax;
                        }

                        switch (whiskerType) {
                            case BoxWhiskerEnums.WhiskerType.Standard:
                                IQR = quartile3 - quartile1;
                                minValue = sortedValue.filter((value) => value >= quartile1 - (1.5 * IQR))[0];
                                maxValue = sortedValue.filter((value) => value <= quartile3 + (1.5 * IQR)).reverse()[0];
                                minValueLabel = "Minimum";
                                maxValueLabel = "Maximum";
                                quartileValue = this.settings.chartOptions.quartile === BoxWhiskerEnums.QuartileType.Exclusive ? "Exclusive" : "Inclusive" ;
                                whiskerValue = "< 1.5IQR";
                                break;
                            case BoxWhiskerEnums.WhiskerType.IQR:
                                IQR = quartile3 - quartile1;
                                minValue = quartile1 - (1.5 * IQR);
                                maxValue = quartile3 + (1.5 * IQR);
                                minValueLabel = "Q1 - 1.5 x IQR";
                                maxValueLabel = "Q3 + 1.5 x IQR";
                                quartileValue = this.settings.chartOptions.quartile === BoxWhiskerEnums.QuartileType.Exclusive ? "Exclusive" : "Inclusive" ;
                                whiskerValue = "= 1.5IQR";
                                break;
                            case BoxWhiskerEnums.WhiskerType.Custom:
                                let lower = Math.max(this.settings.chartOptions.lower || 0, Math.ceil(100/(sortedValue.length + 1)));
                                let higher = Math.min(this.settings.chartOptions.higher || 100, Math.floor(100-(100/(sortedValue.length + 1))));
                                let xl = ((lower / 100.) * (sortedValue.length + corr)) + corr1;
                                let xh = ((higher / 100.) * (sortedValue.length + corr)) + corr1;
                                let il = Math.floor(xl);
                                let ih = Math.floor(xh);
                                let high = sortedValue[ih-1] + (xh-ih)*((sortedValue[ih] || 0) - sortedValue[ih-1]); // Escape index out of bound
                                let low = sortedValue[il-1] + (xl-il)*((sortedValue[il] || 0) - sortedValue[il-1]);  // Escape index out of bound
                                minValue = low;
                                maxValue = high;
                                minValueLabel = "Lower: " + lower.toString() + "%";
                                maxValueLabel = "Higher: " + higher.toString() + "%";
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

                        let dataPointColor: string;

                        if (this.settings.dataPoint.oneColor) {
                            if (this.settings.dataPoint.oneFill === undefined) {
                                this.settings.dataPoint.oneFill = colors.getColor("0").value;
                            }
                            dataPointColor = this.settings.dataPoint.oneFill;
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
                                        category: i,
                                        color: dataPointColor, 
                                        value: value,
                                        highlight: t===1 || !hasHighlight,
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

                        let dataPoint: BoxWhiskerChartDatapoint = {
                            x:0,
                            y:0,
                            min: minValue,
                            max: maxValue,
                            quartile1: quartile1,
                            quartile3: quartile3,
                            median: median,
                            average: avgvalue,
                            samples: sortedValue.length,
                            category: i,
                            outliers: outliers,
                            dataLabels: (this.settings.labels.show) ?
                                [maxValue, minValue, avgvalue, median, quartile1, quartile3]
                                    .filter((value) => { return value != null; }) // Remove empties
                                    .map((dataPoint) => { return { value: dataPoint, x: 0, y: 0, visible: 1 }; })
                                    .concat(outliers.map((outlier) => { return { value: outlier.value, x: 0, y: 0, visible: 1 }; }))
                                    .filter((value, index, self) => self.indexOf(value) === index) // Make unique
                                : [],
                            label: this.settings.formatting.categoryFormatter.format(categories[i].value),
                            highlight: t===1 || !hasHighlight,
                            selectionId: selectionId,
                            color: dataPointColor,
                            tooltipInfo: (t===0 && hasHighlight) ? undefined : [
                                {
                                    displayName: "Category",
                                    value: this.settings.formatting.categoryFormatter.format(categories[i].value),
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
                                    displayName: "Sampling",
                                    value: sampleValues.join(',\n')
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
                        }
                        let updated = false;
                        dataPoints.forEach((dp: BoxWhiskerChartDatapoint[], index: number) => {
                            if ((dataPoint.category===dp[0].category) && (dataPoint.average===dp[0].average)) {
                                dataPoints[index][0] = dataPoint;
                                updated = true;
                            }
                        });
                        if (!updated) {
                            dataPoints.push([dataPoint]);
                        }
                    }
                }
            }
            timer();
            return {
                dataPoints: dataPoints,
                dataPointLength: (this.settings.shapes.highlight || this.settings.shapes.fixedCategory) ? categories.length : dataPoints.length,
                categories: categoriesLables,
                referenceLines: referenceLines,
                isHighLighted: hasHighlight
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
            let timer = telemetry.PerfTimer.start(this.traceEvents.update, this.settings.general.telemetry);
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

            let axisSettings: BoxWhiskerAxisSettings = calcAxisSettings(this.settings, this.data);

            if (this.settings.yAxis.start !== undefined) {
                if (this.settings.yAxis.start <= axisSettings.axisOptions.min) {
                    axisSettings.axisOptions.min = this.settings.yAxis.start;
                } else {
                    this.settings.yAxis.start = axisSettings.axisOptions.min;
                }
            }
            
            if (this.settings.yAxis.end !== undefined) {
                if (this.settings.yAxis.end >= axisSettings.axisOptions.max) {
                    axisSettings.axisOptions.max = this.settings.yAxis.end;
                } else {
                    this.settings.yAxis.end = axisSettings.axisOptions.max;
                }
            }
            
            this.settings.general.margin.top = this.settings.formatting.valuesFormatter ?
            textMeasurementService.measureSvgTextHeight(
                this.settings.yAxis.axisTextProperties,
                this.settings.formatting.valuesFormatter.format(axisSettings.axisOptions.max || 0)
            ) / 2. : 5;

            let timerAxis = telemetry.PerfTimer.start(this.traceEvents.drawAxis, this.settings.general.telemetry);
            drawAxis(
                this.axis, 
                this.settings, 
                this.data,
                axisSettings);
            timerAxis();
            timer();
            drawReferenceLines(
                this.svg, 
                this.settings, 
                this.data.referenceLines,
                axisSettings,
                false);
            let timerChart = telemetry.PerfTimer.start(this.traceEvents.drawChart, this.settings.general.telemetry);
            drawChart(
                this.svg, 
                this.settings, 
                this.selectionManager, 
                this.tooltipServiceWrapper, 
                this.data, 
                axisSettings);
            timerChart();
            drawReferenceLines(
                this.svg, 
                this.settings, 
                this.data.referenceLines,
                axisSettings,
                true);
            
        }

        private static getTooltipData(value: any): VisualTooltipDataItem[] { 
            return [{ 
                displayName: value.category, 
                value: value.value.toString(), 
                color: value.color 
            }]; 
        } 

        public getValueArray(nodes: any): Array<number> {
            let rArray: Array<number> = [];

            for (let i = 0; i < 50000; i++) {
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
                //return;
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
                    break;
                case "shapes":
                    if (this.settings.shapes.highlight) {
                        this.removeEnumerateObject(instanceEnumeration, "fixedCategory");
                    }
                    break;
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
                if (!this.settings.dataPoint.oneColor) {
                    this.removeEnumerateObject(instanceEnumeration, "oneFill");
                    instances = dataPointEnumerateObjectInstances(this.data.dataPoints, this.colorPalette, this.settings.dataPoint.oneColor);
                }
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