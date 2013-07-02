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

describe('Plural translation helper', function () {
    var translationHelper, Translation;

    beforeEach(function () {
        var mocks = {};
        mocks['../renderer'] = {
            rain: {
                component: 'comp',
                environment: {
                    language: 'ro',
                }

            }
        };

        mocks['../translation'] = jasmine.createSpyObj('translation', ['get']);
        Translation = jasmine.createSpyObj('Translation', ['translate']);
        mocks['../translation'].get.andReturn(Translation);

        translationHelper = loadModuleExports('/lib/handlebars/translation_plural.js', mocks);
    });

    it('should properly call plural translation with no id passed', function () {
        translationHelper.helper('Message', 'Plural', 2, {hash: {}});

        expect(Translation.translate)
            .toHaveBeenCalledWith('comp', 'ro', 'Message', 'Message', 'Plural', 2, []);
    });


    it('should properly call translation with id passed', function () {
        translationHelper.helper('Message', 'Plural', 2, {hash: {id: 'button.foo'}});

        expect(Translation.translate)
            .toHaveBeenCalledWith('comp', 'ro', 'button.foo', 'Message', 'Plural', 2, []);
    });

    it('should properly call translation with no id and more arguments passed', function () {
        translationHelper.helper('Message', 'Plural', 2, 'arg1', 'arg2', {hash: {}});

        expect(Translation.translate)
            .toHaveBeenCalledWith('comp', 'ro', 'Message', 'Message', 'Plural', 2, ['arg1', 'arg2']);
    });

    it('should properly call translation with id and more arguments passed', function () {
        translationHelper.helper('Message', 'Plural', 2, 'arg1', 'arg2', {hash: {id: 'button.foo'}});

        expect(Translation.translate)
            .toHaveBeenCalledWith('comp', 'ro', 'button.foo', 'Message', 'Plural', 2, ['arg1', 'arg2']);
    });


    it('should properly call translation with id and more arguments passed when var parameter is used', function () {
        translationHelper.helper('Message', 'Plural', 2, 'arg1', 'arg2', {hash: {id: 'button.foo', 'var': 'translationVarName'}});

        expect(Translation.translate)
            .toHaveBeenCalledWith('comp', 'ro', 'button.foo', 'Message', 'Plural', 2, ['arg1', 'arg2']);
    });

    it('should return an empty string when var parameter is used', function () {
        var message = translationHelper.helper('Message', 'Plural', 2, 'arg1', 'arg2', {hash: {id: 'button.foo', 'var': 'translationVarName'}});

        expect(message).toEqual('');
    });

    it('should add the current translation message on a variable on context when var parameter is used', function () {
        var context = {},
            options = {hash: {id: 'button.foo', 'var': 'translationVarName'}};

        Translation.translate.andCallFake(function () {
                return 'plural translated message';
        });

        translationHelper.helper.call(context, 'Message', 'Plural', 2, 'arg1', 'arg2', options);

        expect(context['translationVarName']).toBeDefined();
        expect(context['translationVarName']).toEqual('plural translated message');
    });

});
