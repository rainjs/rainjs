define(['core/js/promised-io/promise'], function (Promise) {

    function ClientRenderer() {
        this.placeholderComponent = null;
        this.placeholderTimeout = 500;
    }

    ClientRenderer.prototype.setPlaceholder = function (component) {
        this.placeholderComponent = component;
    };

    ClientRenderer.prototype.setPlaceholderTimeout = function (milliseconds) {
        this.placeholderTimeout = milliseconds;
    };

    ClientRenderer.prototype.renderComponent = function(component) {
        insertComponent(component);
    };

    function insertComponent(component) {
        $('#' + component.instanceId).replaceWith(component.html);
        var head = $('head');
        for ( var i = 0, l = component.css.length; i < l; i++) {
            head.append('<link rel="stylesheet" href="' + component.css[i] + '" type="text/css" />');
        }
    }

    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
