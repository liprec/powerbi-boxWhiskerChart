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
import { testDataViewBuilder } from "powerbi-visuals-utils-testutils";
import { valueType } from "powerbi-visuals-utils-typeutils";

import DataView = powerbi.DataView;
import DataViewHierarchy = powerbi.DataViewHierarchy;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewHierarchyLevel = powerbi.DataViewHierarchyLevel;
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
import ISQExpr = powerbi.data.ISQExpr;
import TestDataViewBuilder = testDataViewBuilder.TestDataViewBuilder;
import TestDataViewBuilderColumnOptions = testDataViewBuilder.TestDataViewBuilderColumnOptions;
import ValueType = valueType.ValueType;

export class VisualData extends TestDataViewBuilder {
    public tableName: string = "SpeedOfLight";

    public columnNames = ["Experiment", "Run", "Speed"];

    public columnTypes: ValueType[] = [
        ValueType.fromDescriptor({ text: true }),
        ValueType.fromDescriptor({ numeric: true }),
        ValueType.fromDescriptor({ numeric: true })
    ];

    public columnFormat: any[] = [
        undefined, "0", "0"
    ];

    public data: any[] = [
        {
            value: "Experiment 1",
            values: [ 850, 740, 900, 1070, 930, 850, 950, 980, 980, 880, 1000, 980, 930, 650, 760, 810, 1000, 1000, 960, 960 ],
        },
        {
            value: "Experiment 2",
            values: [ 960, 940, 960, 940, 880, 800, 850, 880, 900, 840, 830, 790, 810, 880, 880, 830, 800, 790, 760, 800 ],
        },
        {
            value: "Experiment 3",
            values: [ 880, 880, 880, 860, 720, 720, 620, 860, 970, 950, 880, 910, 850, 870, 840, 840, 850, 840, 840, 840 ],
        },
        {
            value: "Experiment 4",
            values: [ 890, 810, 810, 820, 800, 770, 760, 740, 750, 760, 910, 920, 890, 860, 860, 720, 840, 850, 850, 780 ],
        },
        {
            value: "Experiment 5",
            values: [ 890, 840, 780, 810, 760, 810, 790, 810, 820, 850, 870, 870, 810, 740, 810, 940, 950, 800, 810, 870 ]
        }
    ];

    public getDataView(columnNames?: string[]): DataView {
        const columnMeta: DataViewMetadataColumn[] = this.columnNames.map((field, index) => {
            return <DataViewMetadataColumn>{
                displayName: field,
                roles: { Fields: true },
                type: this.columnTypes[index],
                format: this.columnFormat[index],
                index: index,
                queryName: this.tableName + "." + field,
                expr: {
                    ref: field.replace(" ", ""),
                    source: {
                        entity: this.tableName
                    }
                },
                identityExprs: <ISQExpr[]>[{
                    ref: field.replace(" ", ""),
                    kind: 2,
                    source: {
                        entity: this.tableName,
                        kind: 0
                    }
                }],
                isMeasure: undefined
            };
        });
        columnMeta[2].isMeasure = true;
        const rows: DataViewHierarchy = {
            levels: <DataViewHierarchyLevel[]>[
                {
                    sources: [columnMeta[0]]
                }
            ],
            root: <DataViewMatrixNode>{
                childIdentityExpr: columnMeta[0].identityExprs,
                children: this.data.map((column) => {
                    return {
                        value: column.value,
                        values: JSON.parse(`{${column.values.map((value, index) => `"${index}":{"value": ${value}}`).join(",")}}`)
                    };
                })
            }
        };
        const columns: DataViewHierarchy = {
            levels: <DataViewHierarchyLevel[]>[
                {
                    sources: [columnMeta[1]]
                }
            ],
            root: <DataViewMatrixNode>{
                childIdentityExpr: columnMeta[1].identityExprs[0],
                children: JSON.parse(`[${this.data[0].values.map((value, index) => `{"value": ${index}}`).join(",")}]`)
            }
        };
        const dataView: DataView = {
            matrix: {
                rows: rows,
                columns: columns,
                valueSources: [columnMeta[2]]
            },
            metadata: {
                columns: columnMeta
            }
        };
        return dataView;
    }
}
