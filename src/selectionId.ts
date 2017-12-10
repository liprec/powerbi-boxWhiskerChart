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

// Temp module/interface/class to get a correct selectionId based on only the category

module powerbi.extensibility.data {

    import Selector = powerbi.data.Selector;
    import SQExpr = powerbi.data.ISQExpr;
    import DataRepetitionSelector = powerbi.data.DataRepetitionSelector;

    export interface SelectorForColumn {
        [queryName: string]: DataRepetitionSelector;
    }

    export interface SelectorsByColumn {
        /** Data-bound repetition selection. */
        dataMap?: SelectorForColumn;

        /** Metadata-bound repetition selection.  Refers to a DataViewMetadataColumn queryName. */
        metadata?: string;

        /** User-defined repetition selection. */
        id?: string;
    }

    export module Selector_ext {
        export function getKey(selector: Selector): string {
            let toStringify: any = {};
            if (selector.data) {
                let data = [];
                for (let i = 0, ilen = selector.data.length; i < ilen; i++) {
                    data.push(selector.data[i].key);
                }
                toStringify.data = data;
            }
            if (selector.metadata)
                toStringify.metadata = selector.metadata;
            if (selector.id)
                toStringify.id = selector.id;
            return JSON.stringify(toStringify);
        }

        export function equals(x: Selector, y: Selector): boolean {
            // Normalize falsy to null
            x = x || null;
            y = y || null;

            if (x === y)
                return true;

            if (!x !== !y)
                return false;

            if (x.id !== y.id)
                return false;
            if (x.metadata !== y.metadata)
                return false;
            
            return true;
        }
    } 

    export class SelectionId implements ISelectionId {
        private selector: Selector;
        private selectorsByColumn: SelectorsByColumn;
        private key: string;
        private keyWithoutHighlight: string;
        public highlight: boolean;

        constructor(selector: Selector, highlight: boolean) {
            this.selector = selector;
            this.highlight = highlight;
            this.key = JSON.stringify({ selector: selector ? Selector_ext.getKey(selector) : null, highlight: highlight });
            this.keyWithoutHighlight = JSON.stringify({ selector: selector ? Selector_ext.getKey(selector) : null });
        }

        public equals(other: SelectionId): boolean {
            if (!this.selector || !other.selector) {
                return (!this.selector === !other.selector) && this.highlight === other.highlight;
            }
            return this.highlight === other.highlight &&  Selector_ext.equals(this.selector, other.selector);
        }

        public includes(other: SelectionId, ignoreHighlight: boolean = false): boolean {
            let thisSelector = this.selector;
            let otherSelector = other.selector;
            if (!thisSelector || !otherSelector) {
                return false;
            }
            let thisData = thisSelector.data;
            let otherData = otherSelector.data;
            if (!thisData && (thisSelector.metadata && thisSelector.metadata !== otherSelector.metadata))
                return false;
            if (!ignoreHighlight && this.highlight !== other.highlight)
                return false;
            if (thisData) {
                if (!otherData)
                    return false;
                if (thisData.length > 0) {
                    for (let i = 0, ilen = thisData.length; i < ilen; i++) {
                        let thisValue = <DataViewScopeIdentity>thisData[i];
                    }
                }
            }
            return true;
        }

        public getKey(): string {
            return this.key;
        }

        public getKeyWithoutHighlight(): string {
            return this.keyWithoutHighlight;
        }

        public hasIdentity(): boolean {
            return (this.selector && !!this.selector.data);
        }

        public getSelector(): Selector {
            return this.selector;
        }

        public getSelectorsByColumn(): Selector {
            return this.selectorsByColumn;
        }

        public static createNull(highlight: boolean = false): SelectionId {
            return new SelectionId(null, highlight);
        }

        public static createWithId(id: DataViewScopeIdentity, highlight: boolean = false): SelectionId {
            let selector: Selector = null;
            if (id) {
                selector = {
                    data: [id]
                };
            }
            return new SelectionId(selector, highlight);
        }

