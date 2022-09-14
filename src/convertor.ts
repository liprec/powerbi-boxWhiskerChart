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

import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

import DataView = powerbi.DataView;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewHierarchyLevel = powerbi.DataViewHierarchyLevel;
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewTableRow = powerbi.DataViewTableRow;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
import IViewPort = powerbi.IViewport;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import getObject = dataViewObjects.getObject;

import { PerfTimer } from "./perfTimer";
import { QuartileType, TraceEvents, WhiskerType } from "./enums";
import { parseSettings, Settings } from "./settings";
import { BaseValues, BoxPlot, BoxValues, BoxWhiskerChartData } from "./data";
import { max, min } from "d3";

const categoryRole = "Groups";
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
    const settings = parseSettings(dataView as DataView);
    const metadata = dataView && dataView.metadata && dataView.metadata.columns;
    const rows = (dataView &&
        dataView.matrix &&
        dataView.matrix.rows &&
        dataView.matrix.rows.root &&
        dataView.matrix.rows.root.children) as DataViewMatrixNode[];
    const rowLevels = (dataView &&
        dataView.matrix &&
        dataView.matrix.rows &&
        dataView.matrix.rows.levels) as DataViewHierarchyLevel[];
    const columns = (dataView &&
        dataView.matrix &&
        dataView.matrix.columns &&
        dataView.matrix.columns.root &&
        dataView.matrix.columns.root.children) as DataViewMatrixNode[];
    const categoryColumn: DataViewMetadataColumn = metadata?.filter((c: DataViewMetadataColumn) =>
        c.roles ? c.roles[categoryRole] : false
    )[0] as DataViewMetadataColumn;
    const valueColumn: DataViewMetadataColumn = metadata?.filter((c: DataViewMetadataColumn) =>
        c.roles ? c.roles[valueRole] : false
    )[0] as DataViewMetadataColumn;

    settings.formatting.categoryFormatter = valueFormatter.create({
        format: categoryColumn.format,
        value: rows[0],
        cultureSelector: settings.general.locale,
    });

    const minValues: number[] = [];
    const maxValues: number[] = [];
    const numberOfSamples = columns.length;
    const hasHighlight = settings.shapes.highlight && rows[0].values && rows[0].values[0].highlight !== undefined;

    const boxPlots: BoxPlot[] = rows
        .map((r: DataViewMatrixNode, index: number) => {
            let deviceSelectionId = host.createSelectionIdBuilder().withMatrixNode(r, rowLevels);
            return (r.children ? r.children : [r]).map((row: DataViewMatrixNode, index: number) => {
                deviceSelectionId = row.children ? deviceSelectionId.withMatrixNode(row, rowLevels) : deviceSelectionId;
                const parent = r.value === row.value ? undefined : r.value;
                const boxPlot: BoxPlot = {
                    name: row.value,
                    parent,
                    selectionId: deviceSelectionId.createSelectionId(),
                } as BoxPlot;

                const color = getColorByIndex(index, index.toString(), dataView?.metadata.objects, "dataPoint", colors);

                const sampleValues: number[] = [];
                const highlightValues: number[] = [];
                const samples = [...Array(numberOfSamples).keys()].map((index) => row.values[index]);
                samples.map((value) => {
                    if (settings.chartOptions.includeEmpty || value.value !== null)
                        sampleValues.push(value.value as number);
                    if (hasHighlight && (settings.chartOptions.includeEmpty || value.value !== null))
                        highlightValues.push(value.value as number);
                });

                const sortedValue = sampleValues.sort((pValue: number, cValue: number) => pValue - cValue);
                const baseValues = calculateBaseValues(sortedValue, settings);
                minValues.push(baseValues.min);
                maxValues.push(baseValues.max);
                if (!baseValues.quartile1 || !baseValues.quartile3) settings.chartOptions.whisker = WhiskerType.MinMax;
                const boxValues = calculateBoxWhisker(baseValues, sortedValue, settings);

                boxPlot.dataPoint = {
                    min: boxValues.minValue,
                    max: boxValues.maxValue,
                    quartile1: baseValues.quartile1,
                    quartile3: baseValues.quartile3,
                    median: baseValues.median,
                    average: baseValues.average,
                    samples: sortedValue.length,
                    dataLabels: settings.labels.show
                        ? [
                              boxValues.maxValue,
                              boxValues.minValue,
                              baseValues.average,
                              baseValues.median,
                              baseValues.quartile1,
                              baseValues.quartile3,
                          ]
                              .filter((value) => {
                                  return value != null;
                              }) // Remove empties
                              .map((dataPoint) => {
                                  return { value: dataPoint, visible: 1 };
                              })
                              //   .concat(
                              //       outliers.map((outlier) => {
                              //           return { value: outlier.value, x: 0, y: 0, visible: 1 };
                              //       })
                              //   )
                              .filter((value, index, self) => self.indexOf(value) === index) // Make unique
                        : [],
                    outliers: [],
                    label: settings.formatting.categoryFormatter.format(row.value),
                    color,
                    fillColor: colors.isHighContrast ? colors.background.value : color,
                };

                return boxPlot;
            });
        })
        .reduce((array: BoxPlot[], value: BoxPlot[]) => array.concat(value), []);

    settings.formatting.valuesFormatter = valueFormatter.create({
        format: valueColumn.format,
        precision: settings.yAxis.labelPrecision || undefined,
        value: settings.yAxis.labelDisplayUnits || max(maxValues),
        cultureSelector: settings.general.locale,
    });

    settings.formatting.labelFormatter = valueFormatter.create({
        format: valueColumn.format,
        precision: settings.labels.labelPrecision || undefined,
        value: settings.labels.labelDisplayUnits || max(maxValues),
        cultureSelector: settings.general.locale,
    });

    settings.formatting.toolTipFormatter = valueFormatter.create({
        format: valueColumn.format,
        precision: settings.toolTip.labelPrecision || undefined,
        value: settings.toolTip.labelDisplayUnits || max(maxValues),
        cultureSelector: settings.general.locale,
    });

    settings.xAxis.defaultTitle = categoryColumn.displayName;
    settings.yAxis.defaultTitle = valueColumn.displayName;

    settings.general.width = viewPort.width - 2 * settings.general.padding;
    settings.general.height = viewPort.height - 2 * settings.general.padding;

    settings.general.orientation = settings.chartOptions.orientation;

    const dataRange = [min(minValues), max(maxValues)];

    timer();
    return <BoxWhiskerChartData>{
        boxPlots,
        dataRange,
        settings,
    };
}

