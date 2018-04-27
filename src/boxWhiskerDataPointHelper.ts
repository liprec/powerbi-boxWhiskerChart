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

    // utils.dataview
    import DataViewObjectsModule = powerbi.extensibility.utils.dataview.DataViewObjects;
    // powerbi.extensibility
    import IColorPalette = powerbi.extensibility.IColorPalette;

    import Selector = powerbi.data.Selector;

    export function dataPointEnumerateObjectInstances(dataPoints: BoxWhiskerChartDatapoint[][], colorPalette: IColorPalette, oneColor: boolean): VisualObjectInstance[] {
        let instances: VisualObjectInstance[] = [];
        if (oneColor) {
            instances.push({
                displayName: dataPoints[0][0].label,
                objectName: "dataPoint",
                selector: dataPoints[0][0].selectionId.getSelector(),
                properties: {
                    fill: { solid: { color: dataPoints[0][0].color } }
                }
            });
        } else {
            dataPoints.forEach((dataPoint: BoxWhiskerChartDatapoint[]) => {
                let selector: Selector = dataPoint[0].selectionId.getSelector();
                instances.push({
                    displayName: dataPoint[0].label,
                    objectName: "dataPoint",
                    selector: { data: selector.data },
                    properties: {
                        fill: { solid: { color: dataPoint[0].color } }
                    }
                });
            });
        }
        return instances;
    }
}