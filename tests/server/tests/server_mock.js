var mod_logger = require(process.cwd() + '/lib/logger.js');

global.Server = {
    conf : {
        server : {
            port : 1337,
            serverRoot    : '',
            componentPath : ''
        }
    },
    UUID : "SERVER-UUID",
    root : ''
};

beforeEach(function () {
    spyOn(mod_logger, 'getLogger');
    mod_logger.getLogger.andCallFake(function () {
        return {
            debug: function () {},
            warn: function () {}
        };
    });
});

exports.components = [
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

exports.versions = { 
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