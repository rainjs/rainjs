// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

describe('The flow layout manager', function () {
    describe('create item', function () {
        it('should throw an error if createNewItem is called before start',
            ['layout/js/flow'],
            function (FlowLayout, Layout) {
                var layout = new FlowLayout();
                layout._createNewItem.andCallThrough();
                expect(function () {
                    layout._createNewItem();
                }).toThrow();
            }
        );

        it('should correctly add the item',
            ['layout/js/flow'],
            function (FlowLayout, Layout) {
                var layout = new FlowLayout();
                layout._container = jasmine.createSpyObj('_container', ['append']);

                layout._items = [];
                layout._createNewItem.andCallThrough();
                layout._createNewItem({});

                expect(layout._container.append).toHaveBeenCalled();
                expect(layout._items.length).toEqual(1);
            }
        );
    });

    describe('remove', function () {
        it('should throw an error if called before start',
            ['layout/js/flow'],
            function (FlowLayout) {
                var layout = new FlowLayout();
                layout._remove.andCallThrough();

                expect(function () {
                    layout._remove({
                        index: 3
                    });
                }).toThrow();
            }
        );

        it('should throw an error if called without an index',
            ['layout/js/flow'],
            function (FlowLayout) {
                var layout = new FlowLayout();
                layout._container = {};
                layout._remove.andCallThrough();

                expect(function () {
                    layout._remove({});
                }).toThrow();
            }
        );

        it('should corectly remove the item',
            ['layout/js/flow'],
            function (FlowLayout) {
                var layout = new FlowLayout();
                var item = jasmine.createSpyObj('$', ['remove']);
                layout._container = {};
                layout._items = ['Some item'];
                layout._remove.andCallThrough();
                spyOn(window, '$').andReturn(item);

                layout._remove({
                    index: 0
                });

                expect($).toHaveBeenCalledWith('Some item');
                expect(item.remove).toHaveBeenCalled();
                expect(layout._items.length).toBe(0);
            }
        );
    });
});
