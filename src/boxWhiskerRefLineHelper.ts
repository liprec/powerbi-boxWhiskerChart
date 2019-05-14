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
import { dataViewObjects as DataViewObjectsModule } from "powerbi-visuals-utils-dataviewutils";
import { valueFormatter as ValueFormatter } from "powerbi-visuals-utils-formattingutils/lib/src";
import { Selection } from "d3-selection";

import { BoxWhiskerChartSettings } from "./settings";
import { IBoxWhiskerChartReferenceLine, IBoxWhiskerAxisSettings } from "./interfaces";
import { ReferenceLine } from "./enums";
import { BoxWhiskerCssConstants } from "./cssConstants";

import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataViewObjects = powerbi.DataViewObjects;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import valueFormatter = ValueFormatter.valueFormatter;

import ChartMain = BoxWhiskerCssConstants.ChartMain;
import ChartReferenceLine = BoxWhiskerCssConstants.ChartReferenceLine;
import ChartReferenceLineLabel = BoxWhiskerCssConstants.ChartReferenceLineLabel;
import ChartReferenceLineFrontNode = BoxWhiskerCssConstants.ChartReferenceLineFrontNode;
import ChartReferenceLineBackNode = BoxWhiskerCssConstants.ChartReferenceLineBackNode;

export function referenceLineReadDataView(objects: DataViewObjects, colors: ISandboxExtendedColorPalette): IBoxWhiskerChartReferenceLine[] {
    let referenceLines: IBoxWhiskerChartReferenceLine[] = [];

    if (objects) {
        let refLines = DataViewObjectsModule.getObject(objects, "y1AxisReferenceLine");
        if (refLines) {
            refLines = refLines.$instances;
            for (let id in refLines) {
                let refLine: IBoxWhiskerChartReferenceLine = refLines[id] as IBoxWhiskerChartReferenceLine;
                let selector: any = { id: id, metadata: undefined };
                let lineColor: any = (refLine.lineColor as any);
                if (lineColor) {
                    lineColor = colors.isHighContrast ? colors.foreground.value : lineColor.solid.color;
                }
                let labelColor: any = (refLine.labelColor as any);
                if (labelColor) {
                    labelColor = colors.isHighContrast ? colors.foreground.value : labelColor.solid.color;
                }
                let defaultColor = colors.isHighContrast ? colors.foreground.value : colors.getColor("0").value;
                referenceLines.push({
                    selector: selector,
                    type: "y1AxisReferenceLine",
                    show: refLine.show || false,
                    displayName: refLine.displayName || undefined,
                    value: refLine.value || 0,
                    lineColor: lineColor || defaultColor,
                    transparency: colors.isHighContrast ? 100 : (refLine.transparency || 50),
                    style: refLine.style || ReferenceLine.Style.dashed,
                    position: refLine.position || ReferenceLine.Position.front,
                    showLabel: refLine.showLabel || false,
                    labelColor: labelColor || defaultColor,
                    labelFontSize: refLine.labelFontSize || 11,
                    labelFontFamily: refLine.labelFontFamily || "\"Segoe UI\", wf_segoe-ui_normal, helvetica, arial, sans-serif",
                    labelType: refLine.labelType || ReferenceLine.LabelType.value,
                    labelDisplayUnits: refLine.labelDisplayUnits || 0,
                    labelPrecision: refLine.labelPrecision || undefined,
                    hPosition: refLine.hPosition || ReferenceLine.HPosition.left,
                    vPosition: refLine.vPosition || ReferenceLine.VPosition.above,
                    x: 0,
                    y: 0,
                });
            }
        }
    }
    return referenceLines;
}

export function referenceLineEnumerateObjectInstances(referenceLines: IBoxWhiskerChartReferenceLine[], colors: any): VisualObjectInstance[] {
    let instances: VisualObjectInstance[] = [];
    if (referenceLines.length === 0) { // Default refLine settings
        instances.push({
            objectName: "y1AxisReferenceLine",
            selector: { id: "0" },
            properties: {
                show: false,
                value: "",
                lineColor: { solid: { color: colors.getColor("0").value } },
                transparency: 50,
                style: ReferenceLine.Style.dashed,
                position: ReferenceLine.Position.front,
                showLabel: false,
            }
        });
    } else {
        referenceLines.forEach((refLine: IBoxWhiskerChartReferenceLine) => {
            let instance = {
                objectName: refLine.type,
                selector: refLine.selector,
                properties: {
                    show: refLine.show,
                    displayName: refLine.displayName,
                    value: refLine.value,
                    lineColor: { solid: { color: refLine.lineColor } },
                    transparency: refLine.transparency,
                    style: refLine.style,
                    position: refLine.position,
                    showLabel: refLine.showLabel,
                }
            };
            if (refLine.showLabel) {
                instance.properties["labelColor"] = { solid: { color: refLine.labelColor } };
                instance.properties["labelFontSize"] = refLine.labelFontSize;
                instance.properties["labelFontFamily"] = refLine.labelFontFamily;
                instance.properties["labelType"] = refLine.labelType;
                instance.properties["labelDisplayUnits"] = refLine.labelDisplayUnits;
                instance.properties["labelPrecision"] = refLine.labelPrecision;
                instance.properties["hPosition"] = refLine.hPosition;
                instance.properties["vPosition"] = refLine.vPosition;
            }
            instances.push(instance);
        });
    }
    return instances;
}

