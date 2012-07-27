var path = require('path');

describe('container handlebars helper', function () {
    var Spy, Mocks, Container;

    beforeEach(function () {
        Spy = { Component: jasmine.createSpyObj('Spy.Component', ['helper']) };
        Mocks = { './component': Spy.Component };

        Container = loadModuleExports(path.join('lib', 'handlebars', 'container.js'), Mocks);
    });

    it('should export the correct name', function () {
        expect(Container.name).toEqual('container');
    });

    it('should export a helper function that calls the component helper', function () {
        var options = {};

        expect(Container.helper).toEqual(jasmine.any(Function));

        Container.helper(options);

        expect(Spy.Component.helper).toHaveBeenCalledWith(options, 'container');
    });
});