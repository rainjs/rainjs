define([], function () {

    /**
     * Server-side text localization example controller.
     *
     * @name TextLocalization
     * @class
     * @constructor
     */
    function TextLocalization() {}

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    TextLocalization.prototype.start = function () {
        var emailResponse = this.context.getRoot().find('.email-response');
        this.context.find('sendEmail', function () {
            this.on('start', function () {
                $(this.context.getRoot().children()[0]).click(function () {
                    $.get("/example/controller/text_localization", function (data) {
                        emailResponse.html(data);
                    });
                });
            });
        });
    };

    return TextLocalization;
});
