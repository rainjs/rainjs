define([], function () {
    /**
     * Event emitter example controller.
     *
     * @name EventEmitter
     * @class a controller instance
     * @constructor
     */
    function TextLocalization() {}

    /**
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     *
     * @function
     */
    TextLocalization.prototype.init = $.noop;

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    TextLocalization.prototype.start = function () {
        var emailResponse = this.context.getRoot().find('.email-response');
        this.context.find('sendEmail', function(){
            this.on('start', function() {
                $(this.context.getRoot().children()[0]).click(function () {
                    $.get("/example/controller/text_localization", function(data) {
                        emailResponse.html(data);
                    });
                });
            });
        });
    };

    return TextLocalization;
});
