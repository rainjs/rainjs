"use strict";

describe('Component Registry', function () {
    var componentMap = {},
    logger,
    compRegistry,
    mocks = {}, config, fs;

    beforeEach(function () {
        componentMap = {
            "hello_world": {
                "config": {
                    "1.0": {
                        "views": {
                            "index1" : {},
                            "index2" : {}
                        }
                    },
                    "2.0" : {
                       "views": {
                            "index1" : {},
                            "index2" : {}
                        }
                    }
                }
            },
            "rain_tree": {
                "config": {
                    "1.0": {
                        "views": {
                            "index1" : {},
                            "index2" : {}
                        }
                    },
                    "1.1" : {
                       "views": {
                            "index1" : {},
                            "index2" : {}
                        }
                    }
                }
            }
        };
        
        config = {
            server: {
                components: ['folder1', 'folder2']
            }
        };

        fs = jasmine.createSpyObj('Spy.fs', ['readdirSync', 'statSync', 'readFileSync']);

        fs.readFileSync.andCallFake(function () {
            return JSON.stringify({
                "id": "chat",
                "version": "1.0",
                "views": {
                    "user": {},
                    "admin": {}
                },
                "intents": [
                    {
                        "category": "rain.chat",
                        "action": "OPEN",
                        "provider": "user"
                    }
                ]
            });
        });

        fs.statSync.andCallFake(function () {
            return {
                isDirectory: function () {
                    return true;
                }
            }
        });

        fs.readdirSync.andCallFake(function () {
            return ['subfold1', 'subfold2'];
        });

        logger = jasmine.createSpyObj('Spy.Logger',
            ['debug', 'info', 'warn', 'error', 'fatal']);

        mocks['rain/lib/logging'] = {
            get: function () {
                return logger;
            }
        };

        mocks['./configuration'] = config;
        mocks['fs'] = fs;

        compRegistry = loadModuleExports('/lib/component_registry.js', mocks);

    });

    describe('testing getComponentIds', function () {

        beforeEach(function () {
            
        });

        it('should return an array', function () {
            var components =  compRegistry.getComponentIds();
            console.log('compmap', componentMap);

            expect(components.constructor.toString()).toBe(Array.toString());
        });

        //TO DO: add mocks for plugins and other component_registry stuff
        // and check the length of the arrat returned to be 2
        it('should return an array with correct length', function () {
            //compRegistry.initialize();
            var components =  compRegistry.getComponentIds();
            expect(components.length).toBe(0);
        });

        it('should return an empty array for and empty componentMap', function () {
            componentMap = {};
            var components =  compRegistry.getComponentIds();

            expect(components.length).toBe(0);
        });


    });

    describe('testing getComponentVersions', function () {

        beforeEach(function () {

        });

    });

});
