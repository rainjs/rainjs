define([
    'core-components/promised-io/promise'
], function(Promise) {

    /**
     * Get a new instance for ClientRenderer.
     *
     * @class Handles the asynchronous rendering of components.
     * @name ClientRenderer
     * @constructor
     */
    function ClientRenderer() {
        this.uniqueWrapperId = 0;
        this.requireConfig = {
            "debug": true,
            "baseUrl": "/components",
            "paths": {
                "core-components": "core-components/htdocs/js"
            }
        };
    }

    /**
     * Loads a component from the server.
     *
     * @param {Object} options
     */
    ClientRenderer.prototype.loadComponent = function(options) {
        if (!options.selector) {
            throw "Selector is required";
        }

        options.wrapperId = this.createTemporarWrapper(options.selector);

        $.ajax({
            url: '/components/client_renderer/controller/serverside.js',
            dataType: 'json',
            data: options,
            xhrFields: {
                onprogress : onProgress
            }
        });
    };

    function onProgress(progress){
        eval(progress.currentTarget.responseText);
    }

    ClientRenderer.prototype.createTemporarWrapper = function(selector) {
        var uWrapperId = "wrapperid-" + this.uniqueWrapperId++;
        $(selector).after('<div data-instanceid="' + uWrapperId + '"></div>');

        return uWrapperId;
    };

    /**
     * Renders a component received via JSONP.
     *
     * @param {Object} component the component to be rendered
     */
    ClientRenderer.prototype.renderComponent = function(component) {
        console.log("renderComponent");
        registerComponent(this, component).then(function(cmp) {
            insertComponent(this, component);
        });
    };

    /**
     * Inserts the component in the page
     *
     * @param {ClientRenderer} self the class instance
     * @param {Object} component the component to be rendered
     */
    function insertComponent(self, component) {
        $('[data-instanceid=' + component.wrapperId + ']').replaceWith(component.html);
        var head = $('head');
        var cssRessources = "";
        for ( var i = 0, l = component.css.length; i < l; i++) {
            cssRessources += component.css[i] + '&';
        }
        head.append('<link rel="stylesheet" href="/resources?files=' + cssRessources + '" type="text/css" />');
        require([
             "core-components/raintime/raintime"
         ], function(Raintime) {
            var Controller = Raintime.ComponentController;
            Controller.postRender(component.domId);
         });
    }

    /**
     * Register a component with the framework
     *
     * @param {ClientRenderer} self the class instance
     * @param {Object} component the component to be registered
     */
    function registerComponent(self, component) {
        var defer = new Promise.defer();

        var componentId = component.moduleId.split('-')[0];
        this.requireConfig.paths[componentId] = componentId + '/htdocs/js';

        require(this.requireConfig);
        require([
            "core-components/raintime/raintime"
        ], function(Raintime) {
            var Registry = Raintime.ComponentRegistry;
            var Controller = Raintime.ComponentController;
            var cmp = Registry.register({
                "domId": component.domId,
                "instanceId": component.instanceId,
                "moduleId": component.moduleId,
                "staticId": component.staticId,
                "clientcontroller": component.controller
            });

            Controller.preRender(component.domId);
            defer.resolve(cmp);
        });

        return defer.promise;
    }

    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
