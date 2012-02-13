require('./server_mock.js');

describe('get latest version', function () {
    var componentContainer;
    
    var components = [
        {id: 'button', version: '1.0', url: '/components/button'},
        {id: 'button', version: '2.4', url: '/components/button'},
        {id: 'textbox', version: '1.7.0', url: '/components/textbox'},
        {id: 'textbox', version: '2.4', url: '/components/textbox'},
        {id: 'textbox', version: '2.7', url: '/components/textbox'},
        {id: 'dropdown', version: '3.3', url: '/components/dropdown'},
        {id: 'dropdown', version: '2.3', url: '/components/dropdown'},
        {id: 'button', version: '0.4', url: '/components/button'},
        {id: 'textbox', version: '1.0.3', url: '/components/textbox'},
        {id: 'dropdown', version: '1.3', url: '/components/dropdown'},
        {id: 'textbox', version: '3.6.1', url: '/components/textbox'},
        {id: 'button', version: '3.5.8', url: '/components/button'},
        {id: 'dropdown', version: '2.3.7', url: '/components/dropdown'},
        {id: 'textbox', version: '1.0', url: '/components/textbox'},
        {id: 'dropdown', version: '1.35.89', url: '/components/dropdown'}        
    ];
    
    var versions = { 
        button: [
            { major: 0, minor: 4, micro: 0, versionStr: '0.4' },
            { major: 1, minor: 0, micro: 0, versionStr: '1.0' },
            { major: 2, minor: 4, micro: 0, versionStr: '2.4' },
            { major: 3, minor: 5, micro: 8, versionStr: '3.5.8' } 
        ],
        textbox: [
            { major: 1, minor: 0, micro: 0, versionStr: '1.0' },
            { major: 1, minor: 0, micro: 3, versionStr: '1.0.3' },
            { major: 1, minor: 7, micro: 0, versionStr: '1.7.0' },
            { major: 2, minor: 4, micro: 0, versionStr: '2.4' },
            { major: 2, minor: 7, micro: 0, versionStr: '2.7' },
            { major: 3, minor: 6, micro: 1, versionStr: '3.6.1' } 
        ],
        dropdown: [
            { major: 1, minor: 3, micro: 0, versionStr: '1.3' },
            { major: 1, minor: 35, micro: 89, versionStr: '1.35.89' },
            { major: 2, minor: 3, micro: 0, versionStr: '2.3' },
            { major: 2, minor: 3, micro: 7, versionStr: '2.3.7' },
            { major: 3, minor: 3, micro: 0, versionStr: '3.3' } 
        ]
    };

    
    beforeEach(function () {        
        var mod_logger = require('../../../lib/logger.js');
        
        spyOn(mod_logger, 'getLogger');
        mod_logger.getLogger.andCallFake(function () {
            return {
                debug: function () {},
                warn: function () {}
            };
        });
        
        var ComponentContainer = require('../../../lib/componentcontainer.js').ComponentContainer;
        
        componentContainer = {
            componentMap: {},
            versions: {},
            registerComponent: ComponentContainer.prototype.registerComponent,
            getLatestVersion: ComponentContainer.prototype.getLatestVersion,
            scanComponentFolder: function () {
                for (var i = 0, l = components.length; i < l; i++) {
                    this.registerComponent(components[i]);
                }
            }
        };
    });
    
    it('should correctly sort the versions when registering components', function () {
        componentContainer.scanComponentFolder();
        expect(componentContainer.versions).toEqual(versions);        
    });
    
    it('should get the correct version', function () {
        componentContainer.scanComponentFolder();
        expect(componentContainer.getLatestVersion('textbox', '1')).toEqual('1.7.0');   
        expect(componentContainer.getLatestVersion('textbox', '1.0.3')).toEqual('1.0.3');
        expect(componentContainer.getLatestVersion('button')).toEqual('3.5.8');
        expect(componentContainer.getLatestVersion('dropdown', '2.3')).toEqual('2.3.7');
        expect(componentContainer.getLatestVersion('dropdown', '1')).toEqual('1.35.89');
    });
    
    it('should not be found', function () {
        componentContainer.scanComponentFolder();
        expect(componentContainer.getLatestVersion('textbox', '6')).toEqual(false);
        expect(componentContainer.getLatestVersion('textbox1')).toEqual(false);
    });
});