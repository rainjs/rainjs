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

var path = require('path');

describe('Data layer', function() {
    var dataLayer, cb, fn, componentOpt, sessionStore, session;

    beforeEach(function () {
        session = {
            a: 1,
            b: 2
        };
        sessionStore = jasmine.createSpyObj('sessionStore', ['get', 'save']);
        sessionStore.get.andDefer(function (defer) {
           defer.resolve(session);
        });

        sessionStore.save.andDefer(function (defer) {
            defer.resolve();
        });

        componentOpt = {
            id: 'button',
            version: '1.0',
            viewId: 'index',
            context: 'my_data',
            session: {key: 'value'},
            request: {
                sessionId: '1234',
                query: {page: 1},
                url: '/example/index',
                headers: {},
                sessionStore: sessionStore
            },
            environment: {
                language: 'en_US'
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
                    folder: 'button',
                    useSession: true
                };
            }
        });
    });

    describe('loadData', function () {
        beforeEach(function () {
            spyOn(dataLayer, '_createCustomRequest').andReturn({session: 'data'});
        });

        it('should throw an error when required arguments are missing or invalid', function () {
            var params = function () {
                return [cb.mostRecentCall.args[0].type, cb.mostRecentCall.args[0].code];
            };

            expect(function () {
                dataLayer.loadData();
            }).toThrowType(RainError.ERROR_PRECONDITION_FAILED, 'cb');

            dataLayer.loadData(undefined, cb);
            expect(params()).toEqual([RainError.ERROR_PRECONDITION_FAILED, 'co']);

            dataLayer.loadData({}, cb);
            expect(params()).toEqual([RainError.ERROR_PRECONDITION_FAILED, 'id']);

            dataLayer.loadData({id: 'button'}, cb);
            expect(params()).toEqual([RainError.ERROR_PRECONDITION_FAILED, 'view']);

            dataLayer.loadData({id: 'button', viewId: 'index'}, cb);
            expect(params()).toEqual([RainError.ERROR_PRECONDITION_FAILED, 'version']);

            dataLayer.loadData({id: 'inexistent', viewId: 'index', version: '1.0'}, cb);
            expect(params()).toEqual([RainError.ERROR_PRECONDITION_FAILED, 'component']);

            dataLayer.loadData({id: 'button', viewId: 'no_view', version: '1.0'}, cb);
            expect(params()).toEqual([RainError.ERROR_PRECONDITION_FAILED, 'no view']);
        });

        it('should get & save the session and call the view\'s server-side function', function () {
            runs(function () {
                dataLayer.loadData(componentOpt, cb);
            });

            waitsFor(function () {
                return cb.calls.length !== 0;
            }, 'data layer method to finish and invoke the callback.');

            runs(function () {
                expect(requireWithContext.mostRecentCall.args[0])
                    .toEqual(path.join('button', 'server/data.js'));

                expect(sessionStore.get).toHaveBeenCalledWith(componentOpt.request.sessionId,
                        componentOpt.id);

                expect(sessionStore.save).toHaveBeenCalled();

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
                expect(args[0]).toEqual({
                    language: 'en_US'
                });
                expect(typeof args[1]).toEqual('function');
                expect(args[2]).toEqual(componentOpt.context);
                expect(args[3]).toEqual({session: 'data'});
            });
        });
    });
});
