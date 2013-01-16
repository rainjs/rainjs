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

describe('partial handlebars helper', function () {
    var helper, renderer, componentRegistry, Handlebars, logger, componentConfig;

    beforeEach(function () {
        componentConfig = {
            partials: {
                'test': jasmine.createSpy('test')
            }
        };

        var mocks = {};

        componentRegistry = mocks['../component_registry'] =
            jasmine.createSpyObj('componentRegistry', ['getConfig']);
        componentRegistry.getConfig.andReturn(componentConfig);

        renderer = mocks['../renderer'] = {
            rain: {
                component: {
                    id: 'example',
                    version: '1.0'
                }
            }
        };

        Handlebars = mocks['handlebars'] = jasmine.createSpyObj('Handlebars', ['SafeString']);
        Handlebars.SafeString.andReturn({string: 'SafeString'});

        mocks['../logging'] = jasmine.createSpyObj('logging', ['get']);
        logger = jasmine.createSpyObj('logger', ['error']);
        mocks['../logging'].get.andReturn(logger);

        helper = loadModuleExports('/lib/handlebars/partial.js', mocks).helper;
    });

    it('should log an error if the partial is undefined', function () {
        var markup = helper('inexistent');

        expect(markup).toEqual('');
        expect(logger.error).toHaveBeenCalled();
        expect(componentRegistry.getConfig).toHaveBeenCalledWith('example', '1.0');

    });

    it('should log an error if the partial has errors', function () {
        componentConfig.partials.test.andThrow('error message');

        var markup = helper('test');

        expect(markup).toEqual('');
        expect(logger.error).toHaveBeenCalled();
        expect(componentRegistry.getConfig).toHaveBeenCalledWith('example', '1.0');
        expect(componentConfig.partials.test).toHaveBeenCalled();
    });

    it('should return the markup', function () {
        componentConfig.partials.test.andReturn('markup');

        var markup = helper('test');

        expect(markup).toEqual({string: 'SafeString'});
        expect(Handlebars.SafeString).toHaveBeenCalledWith('markup');
        expect(componentRegistry.getConfig).toHaveBeenCalledWith('example', '1.0');
        expect(componentConfig.partials.test).toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
    });
});
