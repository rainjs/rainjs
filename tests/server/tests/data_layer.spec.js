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

var path = require('path'),
    Environment = require(process.cwd() + '/lib/environment');

describe('Data layer', function() {
    var dataLayer, cb, fn, componentOpt;

    beforeEach(function () {
        componentOpt = {
            id: 'button',
            version: '1.0',
            viewId: 'index',
            context: 'my_data',
            session: {key: 'value'},
            request: {
                query: {page: 1},
                url: '/example/index',
                headers: {}
            }
        };

        cb = jasmine.createSpy();
        fn = jasmine.createSpy().andCallFake(function (environment, callback, context, request) {
            callback(null, {oldData: context, newData: 'my_new_data'});
        });

        spyOn(global, 'requireWithContext').andCallFake(function () {
            return {
                index: fn
            };
        });

        var mocks = {
            './component_registry': jasmine.createSpyObj('component_registry', ['getConfig']),
            path: jasmine.createSpyObj('path', ['join']),
            fs: jasmine.createSpyObj('fs', ['exists'])
        };
        dataLayer = loadModuleExports('/lib/data_layer.js', mocks);

        mocks.fs.exists.andCallFake(function (path, callback) {
            callback(true);
        });
        mocks.path.join.andCallFake(path.join);
        mocks['./component_registry'].getConfig.andCallFake(function (id, version) {
            if (id === 'button' && version === '1.0') {
                return {
                    views: {
                        index: {}
                    },
                    folder: 'button'
                };
            }
        });
    });

    describe('loadData', function () {
        beforeEach(function () {
            spyOn(dataLayer, '_createCustomRequest').andReturn({session: 'data'});
        });

        it('should throw an error when required arguments are missing or invalid', function () {
            dataLayer.loadData(undefined, cb);
            expect(cb.mostRecentCall.args[0].message)
                .toBe('Missing componentOptions in function loadData().');

            dataLayer.loadData({}, cb);
            expect(cb.mostRecentCall.args[0].message).toBe('Missing component id in function loadData().');

            dataLayer.loadData({id: 'button'}, cb);
            expect(cb.mostRecentCall.args[0].message).toBe('Missing view id in function loadData().');

            dataLayer.loadData({id: 'button', viewId: 'index'}, cb);
            expect(cb.mostRecentCall.args[0].message).toBe('Missing version in function loadData().');

            expect(function () {
                dataLayer.loadData({id: 'button', viewId: 'index', version: '1.0'});
            }).toThrow('Missing callback in function loadData().');

            dataLayer.loadData({id: 'inexistent', viewId: 'index', version: '1.0'}, cb);
            expect(cb.mostRecentCall.args[0].message).toBe('Component inexistent-1.0 doesn\'t exist.');

            dataLayer.loadData({id: 'button', viewId: 'no_view', version: '1.0'}, cb);
            expect(cb.mostRecentCall.args[0].message).toBe('View no_view doesn\'t exists in meta.json.');
        });

        it('should call the server-side data function for the view', function () {
            runs(function () {
                dataLayer.loadData(componentOpt, cb);
            });

            waitsFor(function () {
                return cb.calls.length !== 0;
            }, 'data layer method to finish and invoke the callback.');

            runs(function () {
                expect(requireWithContext.mostRecentCall.args[0])
                    .toEqual(path.join('button', 'server/data.js'));
                expect(cb.mostRecentCall.args[0]).toBeNull();
                expect(cb.mostRecentCall.args[1].oldData).toBe('my_data');
                expect(cb.mostRecentCall.args[1].newData).toBe('my_new_data');
            });
        });

        it('should pass 4 parameters to the data layer method', function () {
            runs(function () {
                dataLayer.loadData(componentOpt, cb);
            });

            waitsFor(function () {
                return cb.calls.length !== 0;
            }, 'data layer method to finish and invoke the callback.');

            runs(function () {
                var args = fn.mostRecentCall.args;
                expect(args.length).toEqual(4);
                expect(args[0]).toEqual(new Environment());
                expect(typeof args[1]).toEqual('function');
                expect(args[2]).toEqual(componentOpt.context);
                expect(args[3]).toEqual({session: 'data'});
            });
        });
    });

    describe('_createCustomRequest', function () {
        it('should create a custom request object (HTTP case)', function () {
            var req = dataLayer._createCustomRequest(componentOpt);

            expect(req.session).toBe(componentOpt.session);
            expect(req.query).toBe(componentOpt.request.query);
            expect(req.headers).toBe(componentOpt.request.headers);
            expect(req.url).toBe(componentOpt.request.url);
            expect(req.type).toEqual('HTTP');
        });

        it('should create a custom request object (WebSocket case)', function () {
            delete componentOpt.request;
            var req = dataLayer._createCustomRequest(componentOpt);

            expect(req.session).toBe(componentOpt.session);
            expect(req.query).toBeUndefined();
            expect(req.headers).toBeUndefined();
            expect(req.url).toBeUndefined();
            expect(req.type).toEqual('WebSocket');
        });
    });
});
