'use strict';

describe('testing locale routing', function () {
    var locale, request, response, localeContent;

    function getLocales() {
        return {
            language: { 'msgid': 'translation' },
            defaultLanguage: { 'msgid': 'translation2' }
        };
    }

    beforeEach(function() {
        locale = loadModuleContext('/lib/routes/locale.js');

        request = { component: true };
        response = { end: function (content) { localeContent = content; } };


        spyOn(locale.translation, 'get').andReturn({
            'getLocales': getLocales
        });
    });

    it('must response only a part of of the content', function() {
        var opt = {
            sendBody: true,
            start: 0,
            end: 1
        };
        spyOn(locale.routerUtils, 'setResourceHeaders').andReturn(opt);
        locale.handle(request, response);
        expect(localeContent).toEqual('{');
    });

    it('must response with the whole content', function() {
        var opt = {
            sendBody: true
        };
        spyOn(locale.routerUtils, 'setResourceHeaders').andReturn(opt);
        locale.handle(request, response);
        expect(localeContent).toEqual(JSON.stringify(getLocales()));
    });
});
