define([], function() {
    /**
     * Example controller class.
     *
     * @name Controller
     * @class a controller instance
     * @constructor
     */
    function Controller() {
        // constructor logic here
    }

    /**
     * Initialization lifecycle step that happens immediately after the
     * controller is loaded.
     *
     * @function
     */
    Controller.prototype.init = $.noop;

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * @function
     */
    Controller.prototype.start = function() {
        var runtime = this.clientRuntime;

        this.userTextbox = runtime.ComponentRegistry.getComponent('requestComponent');
        this.userTextbox.bindState(runtime.ComponentStates.START, function() {
            this.controller.viewContext.getRoot().find(".button").html("Request Component").click(function() {
                clientRenderer.loadComponent({
                    selector: '#catwoman',
                    component: {
                        name: 'button',
                        version: '1.0',
                        view: 'index'
                    }
                });
            });
        });
    };

    return Controller;
});