export function drawReferenceLines(rootElement: Selection<any, any, any, any>, settings: BoxWhiskerChartSettings, referenceLines: IBoxWhiskerChartReferenceLine[], axisSettings: IBoxWhiskerAxisSettings, front: boolean) {
    let referenceLineElement: Selection<any, any, any, any> = rootElement.selectAll(ChartMain.selectorName);
    let classSelector = front ? ChartReferenceLineFrontNode : ChartReferenceLineBackNode;
    let selection = rootElement.selectAll(classSelector.selectorName).data(referenceLines);

    selection
        .enter()
        .append("g")
        .classed(classSelector.className, true);

    let referenceLine = selection.selectAll(ChartReferenceLine.selectorName).data((d: any) => {
        if (d && d.length > 0) { return d; }
        return [];
    });

    let referenceLineData = (refLine: any) => {
        let x1 = 0;
        let y1 = axisSettings.drawScaleValue(refLine.value);
        let x2 = axisSettings.drawScaleCategory.range()[1];
        let y2 = axisSettings.drawScaleValue(refLine.value);
        return `M ${x1},${y1} L${x2},${y2}`;
    };

    referenceLine
        .enter()
        .append("path")
        .classed(ChartReferenceLine.className, true);

    referenceLine
        .style("fill", value => (<IBoxWhiskerChartReferenceLine>value).lineColor)
        .style("opacity", value => {
            let refLine = (<IBoxWhiskerChartReferenceLine>value);
            return refLine.position === (front ?
                ReferenceLine.Position.front :
                ReferenceLine.Position.back) ?
                    refLine.transparency / 100 :
                    0;
        })
        .style("stroke", value => (<IBoxWhiskerChartReferenceLine>value).lineColor)
        .style("stroke-width", 3)
        .style("stroke-dasharray", value => {
            switch ((<IBoxWhiskerChartReferenceLine>value).style) {
                case ReferenceLine.Style.dashed:
                    return "5, 5";
                case ReferenceLine.Style.dotted:
                    return "1, 5";
                case ReferenceLine.Style.solid:
                default:
                    return null;
            }})
        .attr("d", referenceLineData);

    let referenceLineLabel = selection.selectAll(ChartReferenceLineLabel.selectorName).data((d: any) => {
        if (d && d.length > 0) {
            return d.filter((d: IBoxWhiskerChartReferenceLine) => d.showLabel);
        }
        return [];
    });

    referenceLineLabel
        .enter()
        .append("text")
        .classed(ChartReferenceLineLabel.className, true);

    let referenceLabelTransform = (refLine: any) => {
        if (!refLine) { return; }
        let x0 = refLine.hPosition === ReferenceLine.HPosition.left
                ? 0
                : axisSettings.drawScaleCategory.range()[1];
        let y0 = axisSettings.drawScaleValue(refLine.value);
        return `translate(${x0} ${y0})`;
    };

    let y0 = axisSettings.axisCategoryHeight; // + settings.general.margin.bottom;

    referenceLineLabel
        .attr("transform", referenceLabelTransform)
        .attr("fill", value => {
            let refLine = (<IBoxWhiskerChartReferenceLine>value);
            if (!refLine) { return "#000"; }
            return refLine.labelColor;
        })
        .style("opacity", value => {
            let refLine = (<IBoxWhiskerChartReferenceLine>value);
            if (!refLine) { return 0; }
            return refLine.position === (front ?
                ReferenceLine.Position.front :
                ReferenceLine.Position.back) ?
                    refLine.transparency / 100 :
                    0;
        })
        .style("font-family", value => {
            let refLine = (<IBoxWhiskerChartReferenceLine>value);
            if (!refLine) { return 0; }
            return refLine.labelFontFamily;
        })
        .style("font-size", value => {
            let refLine = (<IBoxWhiskerChartReferenceLine>value);
            if (!refLine) { return 0; }
            return refLine.labelFontSize + "px";
        })
        .text(value => {
            let refLine = (<IBoxWhiskerChartReferenceLine>value);
            if (!refLine) { return ""; }
            let formatter = valueFormatter.create({
                format: settings.formatting.valuesFormatter.options.format,
                precision: refLine.labelPrecision,
                value: refLine.labelDisplayUnits || refLine.value,
                cultureSelector: settings.general.locale
            });
            let label;
            switch (refLine.labelType) {
                case ReferenceLine.LabelType.name:
                    label = refLine.displayName;
                    break;
                case ReferenceLine.LabelType.valueName:
                    label = refLine.displayName + " " + formatter.format(refLine.value);
                    break;
                case ReferenceLine.LabelType.value:
                default:
                    label = formatter.format(refLine.value);
            }
            return label;
        })
        .attr("text-anchor", (refLine: IBoxWhiskerChartReferenceLine) => refLine.hPosition === ReferenceLine.HPosition.left ? "start" : "end")
        .attr("x", 0)
        .attr("y", function(value) { // no lambda because of the 'getBBox()'
            let refLine = <IBoxWhiskerChartReferenceLine>value;
            let height = 10; // this.getBBox().height;
            return refLine.vPosition === ReferenceLine.VPosition.above
                ? -4
                : 0.75 * height;
        });

    referenceLineLabel.exit().remove();

    referenceLine.exit().remove();
}
