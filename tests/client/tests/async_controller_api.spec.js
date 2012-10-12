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

describe('AsyncController API', function () {
    describe('Get Child', function () {
        it('should get a child', ['raintime/async_controller'],
           function (AsyncController) {
                AsyncController.prototype._getChild.andCallThrough();

                var fakeController = jasmine.createSpyObj('fakeController', ['on']);
                fakeController.on.andCallFake(function (event, handler) {
                    handler();
                });

                var ac = new AsyncController();
                ac.context = {};
                ac.context.find = jasmine.createSpy();
                ac.context.find.andCallFake(function (sid, fn) {
                    fn.apply(fakeController);
                });

                var resolvedController;
                var sid = "123";
                ac._getChild(sid).then(function (controller) {
                    resolvedController = controller;
                });

                expect(resolvedController).toEqual(fakeController);
                expect(ac.context.find).toHaveBeenCalledWith(sid, jasmine.any(Function));
                expect(fakeController.on).toHaveBeenCalledWith('start', jasmine.any(Function));

           }
        );

        it ('should get the child from the cache', ['raintime/async_controller' , 'util'],
            function(AsyncController,Util){
                AsyncController.prototype._getChild.andCallThrough();
                Util.defer.andCallThrough();

                var fakeController = {'on' : 'start'};

                var ac = new AsyncController();
                ac.context = {};
                ac.context.find = jasmine.createSpy();
                ac._controllers['sid1'] = fakeController;

                var isFinished = false,
                    resolvedController;

                runs(function () {
                    ac._getChild('sid1').then(function (controller) {
                        resolvedController = controller;
                        isFinished = true;
                    });
                });

                waitsFor(function(){
                    return isFinished;
                }, 'service to be retrieved');

                runs(function () {
                    expect(ac.context.find).not.toHaveBeenCalled();
                    expect(resolvedController).toEqual(fakeController);
                });
            }
        );

        it ('should get an error if no sid found',
            ['raintime/async_controller', 'util', 'raintime/lib/rain_error'],
            function(AsyncController,Util,rain_error){
                AsyncController.prototype._getChild.andCallThrough();
                Util.defer.andCallThrough();

                var ac = new AsyncController();
                ac.context = {};
                ac.context.find = jasmine.createSpy();
                ac.context.find.andCallFake(function (sid){
                    return [sid];
                });

                var isFinished = false,
                    sid = '123',
                    error;

                runs(function () {
                    ac._getChild(sid).then(
                        function () {},
                        function (err) {
                            error = err;
                            isFinished = true;
                        }
                    );
                });

                waitsFor(function(){
                    return isFinished;
                }, 'service to be retrieved');

                runs(function () {
                    expect(ac.context.find).toHaveBeenCalledWith(sid, jasmine.any(Function));
                    expect(error).toBeDefined();
                });
            }
        );
    });

    describe('_onChild', function () {
        it('should step through all the phases', ['raintime/async_controller'],
           function (AsyncController) {
                AsyncController.prototype._onChild.andCallThrough();

                var sid = "123",
                    event = "click",
                    isFinished = false,
                    fakeController = jasmine.createSpyObj('fakeController', ['on']),
                    ac = new AsyncController();

                fakeController.on.andCallFake(function (event, handler) {
                    handler();
                });

                ac._getChild.andCallFake(function (sid) {
                    return fakeController;
                });

                runs(function () {
                    ac._onChild(sid, event, function () {
                        isFinished = true;
                    });
                });

                waitsFor(function() {
                    return isFinished;
                },'service to be retrieved');

                runs(function () {
                    expect(fakeController.on).toHaveBeenCalledWith(event, jasmine.any(Function));
                    expect(ac._getChild).toHaveBeenCalledWith(sid);
                });
            }
        );
    });

    describe('_getChildren', function () {
        it('should call getChild() with sid',
            ['raintime/async_controller', 'raintime/lib/promise' , 'util'],
            function (AsyncController, promise, util) {
                AsyncController.prototype._getChildren.andCallThrough();
                util.defer.andCallThrough();

                var fakeController1 = jasmine.createSpyObj('fakeController', ['on']),
                    fakeController2 = jasmine.createSpyObj('fakeController', ['on']),
                    ac = new AsyncController(),
                    isFinished = false,
                    resolvedObject,
                    expecting = {
                        sid1 : fakeController1,
                        sid2 : fakeController2
                    };

                ac._getChild.andCallFake(function (sid) {
                    var deferred = promise.defer();
                    if (sid === 'sid1'){
                        util.defer(deferred.resolve.bind(self, fakeController1));
                    }
                    if (sid === 'sid2'){
                        util.defer(deferred.resolve.bind(self, fakeController2));
                    }
                    return deferred.promise;
                });

                ac._getChildren(['sid1', 'sid2']).then(function (controllers) {
                    resolvedObject = controllers;
                    isFinished = true;
                });

                waitsFor( function (){
                    return isFinished;
                },'service to be retrieved');

                runs(function () {
                    expect(resolvedObject).toEqual(expecting);
                    expect(ac._getChild).toHaveBeenCalledWith('sid1');
                    expect(ac._getChild).toHaveBeenCalledWith('sid2');
                });
           }
        );
    });
});