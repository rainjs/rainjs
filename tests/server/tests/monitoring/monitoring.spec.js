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

describe("Monitoring module", function () {

    var util = require('util');
    var mocks = [], logger, config, adapter, crypto, Monitoring, hasRunned,
        map;

    beforeEach(function () {
        map = {};

        spyOn(process, 'nextTick');

        process.nextTick.andCallFake(function (fn) {
            hasRunned = true;
            fn();
        });

        spyOn(global, 'setInterval');
        global.setInterval.andCallFake(function (fn, time) {
            if(map[time] && !(map[time] instanceof Array)) {
                var oldFn = map[time];
                map[time] = [];
                map[time].push(oldFn);
                map[time].push(fn);
            } else if (map[time] instanceof Array) {
                map[time].push(fn);
            } else {
                map[time] = fn;
            }
        });


        spyOn(Date, 'now');
        Date.now.andCallFake(function () {
            return 1;
        })

        logger = jasmine.createSpyObj('Spy.logger', ['info', 'debug', 'error', 'warning']);
        mocks['../logging'] =  {
            get: function () {
                return logger;
            }
        };

        config = {
            monitoring: {
                step: 2,
                metrics: {
                    fakeUseCase: {
                        key: "fakeKey",
                        operation: "count"
                    }
                }
            }
        };
        mocks['../configuration'] = config;

        adapter = jasmine.createSpyObj('Spy.adapter', ['sendData']);
        adapter.sendData.andDefer(function (defer) {
            defer.resolve();
        });
        mocks['./adapter'] =  {
            get: function () {
                return adapter;
            }
        };

        crypto = jasmine.createSpyObj('Spy.crypto', ['randomBytes']);
        crypto.randomBytes.andCallFake(function () {
            var id = 'uniqueId';
            return id;
        });
        mocks['crypto'] = crypto;

        Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

    });

    describe('Singleton Get', function () {
        it('should always get the same instance', function () {

            var monitoring = Monitoring.get();
            var newMonitoringInstance = Monitoring.get();

            expect(monitoring).toBe(newMonitoringInstance);
        })
    });

    describe("Constructor", function () {

        it('should throw error if one of the use cases have no zabbix key', function () {
            config = {
                monitoring: {
                    step: 2,
                    metrics: {
                        fakeUseCase: {
                            operation: "count"
                        }
                    }
                }
            };
            mocks['../configuration'] = config;

            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);
            expect(function () {Monitoring.get()}).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
        });

        it('should throw error if operation is not supported', function () {
            config = {
                monitoring: {
                    step: 2,
                    metrics: {
                        fakeUseCase: {
                            key: 'fakeKey',
                            operation: "otherOperation"
                        }
                    }
                }
            };
            mocks['../configuration'] = config;

            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);
            expect(function () {Monitoring.get()}).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
        });

        it('should throw error if one of the use cases doesn`t have operation key', function () {
            config = {
                monitoring: {
                    step: 2,
                    metrics: {
                        fakeUseCase: {
                            key: "fakeKey"
                        }
                    }
                }
            };
            mocks['../configuration'] = config;

            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);
            expect(function () {Monitoring.get()}).toThrowType(RainError.ERROR_PRECONDITION_FAILED);

        });

        it('should disable the module if monitoring key is missing from configuration', function () {
            config = null;
            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            expect(monitoring._disabled).toBe(true);
        });

        it('should disable the module if adapter is null', function () {
            adapter = null;
            mocks['./adapter'] =  {
                get: function () {
                    return adapter;
                }
            };
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            expect(monitoring._disabled).toBe(true);
        });

        it('should disable the module if this is specified in the monitoring.conf', function () {

            config = {
                monitoring: {
                    step: 2,
                    disabled: true,
                    metrics: {
                        fakeUseCase: {
                            key: "fakeKey",
                            operation: "average"
                        }
                    }
                }
            };
            mocks['../configuration'] = config;

            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            expect(monitoring._disabled).toBe(true);
        });

        it('should disable the module if metrics key are missing from the monitoring configuration', function () {
            config = {
                monitoring: {}
            };
            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            expect(monitoring._disabled).toBe(true);
        });

        it('should not disable the module if adapter, configuration and metrics for monitoring are in place',
            function () {

                var monitoring = Monitoring.get();

                expect(monitoring._disabled).toBe(undefined);

        });

        it('should create a measurementMap from the configuration file', function () {

            var monitoring = Monitoring.get();

            expect(monitoring._measurementMap).toEqual(config.monitoring.metrics);
        });

        it('should exclude from the measurementMap the disabled use cases', function () {
            config = {
                monitoring: {
                    metrics: {
                        disabledUseCase: {
                            key: "disabledUseCase",
                            operation: "count",
                            disabled: true
                        },

                        enabledUseCase: {
                            key: "enabledKey",
                            operation: "average"
                        }
                    }
                }
            };
            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            expect(monitoring._measurementMap).toEqual({
                enabledUseCase: {
                    key: "enabledKey",
                    operation: "average"
                }
            });
        });

        it('should set the default send rate', function () {

            var monitoring = Monitoring.get();

            expect(setInterval.calls.length).toEqual(1);
        });

        it('should set the default send rate and overwrite sendRate for different use cases', function () {
            config = {
                monitoring: {
                    metrics: {
                        UseCase: {
                            key: "disabledUseCase",
                            operation: "count"
                        },

                        differentUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };


            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            map[20000]();
            map[60000]();
            expect(setInterval.calls.length).toEqual(2);
            expect(adapter.sendData).not.toHaveBeenCalled();
        });

        it('should set the default send rate to 60 seconds if missing', function () {
            config = {
                monitoring: {
                    metrics: {
                        UseCase: {
                            key: "disabledUseCase",
                            operation: "count"
                        },

                        differentUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            expect(monitoring._globalStep).toBe(60);
        });

        it('should not load plugins if the loadMeasurementPlugins key does not exist', function () {
            var monitoring = Monitoring.get();

            waitsFor(function () {
                return hasRunned === true;
            });

            runs(function () {
                expect(monitoring._measurementPlugins).toEqual({});
            });
        });

        it('should not load a specific plugin if the plugin is disabled', function () {
            config = {
                monitoring: {
                    "measurementPlugins": {
                        "disabled": false,
                        "plugins": {
                            "systemChecks": {
                                "disabled": true,
                                "path": "./plugins/server/monitoring/system_checks"
                            },
                            "otherTest": {
                                "disabled": false,
                                "path": "./plugins/server/monitoring/something"
                            }
                        }
                    },

                    metrics: {
                        UseCase: {
                            key: "disabledUseCase",
                            operation: "count"
                        },

                        "otherTest": {
                            key: 'someKey',
                            operation: "count"
                        },

                        differentUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            var fakePlugin = jasmine.createSpyObj('fake', ['run']);
            mocks[path.join(process.cwd(), './plugins/server/monitoring/something')] = fakePlugin;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            waitsFor(function () {
                return hasRunned === true;
            });

            runs(function () {
                expect(monitoring._measurementPlugins.systemChecks).toBeUndefined();
                expect(monitoring._measurementPlugins.otherTest).toBe(fakePlugin);
            });
        });

        it('should not load plugins if the measurementPlugin key is disabled', function () {
            config = {
                monitoring: {
                    "measurementPlugins": {
                        "disabled": false,
                        "plugins": {
                            "systemChecks": {
                                "disabled": true,
                                "path": "./plugins/server/monitoring/system_checks"
                            },
                            "otherTest": {
                                "disabled": false,
                                "path": "./plugins/server/monitoring/something"
                            }
                        }
                    },

                    metrics: {
                        UseCase: {
                            key: "disabledUseCase",
                            operation: "count"
                        },

                        "otherTest": {
                            disabled: true,
                            key: 'someKey',
                            operation: "count"
                        },

                        differentUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            waitsFor(function () {
                return hasRunned === true;
            });

            runs(function () {
                expect(monitoring._measurementPlugins).toEqual({});
            });
        });

        it('should not load plugins if the measurementPlugin key does not exist', function () {
            config = {
                monitoring: {
                    metrics: {
                        UseCase: {
                            key: "disabledUseCase",
                            operation: "count"
                        },

                        differentUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            waitsFor(function () {
                return hasRunned === true;
            });

            runs(function () {
                expect(monitoring._measurementPlugins).toEqual({});
            });
        });

        it('should register measurement plugins from the configuration', function () {
            config = {
                monitoring: {
                    "measurementPlugins": {
                        "disabled": false,
                        "plugins": {
                            "otherTest": {
                                "path": "./plugins/server/monitoring/something"
                            }
                        }
                    },

                    metrics: {
                        UseCase: {
                            key: "disabledUseCase",
                            operation: "count"
                        },

                        "otherTest": {
                            key: 'someKey',
                            operation: "count"
                        },

                        differentUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            var fakePlugin = jasmine.createSpyObj('fake', ['run']);
            mocks[path.join(process.cwd(), './plugins/server/monitoring/something')] = fakePlugin;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            waitsFor(function () {
                return hasRunned === true;
            });

            runs(function () {
                expect(monitoring._measurementPlugins.otherTest).toBe(fakePlugin);
            });
        });

        it('should run the plugins at the preset interval of time', function () {
            config = {
                monitoring: {
                    "measurementPlugins": {
                        "disabled": false,
                        "plugins": {
                            "otherTest": {
                                "path": "./plugins/server/monitoring/something"
                            }
                        }
                    },

                    metrics: {
                        UseCase: {
                            key: "disabledUseCase",
                            operation: "count"
                        },

                        "otherTest": {
                            key: 'someKey',
                            operation: "count"
                        },

                        differentUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            var fakePlugin = jasmine.createSpyObj('fake', ['run']);
            mocks[path.join(process.cwd(), './plugins/server/monitoring/something')] = fakePlugin;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            waitsFor(function () {
                return hasRunned === true;
            });

            runs(function () {
                /*the first one in this interval will be the run of the plugin and 60 seconds is the default
                interval*/
                map[60000][0]()
                expect(fakePlugin.run).toHaveBeenCalled();
                expect(monitoring._measurementPlugins.otherTest).toBe(fakePlugin);
            });
        });

        it('should not load plugins if the use case is disabled', function () {
            config = {
                monitoring: {
                    "measurementPlugins": {
                        "disabled": false,
                        "plugins": {
                            "otherTest": {
                                "path": "./plugins/server/monitoring/something"
                            }
                        }
                    },

                    metrics: {
                        UseCase: {
                            key: "disabledUseCase",
                            operation: "count"
                        },

                        differentUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            waitsFor(function () {
                return hasRunned === true;
            });

            runs(function () {
                expect(monitoring._measurementPlugins).toEqual({});
            });
        });

        it('should run the plugins at the specified interval of time', function () {
            config = {
                monitoring: {
                    "measurementPlugins": {
                        "disabled": false,
                        "plugins": {
                            "otherTest": {
                                "path": "./plugins/server/monitoring/something"
                            }
                        }
                    },

                    metrics: {
                        UseCase: {
                            key: "disabledUseCase",
                            operation: "count"
                        },

                        "otherTest": {
                            key: 'someKey',
                            operation: "count",
                            step: 3
                        },

                        differentUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            var fakePlugin = jasmine.createSpyObj('fake', ['run']);
            mocks[path.join(process.cwd(), './plugins/server/monitoring/something')] = fakePlugin;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            waitsFor(function () {
                return hasRunned === true;
            });

            runs(function () {
                //the first one in this interval will be the run of the plugin
                map[3000][0]();
                expect(fakePlugin.run).toHaveBeenCalled();
                expect(monitoring._measurementPlugins.otherTest).toBe(fakePlugin);
            });
        });

    });

    describe("StartMeasurement", function () {

        it('should not run the method if the module is disabled', function () {

            config = {
                monitoring: {}
            };
            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            expect(monitoring._disabled).toBe(true);
            expect(monitoring.startMeasurement('fakeUseCase')).toBe(undefined);


        });

        it('should log an error if use case is not passed to the method', function () {

            var monitoring = Monitoring.get();

            monitoring.startMeasurement();

            expect(logger.error).toHaveBeenCalled();
        });

        it('should log an error if invalid or disabled use case is passed to the method', function () {

            var monitoring = Monitoring.get();
            monitoring.startMeasurement('wrongUseCase');

            expect(logger.error).toHaveBeenCalled();
        });

        it('should generate an id if no id is passed', function () {

            var monitoring = Monitoring.get();

            var id = monitoring.startMeasurement('fakeUseCase');

            expect(id).toEqual('uniqueId');
        });

        it('should always return the id even though it is passed', function () {

            var monitoring = Monitoring.get();

            var id = monitoring.startMeasurement('fakeUseCase', 'passedId');

            expect(id).toEqual('passedId');
        });

        it('should register measurements to the map if no id is passed, no id should be pushed' +
            'if operation is count and also should increment the active requests', function () {

            var monitoring = Monitoring.get();

            monitoring.startMeasurement('fakeUseCase');

            expect(monitoring._measurementMap["fakeUseCase"].measurements).toEqual({
                resolvedRequests: 0,
                activeRequests: 1,
                start: 1
            });
        });

        it('should register measurements and id to map if operation is average, should set the current' +
            'time for the pushed id and should increment the active requests', function () {

            config = {
                monitoring: {
                    metrics: {
                        averageUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            monitoring.startMeasurement('averageUseCase');

            expect(monitoring._measurementMap["averageUseCase"].measurements).toEqual({
                total: 0,
                activeRequests: 1,
                resolvedRequests: 0,
                uniqueId: {
                    times: [],
                    time: Date.now()
                },
                start: 1
            });
        });

        it('should push another id to the metrics map of an useCase if concurency, should set the activeRequests' +
            'to the number of concurent ids/users', function () {

            config = {
                monitoring: {
                    metrics: {
                        averageUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            monitoring.startMeasurement('averageUseCase', 'id1');
            monitoring.startMeasurement('averageUseCase', 'id2');

            expect(monitoring._measurementMap["averageUseCase"].measurements).toEqual({
                total: 0,
                activeRequests: 2,
                resolvedRequests: 0,
                id1: {
                    times: [],
                    time: Date.now()
                },
                id2: {
                    times: [],
                    time: Date.now()
                },
                start: 1
            });
        });
    });

    describe("Stop Measurement", function () {

        it('should log an error if usecase is not passed', function () {

            var monitoring = Monitoring.get();

            monitoring.startMeasurement('fakeUseCase');
            monitoring.endMeasurement();
            expect(logger.error).toHaveBeenCalled();

        });

        it('should log an error if usecase is invalid', function () {

            var monitoring = Monitoring.get();
            monitoring.endMeasurement('invalid');

            expect(logger.error).toHaveBeenCalled();

        });

        it('should log a debug message if usecase is disabled', function () {

            config = {
                monitoring: {
                    metrics: {
                        averageUseCase: {
                            key: "enabledKey",
                            operation: "average",
                            disabled: true,
                            step: 20
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();
            monitoring.endMeasurement('averageUseCase');

            expect(logger.debug).toHaveBeenCalled();
        });

        it('should log an error if it is called although no measurement was started', function () {

            var monitoring = Monitoring.get();
            monitoring.endMeasurement('fakeUseCase');

            expect(logger.error).toHaveBeenCalled();

        });

        it('should get the time of a request from start to end and added to total', function () {

            var times = 1;

            Date.now.andCallFake(function () {
                if(times === 1) {
                    times ++;
                    return 1;
                } else {
                    return 3;
                }
            });

            config = {
                monitoring: {
                    step: 2,
                    metrics: {
                        fakeUseCase: {
                            key: "fakeKey",
                            operation: "average"
                        }
                    }
                }
            };
            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            var id = monitoring.startMeasurement('fakeUseCase');
            monitoring.endMeasurement('fakeUseCase', id);

            expect(monitoring._measurementMap['fakeUseCase'].measurements.total).toEqual(2);

        });

        it('should increment the number of finished requests on end', function () {

            var monitoring = Monitoring.get();

            var id = monitoring.startMeasurement('fakeUseCase');
            monitoring.endMeasurement('fakeUseCase', id);

            expect(monitoring._measurementMap['fakeUseCase'].measurements.resolvedRequests).toEqual(1);

        });

        it('should flag the specified id from the map that it has finished the requests if average', function () {

            var times = 1;

            Date.now.andCallFake(function () {
                if(times === 1) {
                    times ++;
                    return 1;
                } else {
                    return 3;
                }
            });

            config = {
                monitoring: {
                    step: 2,
                    metrics: {
                        fakeUseCase: {
                            key: "fakeKey",
                            operation: "average"
                        }
                    }
                }
            };
            mocks['../configuration'] = config;
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            var id = monitoring.startMeasurement('fakeUseCase');
            monitoring.endMeasurement('fakeUseCase', id);

            expect(monitoring._measurementMap['fakeUseCase'].measurements[id].end).toBe(true);
        });

        it('should reduce the number of active connections when measurement finishes', function () {

            var monitoring = Monitoring.get();

            var id = monitoring.startMeasurement('fakeUseCase');
            monitoring.endMeasurement('fakeUseCase', id);

            expect(monitoring._measurementMap['fakeUseCase'].measurements.activeRequests).toEqual(0);
        });

    });

    describe("Close", function () {

        it('should compose all data and send it to the server not depending on interval', function () {

            var isResolved;
            var monitoring = Monitoring.get();

            var id = monitoring.startMeasurement('fakeUseCase');
            monitoring.endMeasurement('fakeUseCase', id);
            monitoring.close().then(function () {
                isResolved = true;
            }, function () {
                isResolved = false;
            });

            waitsFor(function () {
                return typeof isResolved !== 'undefined'
            }, 'the sending has been resolved');

            runs(function () {
                expect(isResolved).toBe(true);
                expect(adapter.sendData).toHaveBeenCalledWith(
                    [{
                        key: 'fakeKey',
                        value: monitoring._measurementMap['fakeUseCase'].measurements.activeRequests
                    }]
                );
            })

        });

    });

    describe("Register Event", function () {

        it('should register an event to the map', function () {
            var monitoring = Monitoring.get();

            monitoring.registerEvent('fakeUseCase');

            expect(monitoring._measurementMap['fakeUseCase'].measurements).toBeDefined();

        });

        it('should increase the number of active connections if no value is sent', function () {
            var monitoring = Monitoring.get();

            monitoring.registerEvent('fakeUseCase');

            expect(monitoring._measurementMap['fakeUseCase'].measurements.activeRequests).toBe(1);
        });

        it('should add the value passed to the method of the registered event', function () {
            var monitoring = Monitoring.get();

            monitoring.registerEvent('fakeUseCase', 3);

            expect(monitoring._measurementMap['fakeUseCase'].measurements.activeRequests).toBe(3);
        });
    });

    describe('Sending data to adapter', function () {
        it('should reset the values after a period of time', function () {
            var wasCalled;
            config = {
                monitoring: {
                    step: 2,
                    metrics: {
                        fakeUseCase: {
                            key: "fakeKey",
                            operation: "average"
                        }
                    }
                }
            };

            var times = 1;

            Date.now.andCallFake(function () {
                if(times === 1) {
                    times ++;
                    return 1;
                } else {
                    return 3;
                }
            });
            mocks['../configuration'] = config;
            adapter.sendData.andDefer(function (defer) {
                wasCalled = true;
                defer.resolve();
            });
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            var id = monitoring.startMeasurement('fakeUseCase');
            monitoring.endMeasurement('fakeUseCase', id);

            expect(monitoring._measurementMap['fakeUseCase'].measurements.total).toBe(2);
            expect(monitoring._measurementMap['fakeUseCase'].measurements.resolvedRequests).toBe(1);

            map[2000]();

            waitsFor(function () {
                return typeof wasCalled !== 'undefined'
            }, 'sent data to zabbix');

            runs(function () {
                expect(adapter.sendData).toHaveBeenCalledWith([{
                    key: 'fakeKey',
                    value: 2
                }]);

                expect(monitoring._measurementMap['fakeUseCase'].measurements.total).toBe(0);
                expect(monitoring._measurementMap['fakeUseCase'].measurements.resolvedRequests).toBe(0);
            });
        });

        it('should keep the active requests until they are resolved', function () {

            config = {
                monitoring: {
                    step: 2,
                    metrics: {
                        fakeUseCase1: {
                            key: "fakeKey",
                            operation: "average"
                        }
                    }
                }
            };

            var times = 1;

            Date.now.andCallFake(function () {
                if(times === 1) {
                    times ++;
                    return 1;
                } else {
                    return 3;
                }
            });
            var wasCalled;
            mocks['../configuration'] = config;
            adapter.sendData.andDefer(function (defer) {
                wasCalled = true;
                defer.reject();
            });
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            var id = monitoring.startMeasurement('fakeUseCase1');
            monitoring.endMeasurement('fakeUseCase1', id);

            monitoring.startMeasurement('fakeUseCase1', 'fakeId');

            expect(monitoring._measurementMap['fakeUseCase1'].measurements.total).toBe(2);
            expect(monitoring._measurementMap['fakeUseCase1'].measurements.resolvedRequests).toBe(1);
            expect(monitoring._measurementMap['fakeUseCase1'].measurements.activeRequests).toBe(1);
            map[2000]();

            waitsFor(function () {
                return typeof wasCalled !== 'undefined';
            }, 'sent was called');

            runs(function () {
                expect(monitoring._measurementMap['fakeUseCase1'].measurements.total).toBe(2);
                expect(monitoring._measurementMap['fakeUseCase1'].measurements.resolvedRequests).toBe(1);
                expect(monitoring._measurementMap['fakeUseCase1'].measurements.activeRequests).toBe(1);
                expect(adapter.sendData).toHaveBeenCalledWith([{
                    key: 'fakeKey',
                    value: 2
                }]);
            });

        });

        it('should not send data if there were no resolved requests', function () {
            config = {
                monitoring: {
                    step: 2,
                    metrics: {
                        fakeUseCase1: {
                            key: "fakeKey",
                            operation: "average"
                        }
                    }
                }
            };

            var times = 1;

            Date.now.andCallFake(function () {
                if(times === 1) {
                    times ++;
                    return 1;
                } else {
                    return 3;
                }
            });
            mocks['../configuration'] = config;
            adapter.sendData.andDefer(function (defer) {
                defer.reject();
            });
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();

            var id = monitoring.startMeasurement('fakeUseCase1');

            runs(function () {
                map[2000]();
                expect(monitoring._measurementMap['fakeUseCase1'].measurements.total).toBe(0);
                expect(monitoring._measurementMap['fakeUseCase1'].measurements.resolvedRequests).toBe(0);
                expect(monitoring._measurementMap['fakeUseCase1'].measurements.activeRequests).toBe(1);
                expect(adapter.sendData).not.toHaveBeenCalled();
            });

        });

        it('should reset the registered events', function () {

            var times = 1;
            Date.now.andCallFake(function () {
                if(times === 1) {
                    times ++;
                    return 1;
                } else {
                    times ++;
                    return times;
                }
            });
            var wasCalled;
            adapter.sendData.andDefer(function (defer) {
                wasCalled = true;
                defer.resolve();
            });

            var monitoring = Monitoring.get();
            monitoring.registerEvent('fakeUseCase');
            map[2000]();

            waitsFor(function () {
                return typeof wasCalled!== 'undefined'
            }, 'send data was called');

            runs(function () {
                expect(monitoring._measurementMap['fakeUseCase'].measurements.activeRequests).toBe(0);
                expect(monitoring._measurementMap['fakeUseCase'].measurements.registered).toBe(true);
                expect(adapter.sendData).toHaveBeenCalledWith([{
                    key: 'fakeKey',
                    value: 1
                }]);
            })
        });

        it('should not reset the activeRequests for count measurements', function () {

            var monitoring = Monitoring.get();
            monitoring.startMeasurement('fakeUseCase', 'fakeId');
            monitoring.startMeasurement('fakeUseCase', 'fakeId');


            runs(function () {
                map[2000]();
                expect(monitoring._measurementMap['fakeUseCase'].measurements.activeRequests).toBe(2);
                expect(adapter.sendData).toHaveBeenCalledWith([{
                    key: 'fakeKey',
                    value: 2
                }]);
            })
        });

        it('should not send data if nothing to send', function () {
            var wasCalled,
                times = 1;
            Date.now.andCallFake(function () {
               if(times === 1) {
                   times ++;
                   return 1;
               } else if(times === 2){
                   times ++;
                   return 2;
               } else if(times === 3) {
                    times ++;
                    return 2002;
               }
            });
            adapter.sendData.andDefer(function (defer) {
                wasCalled = true;
                defer.resolve();
            });

            var monitoring = Monitoring.get();
            monitoring.startMeasurement('fakeUseCase', 'fakeId');
            map[2000]();
            expect(adapter.sendData).toHaveBeenCalledWith([{
                key: 'fakeKey',
                value: 1
            }]);

            waitsFor(function () {
                return typeof wasCalled !== 'undefined';
            }, 'send again');

            runs(function () {
                map[2000]();
                expect(adapter.sendData.calls.length).toBe(1);
            });


        });

        it('should measure even though the send was unsuccessfull', function () {
            var wasCalled;
            adapter.sendData.andDefer(function (defer) {
                wasCalled = true;
                defer.reject();
            });

            var monitoring = Monitoring.get();
            monitoring.startMeasurement('fakeUseCase', 'fakeId');
            map[2000]();
            expect(adapter.sendData).toHaveBeenCalledWith([{
                key: 'fakeKey',
                value: 1
            }]);

            waitsFor(function () {
                return typeof wasCalled !== 'undefined';
            }, 'retry');

            runs(function () {
                monitoring.startMeasurement('fakeUseCase', 'fakeId');
                map[2000]();

                expect(adapter.sendData).toHaveBeenCalledWith([{
                    key: 'fakeKey',
                    value: 2
                }]);
            });

        });

        it('should compose the sending object with the secondary key', function () {
            config = {
                monitoring: {
                    step: 2,
                    metrics: {
                        fakeUseCase1: {
                            key: "fakeKey",
                            operation: "average",
                            secondaryKey: "secondaryFakeKey"
                        }
                    }
                }
            };

            mocks['../configuration'] = config;
            adapter.sendData.andDefer(function (defer) {
                defer.reject();
            });
            Monitoring = loadModuleExports('/lib/monitoring/monitoring.js', mocks);

            var monitoring = Monitoring.get();
            monitoring.startMeasurement('fakeUseCase1', 'fakeId');
            monitoring.endMeasurement('fakeUseCase1', 'fakeId');

            runs(function () {
                map[2000]();
                expect(adapter.sendData).toHaveBeenCalledWith(
                    [
                    {
                        key: "secondaryFakeKey",
                        value: 1

                    },
                    {
                        key:'fakeKey',
                        value: 0
                    }
                    ]
                )
            })
        });

    });
});
