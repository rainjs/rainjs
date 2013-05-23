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

describe("Server Side Translation", function () {
    var mocks = {},
        fs, configuration, Translation, poUtils;

    beforeEach(function () {

        fs = jasmine.createSpyObj('fs', ['readFileSync']);
        mocks['fs'] = fs;

        configuration = {
            defaultLanguage: 'en_EN',
            language: 'ro_RO'
        };
        mocks['./configuration'] = configuration;

        poUtils = jasmine.createSpyObj('poUtils', ['parsePo']);
        mocks['./po_utils'] = poUtils;

        Translation = loadModuleExports('/lib/translation.js', mocks);

    });

    describe("Constructor", function () {
        it('should construct the object corectly', function () {

        });
    });

    describe("Singleton method", function () {

        it('should construct the object only once', function () {

        });

    });

    describe("loadLanguageFile method", function () {

    });

    describe("getLocales method", function () {

    });

    describe("generateContext method", function () {

        it('should generate the context corectly', function () {

        });

    });

    describe("translate method", function () {

    });
});
