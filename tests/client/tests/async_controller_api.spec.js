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
    var Mocks, ac;

    beforeEach(function () {
        Mocks = {};
        ac = null;
    });


    describe('Get Child', function () {
        it('should get a child', ['raintime/async_controller'],
           function (AsyncController) {
                AsyncController.prototype._getChild.andCallThrough();
                ac = new AsyncController();
                ac.context = {};
                ac.context.find = jasmine.createSpy();
                var sid = "123";
                var promise = ac._getChild(sid);
                expect(ac.context.find).toHaveBeenCalled();
           }
        );
    });

    describe('_onChild', function () {
        it('should start the controller first', ['raintime/async_controller'],
           function (AsyncController) {
                AsyncController.prototype._onChild.andCallThrough();
                ac = new AsyncController();
                var sid = "123";
                ac.context = {};
                ac._getChild = jasmine.createSpy();
                var evName = 'click';
                var evHandler = {};
                var controller = ac._onChild(sid,evName,evHandler);
                expect(ac._getChild).toHaveBeenCalled();
           }
        );
    });

    describe('_getChildren', function () {
        it('should call getChild() with sid', ['raintime/async_controller'],
           function (AsyncController) {
                AsyncController.prototype._getChildren.andCallThrough();
                ac = new AsyncController();
                var sid = "123";
                ac.context = {};
                ac._getChildren = jasmine.createSpy();
                var children = ac._getChildren(sid);
                expect(ac._getChildren).toHaveBeenCalled();
           }
        );
    });

    describe('_getChildren', function () {
        it('should call getChild() with no sid, should get the component`s children', ['raintime/async_controller'],
           function (AsyncController) {
                AsyncController.prototype._getChildren.andCallThrough();
                ac = new AsyncController();
                ac.context = {};
                ac.context.component = jasmine.createSpyObj('component', ['children']);
                ac._getChildren = jasmine.createSpy();
                var children = ac._getChildren();
                expect(ac.context.component.children).toBeDefined();
                expect(ac._getChildren).toHaveBeenCalled();
           }
        );
    });

});