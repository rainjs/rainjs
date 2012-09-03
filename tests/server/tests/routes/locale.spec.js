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

describe('locale route', function () {
    var locale, routerUtils, Translation, translation, request, response;
    var locales =  {
        language: { 'msgid': 'translation' },
        defaultLanguage: { 'msgid': 'translation2' }
    };

    beforeEach(function () {
        var mocks = {};
        routerUtils = mocks['../router_utils'] =
            jasmine.createSpyObj('routerUtils', ['setResourceHeaders']);
        Translation = mocks['../translation'] = jasmine.createSpyObj('Translation', ['get']);
        translation = jasmine.createSpyObj('translation', ['getLocales']);
        translation.getLocales.andReturn(locales);
        Translation.get.andReturn(translation);

        mocks['../environment'] = function () {
            this.language = 'de_DE';
        };
        locale = loadModuleExports('/lib/routes/locale.js', mocks);

        request = {
            component: {
                id: 'test',
                version: '2.0'
            },
            path: 'en_US',
            session: {
                userLanguage: 'de_DE'
            }
        };

        response = jasmine.createSpyObj('response', ['end']);
    });

    it('should send the locales as json', function () {
        routerUtils.setResourceHeaders.andReturn({sendBody: true});

        locale.handle(request, response);

        expect(response.end).toHaveBeenCalledWith(JSON.stringify(locales));
        expect(translation.getLocales).toHaveBeenCalledWith(request.component, request.path);
    });

    it('should send partial content', function () {
        routerUtils.setResourceHeaders.andReturn({sendBody: true, start: 1, end: 10});

        locale.handle(request, response);
        expect(response.end).toHaveBeenCalledWith('"language"');
        expect(translation.getLocales).toHaveBeenCalledWith(request.component, request.path);
    });

    it('should use environment language if path is empty', function () {
        routerUtils.setResourceHeaders.andReturn({sendBody: true});
        request.path = null;

        locale.handle(request, response);

        expect(response.end).toHaveBeenCalledWith(JSON.stringify(locales));
        expect(translation.getLocales).toHaveBeenCalledWith(request.component, 'de_DE');
    });

    it('should match the paths', function () {
        expect(locale.route.test('/test/1.0/locale')).toBe(true);
        expect(locale.route.test('/test/1.0/locale/')).toBe(true);
        expect(locale.route.test('/test/1.0/locale/en_US')).toBe(true);
        expect(locale.route.test('/test/1.0/locale/en_US/')).toBe(true);
        expect(locale.route.test('/test/locale')).toBe(true);
        expect(locale.route.test('/test/locale/')).toBe(true);
        expect(locale.route.test('/test/locale/en_US')).toBe(true);
        expect(locale.route.test('/test/locale/en_US/')).toBe(true);
    });

    it('should not match the paths', function () {
        expect(locale.route.test('/test')).toBe(false);
        expect(locale.route.test('/test/1.0')).toBe(false);
        expect(locale.route.test('/test/1.0/example')).toBe(false);
        expect(locale.route.test('/test/1.0/example/')).toBe(false);
        expect(locale.route.test('/test/1.0/locale/en_US/more')).toBe(false);
        expect(locale.route.test('/test/locale/en_US/more')).toBe(false);
    });
});
