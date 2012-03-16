var component = {
    "css": ['/example/2.0.1/css/index.css'],
    "children": [],
    "html": "<div>Lorem ipsum et sit dolor</div>",
    "controller": "/example/2.0.1/js/index.js",
    "instanceId":"749e5b7af8b12c1e780b17831fe7b981e56c94d7",
    "staticId":"",
    "id":"example",
    "version":"2.0.1",
    "error":null
}


describe('Client Renderer', function () {
    beforeEach(function () {
        $('body').append($('<div id="' + component.instanceId + '"></div>'));
    });

    it('must add the component to the DOM', ['raintime/client_rendering'], function (ClientRenderer) {
        var element = $('#' + component.instanceId);
        ClientRenderer.renderComponent(component);

        expect(element.html()).toBe(component.html);
        expect(element.attr('class')).toBe('app-container example_2_0_1');
        expect(element.css('display')).toBe('none');
    });

    it('must register the component to the component registry', [
        'raintime', 'raintime/client_rendering'
        ], function (Raintime, ClientRenderer) {
        spyOn(Raintime.componentRegistry, 'register');
        ClientRenderer.renderComponent(component);

        expect(Raintime.componentRegistry.register).toHaveBeenCalledWith(component);
    });

    afterEach(function () {
        $('#' + component.instanceId).remove();
    });
});

