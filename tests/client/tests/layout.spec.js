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

describe('Abstract layout', function () {
    it('should call the correct add sub-methods',
        ['layout/js/layout'], function (Layout) {
            var layout = new Layout(),
                container = {
                    html: function () {}
                },
                options = {},
                callback = jasmine.createSpy(),
                component = {
                    id: 'example',
                    view: 'index'
                };

            layout._createNewItem = function () {};
            layout.context = {
                insert: jasmine.createSpy()
            };
            layout.add.andCallThrough();

            spyOn(layout, '_createNewItem').andCallFake(function () {
                return container;
            });

            spyOn(container, 'html').andReturn(true);

            layout.context.insert.andCallFake(function (component, container, cb) {
                cb();
            });

            // Test html string.
            layout.add('html', options, callback);

            expect(layout._createNewItem).toHaveBeenCalledWith(options);
            expect(container.html).toHaveBeenCalledWith('html');
            expect(callback).toHaveBeenCalledWith(layout);

            // Test RAIN component.
            layout.add(component, options, callback);

            expect(layout._createNewItem).toHaveBeenCalledWith(options);
            expect(layout.context.insert).toHaveBeenCalledWith(component, container,
                                                               jasmine.any(Function));
            expect(callback).toHaveBeenCalledWith(layout);
        });

    it('should call the correct remove sub-methods',
        ['layout/js/layout'], function (Layout) {
            var layout = new Layout();
            layout._remove = function () {};
            layout.remove.andCallThrough();

            spyOn(layout, '_remove').andCallThrough();

            var options = {
                index: 1
            };
            layout.remove(options);

            expect(layout._remove).toHaveBeenCalledWith(options);
        });
});
