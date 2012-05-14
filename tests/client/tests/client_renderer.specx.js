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

var component = {
    "css": ['/example/2.0.1/css/index.css'],
    "children": [],
    "html": "<div>Lorem ipsum et sit dolor</div>",
    "controller": "/example/2.0.1/js/index.js",
    "instanceId": "749e5b7af8b12c1e780b17831fe7b981e56c94d7",
    "staticId": "",
    "id": "example",
    "version": "2.0.1",
    "error": null
};


describe('Client Renderer', function () {
    return; // disable this test till it gets refactored

    beforeEach(function () {
        $('body').append($('<div id="' + component.instanceId + '"></div>'));
    });

    it('must add the component to the DOM', ['raintime/client_rendering'], function (ClientRenderer) {
        var element = $('#' + component.instanceId);
        ClientRenderer.renderComponent(component);

        expect(element.html()).toBe(component.html);
        expect(element.attr('class')).toBe('app-container example_2_0_1');
        expect(element.css('display')).toBe('none');
    });

    it('must register the component to the component registry', [
        'raintime', 'raintime/client_rendering'
        ], function (Raintime, ClientRenderer) {
        spyOn(Raintime.componentRegistry, 'register');
        ClientRenderer.renderComponent(component);

        expect(Raintime.componentRegistry.register).toHaveBeenCalledWith(component);
    });

    afterEach(function () {
        $('#' + component.instanceId).remove();
    });
});
