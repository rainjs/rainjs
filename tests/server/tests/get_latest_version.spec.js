var mock = require('./server_mock.js');

describe('get latest version', function() {
    var componentContainer;

    var components = mock.components;
    var versions = mock.versions;

    beforeEach(function() {
        var ComponentContainer = require(process.cwd() + '/lib/componentcontainer.js').ComponentContainer;

        componentContainer = {
            componentMap: {},
            versions: {},
            registerComponent: ComponentContainer.prototype.registerComponent,
            getLatestVersion: ComponentContainer.prototype.getLatestVersion,
            scanComponentFolder: function() {
                for ( var i = 0, l = components.length; i < l; i++) {
                    this.registerComponent(components[i]);
                }
            }
        };
    });

    it('should correctly sort the versions when registering components', function() {
        componentContainer.scanComponentFolder();
        expect(componentContainer.versions).toEqual(versions);
    });

    it('should get the correct version', function() {
        componentContainer.scanComponentFolder();
        expect(componentContainer.getLatestVersion('textbox', '1')).toEqual('1.7.0');
        expect(componentContainer.getLatestVersion('textbox', '1.0.3')).toEqual('1.0.3');
        expect(componentContainer.getLatestVersion('button')).toEqual('5.2.1');
        expect(componentContainer.getLatestVersion('dropdown', '2.3')).toEqual('2.3.7');
        expect(componentContainer.getLatestVersion('dropdown', '1')).toEqual('1.35.89');
        expect(componentContainer.getLatestVersion('button', '2')).toEqual('2.4');
    });

    it('should not be found', function() {
        componentContainer.scanComponentFolder();
        expect(componentContainer.getLatestVersion('textbox', '6')).toBeUndefined();
        expect(componentContainer.getLatestVersion('textbox1')).toBeUndefined();
        expect(componentContainer.getLatestVersion('button', '4')).toBeUndefined();
    });
});
