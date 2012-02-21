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
            warn: function () {},
            error: function () {}
        };
    });
});

exports.components = [
    {id: 'button', version: '1.0', url: '/components/button',
       views: [
       {
           "viewid": "index",
           "view": "/htdocs/index.html",
           "controller": "/htdocs/controller/index.js"
        },
        {
            "viewid": "main",
            "view": "/htdocs/main.html",
            "controller": "/htdocs/controller/index.js"
        }
    ]},
    {id: 'button', version: '2.4', url: '/components/button',
        views: [
        {
            "viewid": "index",
            "view": "/htdocs/index.html",
            "controller": "/htdocs/controller/index.js"
        },
        {
            "viewid": "main",
            "view": "/htdocs/main.html",
            "controller": "/htdocs/controller/index.js"
        }
    ]},
    {id: 'textbox', version: '1.7.0', url: '/components/textbox'},
    {id: 'textbox', version: '2.4', url: '/components/textbox'},
    {id: 'textbox', version: '2.7', url: '/components/textbox'},
    {id: 'dropdown', version: '3.3', url: '/components/dropdown'},
    {id: 'dropdown', version: '2.3', url: '/components/dropdown'},
    {id: 'button', version: '0.4', url: '/components/button',
        views: [
        {
            "viewid": "index",
            "view": "/htdocs/index.html",
            "controller": "/htdocs/controller/index.js"
        },
        {
            "viewid": "main",
            "view": "/htdocs/main.html",
            "controller": "/htdocs/controller/index.js"
        }
    ]},
    {id: 'textbox', version: '1.0.3', url: '/components/textbox', 
        dynamicConditions: {
            _component: function (context) {
                return context.user.country === 'US';
            }
        },
        views: [
            {
                "viewid": "index",
                "view": "/htdocs/index.html",
                "controller": "/htdocs/controller/index.js"
            }           
    ]},
    {id: 'button', version: '5.2.1', url: '/components/button',
        views: [
        {
            "viewid": "index",
            "view": "/htdocs/index.html",
            "controller": "/htdocs/controller/index.js"
        },
        {
            "viewid": "main",
            "view": "/htdocs/main.html",
            "controller": "/htdocs/controller/index.js"
        }
    ]},
    {id: 'dropdown', version: '1.3', url: '/components/dropdown', 
        dynamicConditions: {
            main: function (context) {
                return context.user.country === 'US';
            }
        },
        views: [
            {
                "viewid": "index",
                "view": "/htdocs/index.html",
                "controller": "/htdocs/controller/index.js",
                "permissions": ["edit_contract"]
            },
            {
                "viewid": "main",
                "view": "/htdocs/main.html",
                "controller": "/htdocs/controller/index.js"
            }            
    ]},
    {id: 'textbox', version: '3.6.1', url: '/components/textbox', permisssions: ["edit_contract"],
        views: [
            {
                "viewid": "index",
                "view": "/htdocs/index.html",
                "controller": "/htdocs/controller/index.js",
                "permissions": ["edit_contract"]
            }           
    ]},
    {id: 'button', version: '3.5.8', url: '/components/button',
        views: [
        {
            "viewid": "index",
            "view": "/htdocs/index.html",
            "controller": "/htdocs/controller/index.js"
        },
        {
            "viewid": "main",
            "view": "/htdocs/main.html",
            "controller": "/htdocs/controller/index.js"
        }
    ]},
    {id: 'dropdown', version: '2.3.7', url: '/components/dropdown'},
    {id: 'textbox', version: '1.0', url: '/components/textbox'},
    {id: 'dropdown', version: '1.35.89', url: '/components/dropdown'},
    {id: 'exception', version: '1.0', url: '/components/exception',
        views: [
        {
            "viewid": "default",
            "view": "/htdocs/default.html",
            "controller": "/htdocs/controller/index.js"
        },
        {
            "viewid": "401",
            "view": "/htdocs/401.html",
            "controller": "/htdocs/controller/index.js"
        },
        {
            "viewid": "404",
            "view": "/htdocs/404.html",
            "controller": "/htdocs/controller/index.js"
        },
        {
            "viewid": "500",
            "view": "/htdocs/500.html",
            "controller": "/htdocs/controller/index.js"
        }
    ]},
];

exports.versions = {
    button: [
        {major: 0, minor: 4, micro: 0, versionStr: '0.4'},
        {major: 1, minor: 0, micro: 0, versionStr: '1.0'},
        {major: 2, minor: 4, micro: 0, versionStr: '2.4'},
        {major: 3, minor: 5, micro: 8, versionStr: '3.5.8'},
        {major: 5, minor: 2, micro: 1, versionStr: '5.2.1'}
    ],
    textbox: [
        {major: 1, minor: 0, micro: 0, versionStr: '1.0'},
        {major: 1, minor: 0, micro: 3, versionStr: '1.0.3'},
        {major: 1, minor: 7, micro: 0, versionStr: '1.7.0'},
        {major: 2, minor: 4, micro: 0, versionStr: '2.4'},
        {major: 2, minor: 7, micro: 0, versionStr: '2.7'},
        {major: 3, minor: 6, micro: 1, versionStr: '3.6.1'}
    ],
    dropdown: [
        {major: 1, minor: 3, micro: 0, versionStr: '1.3'},
        {major: 1, minor: 35, micro: 89, versionStr: '1.35.89'},
        {major: 2, minor: 3, micro: 0, versionStr: '2.3'},
        {major: 2, minor: 3, micro: 7, versionStr: '2.3.7'},
        {major: 3, minor: 3, micro: 0, versionStr: '3.3'}
    ],
    exception: [
        {major: 1, minor: 0, micro: 0, versionStr: '1.0'}
    ]
};
