"use strict";

var cwd = process.cwd();
var globals = require(cwd + '/lib/globals.js');
var loadFile = require(cwd + '/tests/server/rain_mocker');

describe('Handlebars url helper', function () {
    var urlHelper, Handlebars, rainContext;

    beforeEach(function () {
        rainContext = {
            component: {
                id: 'example',
                version: '1.0'
            }
        };

        urlHelper = loadFile(cwd + '/lib/handlebars/url.js', {
            '../renderer': {
                rain: rainContext
            }
        });
        Handlebars = require('handlebars');

        Handlebars.registerHelper(urlHelper.name, urlHelper.helper);
    });

    describe('register plugin to handlebars', function () {

        it('must register the url helper to handlebars', function () {
            expect(urlHelper.name).toEqual('url');
            expect(typeof urlHelper.helper).toEqual('function');
        });
    });

    describe('test unlocalized urls', function () {

        it('must return empty string when url is not a string', function () {
            var result = Handlebars.compile('{{url src }}')({src: {}});
            expect(result).toBe('');
        });

        it('must return the same external url', function () {
            var src = 'http://www.rainjs.com/';
            var result = Handlebars.compile('{{url "' + src + '" }}')();
            expect(result).toBe(src);
        });

        it('must leave unchanged absolute urls', function () {
            var src = '/example/1.0/resources/images/loading.gif';
            var result = Handlebars.compile('{{url "' + src + '" }}')();
            expect(result).toBe(src);
        });

        it('must add the component information to relative urls', function () {
            var src = 'images/loading.gif';
            var result = Handlebars.compile('{{url "' + src + '" }}')();
            expect(result).toBe('/example/1.0/resources/' + src);
        });
    });

    describe('test localized urls', function () {

        it('must return the same external url', function () {
            var src = 'http://www.rainjs.com/p?a=b';
            var result = Handlebars.compile('{{url "' + src + '" true}}')();
            expect(result).toBe(src);
        });

        it('must add the loc query parameter to absolute urls', function () {
            var src = '/example/1.0/resources/images/loading.gif';
            var result = Handlebars.compile('{{url "' + src + '" true}}')();
            expect(result).toBe(src + '?loc=1');
        });

        it('must add the loc query parameter and keep the others to absolute urls', function () {
            var src = '/example/1.0/resources/images/loading.gif?a=b';
            var result = Handlebars.compile('{{url "' + src + '" true}}')();
            expect(result).toBe(src + '&amp;loc=1');
        });

        it('must add the loc query parameter to relative urls', function () {
            var src = 'images/loading.gif';
            var result = Handlebars.compile('{{url "' + src + '" true}}')();
            expect(result).toBe('/example/1.0/resources/' + src + '?loc=1');
        });

        it('must add the loc query parameter and keep the others to relative urls', function () {
            var src = 'images/loading.gif?a=b';
            var result = Handlebars.compile('{{url "' + src + '" true}}')();
            expect(result).toBe('/example/1.0/resources/' + src + '&amp;loc=1');
        });

        it('must not change the already existing loc query parameter', function () {
            var src = 'images/loading.gif?loc';
            var result = Handlebars.compile('{{url "' + src + '" true}}')();
            expect(result).toBe('/example/1.0/resources/' + src);
        });
    });
});
