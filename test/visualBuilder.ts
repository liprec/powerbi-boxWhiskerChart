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

// powerbi
import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import VisualUpdateType = powerbi.VisualUpdateType;
import ViewMode = powerbi.ViewMode;
import IFilter = powerbi.IFilter;
import FilterAction = powerbi.FilterAction;
import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;

// powerbi.extensibility
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

// powerbi.extensibility.utils.test
import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";

import { BoxWhiskerChart } from "../src/boxWhiskerChart";

export class BoxWhiskerChartBuilder extends VisualBuilderBase<BoxWhiskerChart> {
    public properties: VisualObjectInstancesToPersist[] = [];
    public filter: IFilter | IFilter[];
    public filterAction: FilterAction;

    constructor(width: number, height: number) {
        super(width, height, "BoxWhiskerChart1455240051538");
    }

    protected build(options: VisualConstructorOptions): BoxWhiskerChart {
        options.host.applyJsonFilter = (filter: IFilter | IFilter[], objectName: string, propertyName: string, action: FilterAction) => {
            this.filter = filter;
        };
        options.host.persistProperties = (changes: VisualObjectInstancesToPersist) => {
            this.properties.push(changes);
        };

        return new BoxWhiskerChart(options);
    }

    public get instance(): BoxWhiskerChart {
        return this.visual;
    }
}
