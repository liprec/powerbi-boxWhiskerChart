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

import DataView = powerbi.DataView;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

import { converter } from "../src/convertor";

import { VisualData } from "./visualData";

describe("Box and Whisker chart unit tests =>", () => {
    let defaultDataViewBuilder: VisualData;
    let dataView: DataView;

    beforeEach(() => {
        defaultDataViewBuilder = new VisualData();
        dataView = defaultDataViewBuilder.getDataView();
    });

    describe("convertor", () => {
        it("runs", (done) => {
            defaultDataViewBuilder = new VisualData();
            dataView = defaultDataViewBuilder.getDataView();

            const options: VisualUpdateOptions = {
                dataViews: [
                    dataView
                ],
                viewport: {
                    height: 100,
                    width: 100
                },
                type: 62
            };
            converter(options, null);

            expect(1).toBe(1);
            done();
        });
    });
});
