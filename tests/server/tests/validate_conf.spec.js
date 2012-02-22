var mod_validateConf = require(process.cwd() + '/lib/validate_conf');

describe('Validate server configuration', function () {

    describe('validate initial data', function () {
        it('must throw an error if the configuration is not an object', function () {
            expect(function () {
                mod_validateConf.validate();
            }).toThrow('precondition failed: configuration must be an object!');
        });

        it('must throw an error if the default language is not specified', function () {
            expect(function () {
                mod_validateConf.validate({});
            }).toThrow('precondition failed: you must define a default locale e.g. "en_US" !');
        });
    });

    describe('set default values for missing keys', function () {
        it('must add the loadingComponent key', function () {
            var configServer = {
                'default_language': 'en_US'
            }
            mod_validateConf.validate(configServer);

            var loadingComponent = configServer.loadingComponent;
            expect(loadingComponent).toBeDefined();
            expect(loadingComponent.selector).toEqual('placeholder');
            expect(loadingComponent.module).toEqual('placeholder;1.0');
            expect(loadingComponent.view).toEqual('/htdocs/index.html');
        });

        it('must not change the already added loadingComponent key', function () {
            var configServer = {
                'default_language': 'en_US',
                'loadingComponent': {
                    'namespace': 'my_namespace',
                    'selector': 'loading',
                    'module': 'loading;1.0',
                    'view': '/htdocs/loading.html'
                }
            }
            mod_validateConf.validate(configServer);

            var loadingComponent = configServer.loadingComponent;
            expect(loadingComponent).toBeDefined();
            expect(loadingComponent.namespace).toEqual('my_namespace');
            expect(loadingComponent.selector).toEqual('loading');
            expect(loadingComponent.module).toEqual('loading;1.0');
            expect(loadingComponent.view).toEqual('/htdocs/loading.html');
        });

        it('must add the errorComponent key', function () {
            var configServer = {
                'default_language': 'en_US'
            }
            mod_validateConf.validate(configServer);

            console.log(configServer);
            var errorComponent = configServer.errorComponent;
            expect(errorComponent).toBeDefined();
            expect(errorComponent.name).toEqual('error');
            expect(errorComponent.version).toEqual('1.0');
        });

        it('must not change the already added errorComponent key', function () {
            var configServer = {
                'default_language': 'en_US',
                'errorComponent': {
                    'name': 'custom_error',
                    'version': '3.0'
                }
            }
            mod_validateConf.validate(configServer);

            var errorComponent = configServer.errorComponent;
            expect(errorComponent).toBeDefined();
            expect(errorComponent.name).toEqual('custom_error');
            expect(errorComponent.version).toEqual('3.0');
        });
    });
});

