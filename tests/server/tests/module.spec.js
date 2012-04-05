"use strict";

var cwd = process.cwd(),
    path = require('path'),
    module = require(cwd + '/lib/module');

describe('Module tests', function () {

    it('must contain the given context in the first level', function () {
        var lib1 = requireWithContext(cwd + "/tests/server/fixtures/modules/lib1", {
           custom: "context"
        });
        expect(lib1.global.custom).toEqual("context");
    });

    it('must contain the given context in deeper level', function () {
        var lib1 = requireWithContext(cwd + "/tests/server/fixtures/modules/lib1", {
            custom: "context"
         });

         expect(lib1.global.custom).toEqual("context");
         expect(lib1.lib2.global.custom).toEqual("context");
    });
});