        public static createWithMeasure(measureId: string, highlight: boolean = false): SelectionId {
            let selector: Selector = {
                metadata: measureId
            };

            let selectionId = new SelectionId(selector, highlight);
            selectionId.selectorsByColumn = { metadata: measureId };
            return selectionId;
        }

        public static createWithIdAndMeasure(id: DataViewScopeIdentity, measureId: string, highlight: boolean = false): SelectionId {
            let selector: powerbi.data.Selector = {};
            if (id) {
                selector.data = [id];
            }
            if (measureId)
                selector.metadata = measureId;
            if (!id && !measureId)
                selector = null;

            let selectionId = new SelectionId(selector, highlight);

            return selectionId;
        }

        public static createWithIdAndMeasureAndCategory(id: DataViewScopeIdentity, measureId: string, queryName: string, highlight: boolean = false): SelectionId {
            let selectionId = this.createWithIdAndMeasure(id, measureId, highlight);

            if (selectionId.selector) {
                selectionId.selectorsByColumn = {};
                if (id && queryName) {
                    selectionId.selectorsByColumn.dataMap = {};
                    selectionId.selectorsByColumn.dataMap[queryName] = id;
                }
                if (measureId)
                    selectionId.selectorsByColumn.metadata = measureId;
            }

            return selectionId;
        }
        public static createWithIds(id1: DataViewScopeIdentity, id2: DataViewScopeIdentity, highlight: boolean = false): SelectionId {
            let selector: Selector = null;
            let selectorData = SelectionId.idArray(id1, id2);
            if (selectorData)
                selector = { data: selectorData };
            
            return new SelectionId(selector, highlight);
        }

        public static createWithIdsAndMeasure(id1: DataViewScopeIdentity, id2: DataViewScopeIdentity, measureId: string, highlight: boolean = false): SelectionId {
            let selector: Selector = {};
            let selectorData = SelectionId.idArray(id1, id2);
            if (selectorData)
                selector.data = selectorData;

            if (measureId)
                selector.metadata = measureId;
            if (!id1 && !id2 && !measureId)
                selector = null;
            return new SelectionId(selector, highlight);
        }

        public static createWithSelectorForColumnAndMeasure(dataMap: SelectorForColumn, measureId: string, highlight: boolean = false): SelectionId {
            let selectionId: SelectionId;
            let keys = Object.keys(dataMap);
            if (keys.length === 2) {
                selectionId = this.createWithIdsAndMeasure(<DataViewScopeIdentity>dataMap[keys[0]], <DataViewScopeIdentity>dataMap[keys[1]], measureId, highlight);
            } else if (keys.length === 1) {
                selectionId = this.createWithIdsAndMeasure(<DataViewScopeIdentity>dataMap[keys[0]], null, measureId, highlight);
            } else {
                selectionId = this.createWithIdsAndMeasure(null, null, measureId, highlight);
            }

            let selectorsByColumn: SelectorsByColumn = {};
            if (!_.isEmpty(dataMap))
                selectorsByColumn.dataMap = dataMap;
            if (measureId)
                selectorsByColumn.metadata = measureId;
            if (!dataMap && !measureId)
                selectorsByColumn = null;

            selectionId.selectorsByColumn = selectorsByColumn;

            return selectionId;
        }

        public static createWithHighlight(original: SelectionId): SelectionId {
            let newId = new SelectionId(original.getSelector(), /*highlight*/ true);
            newId.selectorsByColumn = original.selectorsByColumn;

            return newId;
        }

        private static idArray(id1: DataViewScopeIdentity, id2: DataViewScopeIdentity): DataViewScopeIdentity[] {
            if (id1 || id2) {
                let data = [];
                if (id1)
                    data.push(id1);
                if (id2 && id2 !== id1)
                    data.push(id2);
                return data;
            }
        }
    }
}