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
        if(typeof component == 'string'){
            this.placeholderComponent.instanceId = component;
            component = this.placeholderComponent;
        }
        insertComponent(this, component);
    };

    function insertComponent(self, component) {
        var domElement = $('#' + component.instanceId);
        domElement.attr('id', component.instanceId);
        domElement.attr('class', 'app-container '+component.componentId+'_'+component.version.replace(/[\.]/g, '_'));
        var head = $('head');
        for ( var i = 0, l = component.css.length; i < l; i++) {
            head.append('<link rel="stylesheet" href="' + component.css[i] + '" type="text/css" />');
        }
        domElement.html(component.html);
        for(var len = component.children.length, i = 0; i < len; i++){
            self.renderComponent(component.children[i]);
        }
    }

    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
