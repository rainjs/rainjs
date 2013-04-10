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

'use strict';

describe('Monitoring Adapter', function () {
    var path = require('path'),
        modulePath, configuration, ConcreteAdapter, Adapter;

    beforeEach(function () {
        var mocks = {};

        configuration = mocks['../configuration'] = {
            'monitoring': {
                'adapter': {
                    'module': './plugins/server/zabbix_sender',
                    'options': {
                        'host': '127.0.0.1',
                        'port': 10051,
                        'monitoringHost': 'RAIN'
                    }
                }
            }
        };

        mocks['../logging'] = jasmine.createSpyObj('Logger', ['get']);
        mocks['../logging'].get.andReturn({error: jasmine.createSpy('error')});


        modulePath = path.join(process.cwd(), configuration.monitoring.adapter.module);

        ConcreteAdapter = mocks[modulePath] = jasmine.createSpy('ConcreteAdapter');
        ConcreteAdapter.andReturn({});

        Adapter = loadModuleExports('/lib/monitoring/adapter.js', mocks);
    });

    it('should initialize the adapter with the specified options', function () {
        var adapter = Adapter.get();

        expect(adapter).toBeDefined();
        expect(ConcreteAdapter).toHaveBeenCalledWith(configuration.monitoring.adapter.options);
    });

    it('should return the cached instance', function () {
        var instance1 = Adapter.get();
        var instance2 = Adapter.get();

        expect(instance1).toBe(instance2);
        expect(ConcreteAdapter.calls.length).toEqual(1);
    });

    it('should return null if no adapter options were specified', function () {
        configuration.monitoring = null;

        var adapter = Adapter.get();

        expect(adapter).toEqual(null);
    });

    it ('should throw an error if the module path is missing', function () {
        configuration.monitoring.adapter.module = null;

        expect(function () {
            Adapter.get();
        }).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
    });

    it('should throw an error if the adapter fails to initialize', function () {
        ConcreteAdapter.andThrow('error');

        expect(function () {
            Adapter.get();
        }).toThrow();
    });
});
