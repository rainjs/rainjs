"use strict";

var cwd = process.cwd();
var path = require('path');
var poUtils = require(path.join(cwd, 'lib', 'po_utils'));

var poContent = ['msgid "Send email"', 'msgstr "Send email"'].join('\n');
var poObject = { 'Send email': [ null, 'Send email' ], '': {} };

describe('Po utils', function () {
    it('must correctly parse the po file', function() {
        expect(poUtils.parsePo(poContent)).toEqual(poObject);
    });
});
