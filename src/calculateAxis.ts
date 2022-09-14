/*
 *
 * Copyright (c) 2021 Jan Pieter Posthuma / DataScenarios
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

import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import { max } from "d3";

import measureSvgTextHeight = textMeasurementService.measureSvgTextHeight;
import measureSvgTextWidth = textMeasurementService.measureSvgTextWidth;

import { BoxWhiskerChartData, BoxPlot } from "./data";
import { Settings } from "./settings";
import { LabelOrientation } from "./enums";

export function calculateAxis(data: BoxWhiskerChartData, settings: Settings): Settings {
    const valueTextProperties = settings.yAxis.TextProperties;
    let valueTextHeight = settings.yAxis.show
        ? (max(
              data.dataRange.map((nr: number) => {
                  valueTextProperties.text = settings.formatting.valuesFormatter.format(nr);
                  return measureSvgTextHeight(valueTextProperties);
              })
          ) as number)
        : 10;
    let valueTextWidth = settings.yAxis.show
        ? (max(
              data.dataRange.map((nr: number) => {
                  valueTextProperties.text = settings.formatting.valuesFormatter.format(nr);
                  return measureSvgTextWidth(valueTextProperties);
              })
          ) as number)
        : 10;

    const categoryTextProperties = settings.xAxis.TextProperties;
    let categoryTextHeight = settings.xAxis.show
        ? (max(
              data.boxPlots.map((boxPlot: BoxPlot) => {
                  categoryTextProperties.text = settings.formatting.categoryFormatter.format(boxPlot.name);
                  return measureSvgTextHeight(categoryTextProperties);
              })
          ) as number)
        : 10;
    let categoryTextWidth = settings.xAxis.show
        ? (max(
              data.boxPlots.map((boxPlot: BoxPlot) => {
                  categoryTextProperties.text = settings.formatting.categoryFormatter.format(boxPlot.name);
                  return measureSvgTextWidth(categoryTextProperties);
              })
          ) as number)
        : 10;

    // Titles
    const valueTitleTextProperties = settings.yAxis.TitleTextProperties;
    const valueTitleTextHeight = settings.yAxis.showTitle
        ? (max(
              data.dataRange.map((nr: number) => {
                  valueTitleTextProperties.text = settings.yAxis.title;
                  return measureSvgTextHeight(valueTitleTextProperties);
              })
          ) as number)
        : 0;
    const valueTitleTextWidth = settings.yAxis.showTitle
        ? (max(
              data.dataRange.map((nr: number) => {
                  valueTitleTextProperties.text = settings.yAxis.title;
                  return measureSvgTextWidth(valueTitleTextProperties);
              })
          ) as number)
        : 0;

    const categoryTitleTextProperties = settings.xAxis.TitleTextProperties;
    const categoryTitleTextHeight = settings.xAxis.showTitle
        ? (max(
              data.boxPlots.map((boxPlot: BoxPlot) => {
                  categoryTitleTextProperties.text = settings.xAxis.title;
                  return measureSvgTextHeight(categoryTitleTextProperties);
              })
          ) as number)
        : 0;
    const categoryTitleTextWidth = settings.xAxis.showTitle
        ? (max(
              data.boxPlots.map((boxPlot: BoxPlot) => {
                  categoryTitleTextProperties.text = settings.xAxis.title;
                  return measureSvgTextWidth(categoryTitleTextProperties);
              })
          ) as number)
        : 0;

    switch (settings.xAxis.orientation) {
        case LabelOrientation.Diagonal:
            const sin = Math.sin(Math.PI / 4);
            const cos = Math.cos(Math.PI / 4);
            categoryTextWidth = sin * categoryTextWidth + sin * categoryTextHeight;
            categoryTextHeight = cos * categoryTextWidth + cos * categoryTextHeight;
            break;
        case LabelOrientation.Vertical:
            const tWidth = categoryTextWidth;
            categoryTextWidth = categoryTextHeight + 20;
            categoryTextHeight = tWidth + 20;
            break;
        case LabelOrientation.Horizontal:
        default:
            categoryTextHeight;
            categoryTextWidth;
            break;
    }
    categoryTextHeight += categoryTitleTextHeight;
    categoryTextWidth += categoryTitleTextWidth;
    valueTextHeight += valueTitleTextHeight;
    valueTextWidth += valueTitleTextWidth;

    settings.general.axisDimensions = {
        categoryAxisLabel: { height: categoryTextHeight, width: categoryTextWidth },
        valueAxisLabel: { height: valueTextHeight, width: valueTextWidth },
    };
    return settings;
}