function calculateBaseValues(values: number[], settings: Settings): BaseValues {
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
    const average = total / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    return { min, max, average, median, total, quartile1, quartile3, quartileCorrection: [corr, corr1] };
}

function calculateBoxWhisker(baseValues: BaseValues, values: any[], settings: Settings): BoxValues {
    let IQR: number = 0;
    switch (settings.chartOptions.whisker) {
        case WhiskerType.Standard:
            IQR = baseValues.quartile3 - baseValues.quartile1;
            return {
                IQR,
                minValue: values.filter((value: any) => value >= baseValues.quartile1 - 1.5 * IQR)[0],
                maxValue: values.filter((value: any) => value <= baseValues.quartile3 + 1.5 * IQR).reverse()[0],
                minValueLabel: "Minimum",
                maxValueLabel: "Maximum",
                quartileValue: settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive",
                whiskerValue: "< 1.5IQR",
            };
        case WhiskerType.IQR:
            IQR = baseValues.quartile3 - baseValues.quartile1;
            return {
                IQR,
                minValue: baseValues.quartile1 - 1.5 * IQR,
                maxValue: baseValues.quartile3 + 1.5 * IQR,
                minValueLabel: "Q1 - 1.5 x IQR",
                maxValueLabel: "Q3 + 1.5 x IQR",
                quartileValue: settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive",
                whiskerValue: "= 1.5IQR",
            };
        case WhiskerType.Custom:
            let lower = Math.max(settings.chartOptions.lower || 0, Math.ceil(100 / (values.length + 1)));
            let higher = Math.min(settings.chartOptions.higher || 100, Math.floor(100 - 100 / (values.length + 1)));
            let xl =
                (lower / 100) * (values.length + baseValues.quartileCorrection[0]) + baseValues.quartileCorrection[1];
            let xh =
                (higher / 100) * (values.length + baseValues.quartileCorrection[0]) + baseValues.quartileCorrection[1];
            let il = Math.floor(xl);
            let ih = Math.floor(xh);
            let high = values[ih - 1] + (xh - ih) * ((values[ih] || 0) - values[ih - 1]); // Escape index out of bound
            let low = values[il - 1] + (xl - il) * ((values[il] || 0) - values[il - 1]); // Escape index out of bound
            return {
                minValue: low,
                maxValue: high,
                minValueLabel: "Lower: " + lower.toString() + "%",
                maxValueLabel: "Higher: " + higher.toString() + "%",
                quartileValue: settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive",
                whiskerValue: "Custom",
            };
        case WhiskerType.MinMax:
        default:
            return {
                minValue: values[0],
                maxValue: values[values.length - 1],
                minValueLabel: "Minimum",
                maxValueLabel: "Maximum",
                quartileValue: settings.chartOptions.quartile === QuartileType.Exclusive ? "Exclusive" : "Inclusive",
                whiskerValue: "Min/Max",
            };
    }
}

export function checkValidDataview(dataView?: DataView) {
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

function getColorByIndex(
    index: number,
    queryName: string,
    objects: powerbi.DataViewObjects | undefined,
    capability: string,
    colorPalette: ISandboxExtendedColorPalette
): string {
    if (objects) {
        const color: any = getObject(objects, capability);
        if (color) {
            const instance: any = color.$instances;
            if (instance) {
                const setting: any = instance[index];
                if (setting) {
                    return setting.fill.solid.color;
                }
            }
        }
    }

    return colorPalette.getColor(queryName).value;
}
