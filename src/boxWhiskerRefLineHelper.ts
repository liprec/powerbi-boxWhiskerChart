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
 
    // utils.dataview
    import DataViewObjectsModule = powerbi.extensibility.utils.dataview.DataViewObjects;
    // utils.formatting
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    // powerbi.extensibility
    import IColorPalette = powerbi.extensibility.IColorPalette;
    // d3
    import Selection = d3.Selection;

    export function referenceLineReadDataView(objects: DataViewObjects, colors: IColorPalette): BoxWhiskerChartReferenceLine[] {
        let referenceLines = [];

        if (objects) {
            let refLines = DataViewObjectsModule.getObject(objects, "y1AxisReferenceLine");
            if (refLines) {
                refLines = refLines.$instances;
                for(let id in refLines) {
                    let refLine: BoxWhiskerChartReferenceLine = refLines[id] as BoxWhiskerChartReferenceLine;
                    let selector = { id: id, metadata: undefined };
                    let lineColor: any = (refLine.lineColor as any)
                    if (lineColor) {
                        lineColor = lineColor.solid.color
                    }
                    let labelColor: any = (refLine.labelColor as any)
                    if (labelColor) {
                        labelColor = labelColor.solid.color
                    }
                    let defaultColor = colors.getColor("0").value;
                    referenceLines.push({
                        selector: selector,
                        type: "y1AxisReferenceLine",
                        show: refLine.show || false,
                        displayName: refLine.displayName || undefined,
                        value: refLine.value || 0,
                        lineColor: lineColor || defaultColor,
                        transparency: refLine.transparency || 50,
                        style: refLine.style || BoxWhiskerEnums.ReferenceLine.Style.dashed,
                        position: refLine.position || BoxWhiskerEnums.ReferenceLine.Position.front,
                        showLabel: refLine.showLabel || false,
                        labelColor: labelColor || defaultColor,
                        labelFontSize: refLine.labelFontSize || 11,
                        labelFontFamily: refLine.labelFontFamily || "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif",
                        labelType: refLine.labelType || BoxWhiskerEnums.ReferenceLine.LabelType.value,
                        labelDisplayUnits: refLine.labelDisplayUnits || 0,
                        labelPrecision: refLine.labelPrecision || undefined,
                        hPosition: refLine.hPosition || BoxWhiskerEnums.ReferenceLine.HPosition.left,
                        vPosition: refLine.vPosition || BoxWhiskerEnums.ReferenceLine.VPosition.above
                    });
                }
            }
        }
        return referenceLines;
    }

    export function referenceLineEnumerateObjectInstances(referenceLines: BoxWhiskerChartReferenceLine[], colors): VisualObjectInstance[] {
        let instances: VisualObjectInstance[] = [];
        if (referenceLines.length===0) { // Default refLine settings
            instances.push({
                objectName: "y1AxisReferenceLine",
                selector: { id: "0" },
                properties: {
                    show: false,
                    value: '',
                    lineColor: { solid: { color: colors.getColor("0").value } },
                    transparency: 50,
                    style: BoxWhiskerEnums.ReferenceLine.Style.dashed,
                    position: BoxWhiskerEnums.ReferenceLine.Position.front,
                    showLabel: false,
                }
            });
        } else {
            referenceLines.forEach((refLine: BoxWhiskerChartReferenceLine) => {
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

    export function drawReferenceLines(rootElement: Selection<any>, settings: BoxWhiskerChartSettings, referenceLines: BoxWhiskerChartReferenceLine[], axisSettings: BoxWhiskerAxisSettings, front: boolean) {
        let referenceLineElement: Selection<any> = rootElement.selectAll(BoxWhiskerChart.ChartMain.selectorName);
        let stack = d3.layout.stack();
        let layers = stack([referenceLines])
        let classSelector = front ? BoxWhiskerChart.ChartReferenceLineFrontNode : BoxWhiskerChart.ChartReferenceLineBackNode
        let selection = rootElement.selectAll(classSelector.selectorName).data(layers);

        selection
            .enter()
            .append('g')
            .classed(classSelector.className, true);
        
        let referenceLine = selection.selectAll(BoxWhiskerChart.ChartReferenceLine.selectorName).data(d => {
            if (d && d.length > 0) { return [d]; }
            return [];
        });

        let referenceLineData = (refLines) => {
            return refLines.map((refLine: BoxWhiskerChartReferenceLine) => {
                let x1 = settings.general.margin.left + axisSettings.axisValueWidth;
                let y1 = axisSettings.axisScaleValue(refLine.value);
                let x2 = settings.general.viewport.width - settings.general.margin.left;
                let y2 = axisSettings.axisScaleValue(refLine.value);
                return `M ${x1},${y1} L${x2},${y2}`;
            }).join(' ');
        };

        referenceLine
            .enter()
            .append('path')
            .classed(BoxWhiskerChart.ChartReferenceLine.className, true);

        referenceLine
            .style("fill", value => (<BoxWhiskerChartReferenceLine>value[0]).lineColor)
            .style("opacity", value => {
                let refLine = (<BoxWhiskerChartReferenceLine>value[0])
                return refLine.position === (front ? 
                    BoxWhiskerEnums.ReferenceLine.Position.front :
                    BoxWhiskerEnums.ReferenceLine.Position.back) ?
                        refLine.transparency / 100 :
                        0
            })
            .style("stroke", value => (<BoxWhiskerChartReferenceLine>value[0]).lineColor)
            .style("stroke-width", 3)
            .style("stroke-dasharray", value => {
                switch ((<BoxWhiskerChartReferenceLine>value[0]).style) {
                    case BoxWhiskerEnums.ReferenceLine.Style.dashed:
                        return "5, 5"
                    case BoxWhiskerEnums.ReferenceLine.Style.dotted:
                        return "1, 5"
                    case BoxWhiskerEnums.ReferenceLine.Style.solid:
                    default:
                        return null
                }})
            .transition()
            .duration(settings.general.duration)
            .attr("d", referenceLineData);

        let referenceLineLabel = selection.selectAll(BoxWhiskerChart.ChartReferenceLineLabel.selectorName).data(d => {
            if (d && d.length > 0) { 
                return [d.map((refLine: BoxWhiskerChartReferenceLine) => {
                    if (refLine.showLabel){ 
                        return refLine
                    }})]
            }
            return [];
        });

        referenceLineLabel
            .enter()
            .append("text")
            .classed(BoxWhiskerChart.ChartReferenceLineLabel.className, true);

        let y0 = axisSettings.axisCategoryHeight + settings.general.margin.bottom;

        referenceLineLabel
            .attr("transform", value => `translate(0 ${y0}) scale(1, -1)`)
            .attr("fill", value => {
                let refLine = (<BoxWhiskerChartReferenceLine>value[0]);
                if (!refLine) { return "#000"; }
                return refLine.labelColor
            })
            .attr("x", value => {
                let refLine = (<BoxWhiskerChartReferenceLine>value[0]);
                if (!refLine) { return 0; }
                let formatter = valueFormatter.create({
                    precision: refLine.labelPrecision,
                    value: refLine.labelDisplayUnits || refLine.value,
                    cultureSelector: settings.general.locale
                });
                let textProperties: TextProperties = {
                    fontFamily: refLine.labelFontFamily,
                    fontSize: refLine.labelFontSize + "px"
                };
                let label;
                switch (refLine.labelType) {
                    case BoxWhiskerEnums.ReferenceLine.LabelType.name:
                        label = refLine.displayName;
                        break;
                    case BoxWhiskerEnums.ReferenceLine.LabelType.valueName:
                        label = refLine.displayName + " " + formatter.format(refLine.value);
                        break;
                    case BoxWhiskerEnums.ReferenceLine.LabelType.value:
                    default:
                        label = formatter.format(refLine.value);
                }
                return refLine.hPosition === BoxWhiskerEnums.ReferenceLine.HPosition.left
                    ? settings.general.margin.left + axisSettings.axisValueWidth
                    : settings.general.viewport.width - settings.general.margin.right -
                        textMeasurementService.measureSvgTextWidth(textProperties, label);
            })
            .attr("y", value => {
                let refLine = (<BoxWhiskerChartReferenceLine>value[0]);
                if (!refLine) { return 0; }
                let formatter = valueFormatter.create({
                    precision: refLine.labelPrecision,
                    value: refLine.labelDisplayUnits || refLine.value,
                    cultureSelector: settings.general.locale
                });
                let textProperties: TextProperties = {
                    fontFamily: refLine.labelFontFamily,
                    fontSize: refLine.labelFontSize + "px"
                };
                let label;
                switch (refLine.labelType) {
                    case BoxWhiskerEnums.ReferenceLine.LabelType.name:
                        label = refLine.displayName;
                        break;
                    case BoxWhiskerEnums.ReferenceLine.LabelType.valueName:
                        label = refLine.displayName + " " + formatter.format(refLine.value);
                        break;
                    case BoxWhiskerEnums.ReferenceLine.LabelType.value:
                    default:
                        label = formatter.format(refLine.value);
                }
                let offSet = refLine.vPosition === BoxWhiskerEnums.ReferenceLine.VPosition.above
                    ? 4
                    : -.75 * textMeasurementService.measureSvgTextHeight(textProperties, label);
                return y0 - axisSettings.axisScaleValue(refLine.value) - offSet
            })
            .style("opacity", value => {
                let refLine = (<BoxWhiskerChartReferenceLine>value[0]);
                if (!refLine) { return 0; }
                return refLine.position === (front ? 
                    BoxWhiskerEnums.ReferenceLine.Position.front :
                    BoxWhiskerEnums.ReferenceLine.Position.back) ?
                        refLine.transparency / 100 :
                        0
            })
            .style("font-family", value => {
                let refLine = (<BoxWhiskerChartReferenceLine>value[0]);
                if (!refLine) { return 0; }
                return refLine.labelFontFamily
            })
            .style("font-size", value => {
                let refLine = (<BoxWhiskerChartReferenceLine>value[0]);
                if (!refLine) { return 0; }
                return refLine.labelFontSize + "px"
            })
            .text(value => {
                let refLine = (<BoxWhiskerChartReferenceLine>value[0]);
                if (!refLine) { return ""; }
                let formatter = valueFormatter.create({
                    format: settings.formatting.valuesFormatter.options.format,
                    precision: refLine.labelPrecision,
                    value: refLine.labelDisplayUnits || refLine.value,
                    cultureSelector: settings.general.locale
                });
                let label;
                switch (refLine.labelType) {
                    case BoxWhiskerEnums.ReferenceLine.LabelType.name:
                        label = refLine.displayName;
                        break;
                    case BoxWhiskerEnums.ReferenceLine.LabelType.valueName:
                        label = refLine.displayName + " " + formatter.format(refLine.value);
                        break;
                    case BoxWhiskerEnums.ReferenceLine.LabelType.value:
                    default:
                        label = formatter.format(refLine.value);
                }
                return label
            })
            .transition()
            .duration(settings.general.duration);

        referenceLineLabel.exit().remove();

        referenceLine.exit().remove();
    }
}