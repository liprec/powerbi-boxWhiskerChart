/*
 *
 * Copyright (c) 2019 Jan Pieter Posthuma / DataScenarios
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
import { getObject } from "powerbi-visuals-utils-dataviewutils/lib/dataViewObjects";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { max, min } from "d3-array";

import DataView = powerbi.DataView;
import DataViewHierarchyLevel = powerbi.DataViewHierarchyLevel;
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import IViewPort = powerbi.IViewport;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

import { PerfTimer } from "./perfTimer";
import { QuartileType, TraceEvents, WhiskerType } from "./enums";
import { parseSettings, Settings } from "./settings";
import {
    BoxLabels,
    BoxPlot,
    BoxPlotSeries,
    BoxValues,
    BoxWhiskerChartData,
    Legend,
    LookupColor,
    SinglePoint,
} from "./data";
import { referenceLineReadDataView } from "./refLines";

const seriesRole = "Legend";
const categoryRole = "Groups";
const sampleRole = "Samples";
const valueRole = "Values";

// tslint:disable-next-line: max-func-body-length
export function converter(
    dataView: DataView | undefined,
    viewPort: IViewPort,
    host: IVisualHost,
    colors: ISandboxExtendedColorPalette,
    locale: string
): BoxWhiskerChartData | undefined {
    const timer = PerfTimer.START(TraceEvents.convertor, true);
    if (!checkValidDataview(dataView)) {
        timer();
        return;
    }
    const settings = parseSettings(<DataView>dataView);

    const metadata = dataView && dataView.metadata && dataView.metadata.columns;
    const rows = <DataViewMatrixNode[]>(
        (dataView &&
            dataView.matrix &&
            dataView.matrix.rows &&
            dataView.matrix.rows.root &&
            dataView.matrix.rows.root.children)
    );
    const rowLevels = <DataViewHierarchyLevel[]>(
        (dataView && dataView.matrix && dataView.matrix.rows && dataView.matrix.rows.levels)
    );
    const columns = <DataViewMatrixNode[]>(
        (dataView &&
            dataView.matrix &&
            dataView.matrix.columns &&
            dataView.matrix.columns.root &&
            dataView.matrix.columns.root.children)
    );

    const seriesColumns: DataViewMetadataColumn[] = <DataViewMetadataColumn[]>(
        metadata?.filter((column: DataViewMetadataColumn) => (column.roles ? column.roles[seriesRole] : false))
    );
    const seriesColumn = seriesColumns && seriesColumns[0];
    settings.general.hasSeries = !!seriesColumn;
    const categoryColumn: DataViewMetadataColumn = <DataViewMetadataColumn>(
        metadata?.filter((column: DataViewMetadataColumn) => (column.roles ? column.roles[categoryRole] : false))[0]
    );
    const valueColumn: DataViewMetadataColumn = <DataViewMetadataColumn>(
        metadata?.filter((column: DataViewMetadataColumn) => (column.roles ? column.roles[valueRole] : false))[0]
    );
    const sampleColumns: string[] = <string[]>(
        metadata
            ?.filter((column: DataViewMetadataColumn) => (column.roles ? column.roles[sampleRole] : false))
            ?.map((column: DataViewMetadataColumn) => column.displayName)
    );

    // Do we have the minimal data to show the chart?
    if (!categoryColumn || !valueColumn) {
        timer();
        return;
    }

    // if (!settings.general.hasSeries && !(dataView && dataView.metadata && dataView.metadata.objects)) {
    //     settings.chartOptions.categoryLegend = false;
    // }

    settings.xAxis.defaultTitle = categoryColumn.displayName;
    settings.yAxis.defaultTitle = valueColumn.displayName;

    if (seriesColumn) {
        settings.xAxis.defaultTitle = seriesColumn.displayName;
        settings.formatting.seriesFormatter = valueFormatter.create({
            format: seriesColumn.format,
            value: rows[0],
            cultureSelector: settings.general.locale,
        });
    }

    settings.formatting.categoryFormatter = valueFormatter.create({
        format: categoryColumn.format,
        value: rows[0].children ? rows[0].children[0] : rows[0],
        cultureSelector: settings.general.locale,
    });

    const legend: Legend[] = [];
    const series: BoxPlotSeries[] = getSeries(
        rows,
        host,
        rowLevels,
        legend,
        dataView,
        colors,
        settings.chartOptions.categoryLegend,
        settings.general.hasSeries,
        settings.xAxis.defaultTitle,
        settings.dataPoint.oneFill
    );

    settings.dataPoint.oneFill = null;

    if (settings.dataPoint.persist) {
        settings.dataPoint.colorConfig = JSON.stringify(
            legend.map((legend: Legend) => {
                return {
                    name: legend.legend,
                    color: legend.color,
                };
            })
        );
    } else {
        settings.dataPoint.colorConfig = settings.dataPoint.colorConfig === "" ? "[]" : settings.dataPoint.colorConfig;
    }

    const colorList: LookupColor[] = JSON.parse(settings.dataPoint.colorConfig);
    updateLegendColors(legend, colorList);

    const { min, max } = calculateBoxPlots(
        series,
        host,
        rows,
        rowLevels,
        legend,
        sampleColumns,
        settings,
        columns.length,
        !settings.general.hasSeries
    );

    // const minValues: number[] = [];
    // const maxValues: number[] = [];
    // const hasHighlight = settings.shapes.highlight && rows[0].values && rows[0].values[0].highlight !== undefined;

    // const boxPlots: BoxPlot[] = rows
    //     .map((r: DataViewMatrixNode, index: number) => {
    //         let deviceSelectionId = host.createSelectionIdBuilder().withMatrixNode(r, rowLevels);
    //         return (r.children ? r.children : [r]).map((row: DataViewMatrixNode, index: number) => {
    //             deviceSelectionId = row.children ? deviceSelectionId.withMatrixNode(row, rowLevels) : deviceSelectionId;
    //             const parent = r.value === row.value ? undefined : r.value;
    //             const boxPlot: BoxPlot = {
    //                 name: row.value,
    //                 parent,
    //                 selectionId: deviceSelectionId.createSelectionId(),
    //             } as BoxPlot;

    //             const color = getColorByIndex(index, index.toString(), dataView?.metadata.objects, "dataPoint", colors);

    //             const sampleValues: number[] = [];
    //             const highlightValues: number[] = [];
    //             const samples = [...Array(numberOfSamples).keys()].map((index) =>
    //                 row.values ? row.values[index] : undefined
    //             ) as powerbi.DataViewMatrixNodeValue[];
    //             samples.map((value) => {
    //                 if (settings.chartOptions.includeEmpty || value.value !== null)
    //                     sampleValues.push(value.value as number);
    //                 if (hasHighlight && (settings.chartOptions.includeEmpty || value.value !== null))
    //                     highlightValues.push(value.value as number);
    //             });

    //             const sortedValue = sampleValues.sort((pValue: number, cValue: number) => pValue - cValue);
    //             const baseValues = calculateBaseValues(sortedValue, settings);
    //             minValues.push(baseValues.min);
    //             maxValues.push(baseValues.max);
    //             if (!baseValues.quartile1 || !baseValues.quartile3) settings.chartOptions.whisker = WhiskerType.MinMax;
    //             const boxValues = calculateBoxWhisker(baseValues, sortedValue, settings);

    //             boxPlot.dataPoint = {
    //                 min: boxValues.minValue,
    //                 max: boxValues.maxValue,
    //                 quartile1: baseValues.quartile1,
    //                 quartile3: baseValues.quartile3,
    //                 median: baseValues.median,
    //                 average: baseValues.average,
    //                 samples: sortedValue.length,
    //                 dataLabels: settings.labels.show
    //                     ? [
    //                           boxValues.maxValue,
    //                           boxValues.minValue,
    //                           baseValues.average,
    //                           baseValues.median,
    //                           baseValues.quartile1,
    //                           baseValues.quartile3,
    //                       ]
    //                           .filter((value) => {
    //                               return value != null;
    //                           }) // Remove empties
    //                           .map((dataPoint) => {
    //                               return { value: dataPoint, visible: 1 };
    //                           })
    //                           //   .concat(
    //                           //       outliers.map((outlier) => {
    //                           //           return { value: outlier.value, x: 0, y: 0, visible: 1 };
    //                           //       })
    //                           //   )
    //                           .filter((value, index, self) => self.indexOf(value) === index) // Make unique
    //                     : [],
    //                 outliers: [],
    //                 label: settings.formatting.categoryFormatter.format(row.value),
    //                 color,
    //                 fillColor: colors.isHighContrast ? colors.background.value : color,
    //             };

    //             return boxPlot;
    //         });
    //     })
    //     .reduce((array: BoxPlot[], value: BoxPlot[]) => array.concat(value), []);

    settings.formatting.valuesFormatter = valueFormatter.create({
        format: valueColumn.format,
        precision: settings.yAxis.labelPrecision || undefined,
        value: settings.yAxis.labelDisplayUnits || max,
        cultureSelector: settings.general.locale,
    });

    settings.formatting.labelFormatter = valueFormatter.create({
        format: valueColumn.format,
        precision: settings.labels.labelPrecision || undefined,
        value: settings.labels.labelDisplayUnits || max,
        cultureSelector: settings.general.locale,
    });

    settings.formatting.toolTipFormatter = valueFormatter.create({
        format: valueColumn.format,
        precision: settings.toolTip.labelPrecision || undefined,
        value: settings.toolTip.labelDisplayUnits || max,
        cultureSelector: settings.general.locale,
    });

    settings.general.width = viewPort.width - 2 * settings.general.padding;
    settings.general.height = viewPort.height - 2 * settings.general.padding;

    settings.general.orientation = settings.chartOptions.orientation;

    const categories = series
        .map((series: BoxPlotSeries) => series.boxPlots.map((boxPlot: BoxPlot) => boxPlot.name))
        .flat()
        .filter((value, index, self) => self.indexOf(value) === index);
    const dataRange = [min, max];

    const refLines = referenceLineReadDataView(dataView?.metadata.objects, colors);

    timer();
    return <BoxWhiskerChartData>{
        categories,
        dataRange,
        legend,
        series,
        referenceLines: refLines,
        settings,
    };
}

function calculateBoxPlots(
    series: BoxPlotSeries[],
    host: IVisualHost,
    rows: DataViewMatrixNode[],
    rowLevels: powerbi.DataViewHierarchyLevel[],
    legend: Legend[],
    sampleColumns: string[],
    settings: Settings,
    numberOfSamples: number,
    oneSeries: boolean
): { min: number; max: number } {
    const minValues: number[] = [];
    const maxValues: number[] = [];
    const hasHighlight = settings.shapes.highlight && rows[0].values && rows[0].values[0].highlight !== undefined;
    series.map((series: BoxPlotSeries, index: number) => {
        const categories = <DataViewMatrixNode[]>(
            (oneSeries ? rows : settings.general.hasSeries ? rows[index].children : [rows[index]])
        );
        series.boxPlots = categories.map((category: DataViewMatrixNode) => {
            const seriesSelectionId = host
                .createSelectionIdBuilder()
                .withMatrixNode(rows[index], rowLevels)
                .createSelectionId();
            const selectionId = oneSeries
                ? host.createSelectionIdBuilder().withMatrixNode(category, rowLevels).createSelectionId()
                : host
                      .createSelectionIdBuilder()
                      .withMatrixNode(rows[index], rowLevels)
                      .withMatrixNode(category, rowLevels)
                      .createSelectionId();
            const legendItem = legend.filter(
                (l: Legend) => l.legend === <string>series.name || l.legend === <string>category.value
            );
            const boxPlot: BoxPlot = <BoxPlot>{
                key: -1,
                name: category.value,
                series: !oneSeries && series.name,
                color: legendItem[0].color,
                fillColor: settings.shapes.boxFill ? legendItem[0].color : null,
                isHighlight: true,
                selectionId,
                legendselectionId: legendItem[0].selectionId,
                seriesSelectionId: oneSeries ? undefined : seriesSelectionId,
            };

            const sampleValues: number[] = [];
            const highlightValues: number[] = [];
            const samples = [...Array(numberOfSamples).keys()].map((index) =>
                category.values ? category.values[index] : undefined
            ) as powerbi.DataViewMatrixNodeValue[];
            samples.map((value) => {
                if (settings.chartOptions.includeEmpty || value.value !== null)
                    sampleValues.push(value.value as number);
                if (hasHighlight && (settings.chartOptions.includeEmpty || value.value !== null))
                    highlightValues.push(value.value as number);
            });
            const sortedValue = sampleValues.sort((pValue: number, cValue: number) => pValue - cValue);

            const { boxValues, boxLabels, min, max } = calculateBoxWhisker(sortedValue, sampleColumns, settings);

            minValues.push(min);
            maxValues.push(max);
            boxPlot.boxValues = boxValues;
            boxPlot.boxLabels = boxLabels;
            boxPlot.tooltip = getTooltip;

            const { innerPoints, outliers } = getOutliers(sortedValue, boxPlot, settings);
            boxPlot.innerPoints = innerPoints;
            boxPlot.outliers = outliers;

            return boxPlot;
        });
    });

    return { min: <number>min(minValues), max: <number>max(maxValues) };
}

function getSeries(
    rows: powerbi.DataViewMatrixNode[],
    host: IVisualHost,
    rowLevels: powerbi.DataViewHierarchyLevel[],
    legend: Legend[],
    dataView: powerbi.DataView | undefined,
    colors: ISandboxExtendedColorPalette,
    categoryLegend: boolean,
    hasSeries: boolean,
    noSeriesTitle: string,
    oldColor: string | null
): BoxPlotSeries[] {
    if (!categoryLegend && !hasSeries) {
        legend.push({
            index: legend.length,
            legend: noSeriesTitle,
            color:
                oldColor === null
                    ? getColorByIndex(
                          legend.length,
                          legend.length.toString(),
                          dataView?.metadata.objects,
                          "dataPoint",
                          colors
                      )
                    : oldColor,
        });
        return [{ key: -1, name: noSeriesTitle, boxPlots: [] }];
    }
    return rows.map((row: DataViewMatrixNode) => {
        const serieSelectionId = host.createSelectionIdBuilder().withMatrixNode(row, rowLevels).createSelectionId();
        const seriesName = <string>row.value?.toLocaleString();
        const series: BoxPlotSeries = {
            key: -1,
            name: seriesName,
            boxPlots: [],
            selectionId: serieSelectionId,
        };
        const legendValues =
            categoryLegend && hasSeries
                ? row.children?.map((child: DataViewMatrixNode) => {
                      return {
                          name: <string>child.value?.toLocaleString(),
                          selectionId: host
                              .createSelectionIdBuilder()
                              .withMatrixNode(child, rowLevels)
                              .createSelectionId(),
                      };
                  })
                : [{ name: seriesName, selectionId: serieSelectionId }];
        legendValues?.forEach((value: { name: string; selectionId: ISelectionId }) => {
            if (!legend.some((s: Legend) => s.legend === value.name)) {
                legend.push({
                    index: legend.length,
                    legend: value.name,
                    color: getColorByIndex(
                        legend.length + 1,
                        (legend.length + 1).toString(),
                        dataView?.metadata.objects,
                        "dataPoint",
                        colors
                    ),
                    selectionId: value.selectionId,
                });
            }
        });
        return series;
    });
}

function calculateBoxWhisker(
    values: number[],
    sampleColumns: string[],
    settings: Settings
): { boxValues: BoxValues; boxLabels: BoxLabels; min: number; max: number } {
    let boxValues, boxLabels;
    // calculate base values
    const corr = settings.chartOptions.quartile === QuartileType.Exclusive ? 1 : -1;
    const corr1 = settings.chartOptions.quartile === QuartileType.Exclusive ? 0 : 1;
    const q1 = 0.25 * (values.length + corr) + corr1;
    const m = 0.5 * (values.length + corr) + corr1;
    const q3 = 0.75 * (values.length + corr) + corr1;
    const q1l = Math.floor(q1);
    const ml = Math.floor(m);
    const q3l = Math.floor(q3);
    const quartile1 = values[q1l - 1] + (q1 - q1l) * (values[q1l] - values[q1l - 1]);
    const median = values[ml - 1] + (m - ml) * (values[ml] - values[ml - 1]);
    const quartile3 = values[q3l - 1] + (q3 - q3l) * (values[q3l] - values[q3l - 1]);
    const total = values.reduce((pValue: number, cValue: number) => pValue + cValue);
    const mean = total / values.length;
    const min = values[0];
    const max = values[values.length - 1];

    if (!quartile1 || !quartile3) settings.chartOptions.whisker = WhiskerType.MinMax;

    boxValues = {
        max,
        min,
        mean,
        median,
        samples: values.length,
        total,
        quartile1,
        quartile3,
    };

    let IQR: number = 0;
    switch (settings.chartOptions.whisker) {
        case WhiskerType.Standard:
            IQR = quartile3 - quartile1;
            boxValues.min = values.filter((value) => value >= quartile1 - 1.5 * IQR)[0];
            boxValues.max = values.filter((value) => value <= quartile3 + 1.5 * IQR).reverse()[0];
            boxLabels = {
                minValueLabel: "Minimum",
                maxValueLabel: "Maximum",
                quartileValue: settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive",
                whiskerValue: "< 1.5IQR",
                sampleColumns,
            };
            break;
        case WhiskerType.IQR:
            IQR = quartile3 - quartile1;
            boxValues.min = quartile1 - 1.5 * IQR;
            boxValues.max = quartile3 + 1.5 * IQR;
            boxLabels = {
                minValueLabel: "Q1 - 1.5 x IQR",
                maxValueLabel: "Q3 + 1.5 x IQR",
                quartileValue: settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive",
                whiskerValue: "= 1.5IQR",
                sampleColumns,
            };
            break;
        case WhiskerType.Custom:
            let lower = Math.max(settings.chartOptions.lower || 0, Math.ceil(100 / (values.length + 1)));
            let higher = Math.min(settings.chartOptions.higher || 100, Math.floor(100 - 100 / (values.length + 1)));
            let xl = (lower / 100) * (values.length + corr) + corr1;
            let xh = (higher / 100) * (values.length + corr) + corr1;
            let il = Math.floor(xl);
            let ih = Math.floor(xh);
            boxValues.min = values[il - 1] + (xl - il) * ((values[il] || 0) - values[il - 1]); // Escape index out of bound
            boxValues.max = values[ih - 1] + (xh - ih) * ((values[ih] || 0) - values[ih - 1]); // Escape index out of bound
            boxLabels = {
                minValueLabel: "Lower: " + lower.toString() + "%",
                maxValueLabel: "Higher: " + higher.toString() + "%",
                quartileValue: settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive",
                whiskerValue: "Custom",
                sampleColumns,
            };
            break;
        case WhiskerType.MinMax:
        default:
            boxLabels = {
                minValueLabel: "Minimum",
                maxValueLabel: "Maximum",
                quartileValue: settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive",
                whiskerValue: "Min/Max",
                sampleColumns,
            };
            break;
    }

    return { boxValues, boxLabels, min, max };
}

function getTooltip(this: BoxPlot, settings: Settings): VisualTooltipDataItem[] {
    return [
        {
            displayName: "Series",
            value: <string>this.series,
        },
        {
            displayName: "Category",
            value: this.name,
        },
        {
            displayName: "Quartile Calculation",
            value: this.boxLabels.quartileValue,
        },
        {
            displayName: "Whisker Type",
            value: this.boxLabels.whiskerValue,
        },
        {
            displayName: "# Samples",
            value: valueFormatter.format(this.boxValues.samples, "d", false),
        },
        {
            displayName: "Sampling",
            value: this.boxLabels.sampleColumns.join(",\n"),
        },
        {
            displayName: this.boxLabels.maxValueLabel,
            value: settings.formatting.toolTipFormatter.format(this.boxValues.max),
        },
        {
            displayName: "Quartile 3",
            value: settings.formatting.toolTipFormatter.format(this.boxValues.quartile3),
        },
        {
            displayName: "Median",
            value: settings.formatting.toolTipFormatter.format(this.boxValues.median),
        },
        {
            displayName: "Mean",
            value: settings.formatting.toolTipFormatter.format(this.boxValues.mean),
        },
        {
            displayName: "Quartile 1",
            value: settings.formatting.toolTipFormatter.format(this.boxValues.quartile1),
        },
        {
            displayName: this.boxLabels.minValueLabel,
            value: settings.formatting.toolTipFormatter.format(this.boxValues.min),
        },
    ].filter((item) => !!item.value);
}

function getPointTooltip(this: SinglePoint, settings: Settings): VisualTooltipDataItem[] {
    return [
        {
            displayName: "Series",
            value: <string>this.series,
        },
        {
            displayName: "Category",
            value: this.category,
        },
        {
            displayName: "Type",
            value: this.typ,
        },
        {
            displayName: "Value",
            value: settings.formatting.toolTipFormatter.format(this.value),
        },
    ].filter((item) => !!item.value);
}

function getOutliers(
    sortedValue: number[],
    boxPlot: BoxPlot,
    settings: Settings
): { innerPoints: SinglePoint[]; outliers: SinglePoint[] } {
    const transForm = (value: number, typ: string, r: number, fill: boolean): SinglePoint => {
        return {
            key: -1,
            color: boxPlot.color,
            r,
            typ,
            fill,
            value,
            category: boxPlot.name,
            series: boxPlot.series,
            isHighlight: boxPlot.isHighlight,
            singlePointtooltip: getPointTooltip,
        };
    };

    const innerPoints: SinglePoint[] = settings.shapes.showPoints
        ? sortedValue
              .filter((value: number) => value >= boxPlot.boxValues.min && value <= boxPlot.boxValues.max)
              .map((value: number) => transForm(value, "Point", settings.shapes.pointRadius, settings.shapes.pointFill))
        : [];
    const outliers: SinglePoint[] = settings.shapes.showOutliers
        ? sortedValue
              .filter((value: number) => value < boxPlot.boxValues.min || value > boxPlot.boxValues.max)
              .map((value: number) =>
                  transForm(value, "Outlier", settings.shapes.outlierRadius, settings.shapes.outlierFill)
              )
        : [];

    return { innerPoints, outliers };
}

export function checkValidDataview(dataView?: DataView) {
    // Only check if the dataView contains a valid matrix
    return !!(
        dataView &&
        dataView.matrix &&
        dataView.matrix.rows &&
        dataView.matrix.rows.levels &&
        dataView.matrix.rows.levels.length > 0 &&
        dataView.matrix.rows.root &&
        dataView.matrix.rows.root.children &&
        dataView.matrix.columns &&
        dataView.matrix.columns.levels &&
        dataView.matrix.columns.levels.length > 0 &&
        dataView.matrix.columns.root &&
        dataView.matrix.columns.root.children
    );
}

function updateLegendColors(legend: Legend[], colorList: LookupColor[]) {
    if (colorList.length === 0) return;
    legend.forEach((legend: Legend) => {
        const lookupColor = colorList.filter((coloritem) => coloritem.name === legend.legend);
        if (lookupColor.length > 0) legend.color = lookupColor[0].color;
    });
}

function getColorByIndex(
    index: number,
    queryName: string,
    objects: powerbi.DataViewObjects | undefined,
    capability: string,
    colorPalette: ISandboxExtendedColorPalette
): string {
    if (objects) {
        const color = getObject(objects, capability);
        if (color) {
            const instance = color.$instances;
            if (instance) {
                const setting = instance[index];
                if (setting) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return (<any>setting.fill).solid.color;
                }
            }
        }
    }

    return colorPalette.getColor(queryName).value;
}
