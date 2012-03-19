define(['/example/js/accordian.min.js'], function() {
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
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     *
     * @function
     */
    Controller.prototype.init = $.noop;

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * @function
     */
    Controller.prototype.start = function(){
        var self = this;
        this.context.getRoot().find('.navi').accordion({
            collapsible: true,
            active: false,
            autoHeight: false,
            change: function(event, ui){
                ui.oldContent.empty();
                if(ui.options.active !== false){
                    self.context.insert({
                        id: "example",
                        view: ui.newContent.data("example-view"),
                        placeholder: true
                    }, ui.newContent);
                }
            }
        }).show();
    };

    return Controller;
});
