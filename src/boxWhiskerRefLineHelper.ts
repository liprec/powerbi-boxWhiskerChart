
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
    // powerbi.extensibility
    import IColorPalette = powerbi.extensibility.IColorPalette;

    export function refLineReadDataView(objects: DataViewObjects, colors: IColorPalette): BoxWhiskerChartReferenceLine[] {
        let referenceLines = [];

        if (objects) {
            let refLines = DataViewObjectsModule.getObject(objects, "y1AxisReferenceLine").$instances;
            for(let id in refLines) {
                let refLine: BoxWhiskerChartReferenceLine = refLines[id] as BoxWhiskerChartReferenceLine;
                let selector = { id: id, metadata: undefined };
                let lineColor = colors.getColor("0").value;
                referenceLines.push({
                    selector: selector,
                    type: "y1AxisReferenceLine",
                    show: refLine.show || false,
                    displayName: refLine.displayName || undefined,
                    value: refLine.value || 0,
                    lineColor: refLine.lineColor || lineColor,
                    transparency: refLine.transparency || 50,
                    style: refLine.style || BoxWhiskerEnums.ReferenceLine.Style.dashed,
                    position: refLine.position || BoxWhiskerEnums.ReferenceLine.Position.front
                });
            }
        }
        return referenceLines;
    }

    export function refLineEnumerateObjectInstances(referenceLines: BoxWhiskerChartReferenceLine[], colorPalette): VisualObjectInstance[] {
        let instances: VisualObjectInstance[] = [];
        if (referenceLines.length===0) { 
            instances.push({
                objectName: "y1AxisReferenceLine",
                selector: { id: "0" },
                properties: {
                    show: false,
                    value: '',
                    lineColor: { solid: { color: colorPalette.getColor("0").value } },
                    transparency: 50,
                    style: 1,
                    position: 1
                }
            });
        } else {
            referenceLines.forEach((refLine: BoxWhiskerChartReferenceLine) => {
                instances.push( {
                    objectName: refLine.type,
                    selector: refLine.selector,
                    properties: {
                        show: refLine.show,
                        displayName: refLine.displayName,
                        value: refLine.value,
                        lineColor: { solid: { color: refLine.lineColor } },
                        transparency: refLine.transparency,
                        style: refLine.style,
                        position: refLine.position
                    }
                });
            });
        }
        return instances;        
    }
}