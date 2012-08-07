define([], function () {

    /**
     * This is the client-side controller for the 'index' page.
     *
     * @name ContainerExample
     * @class
     * @constructor
     */
    function ContainerExample() {}

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    ContainerExample.prototype.start = function () {
        var self = this,
            root = this.context.getRoot(),
            select = root.find('.image-list'),
            textbox = root.find('.title-text'),
            button = root.find('.change-button');

        var updateTextbox = function () {
            var sid = select.val();

            self.context.find(sid, function(img) {
                img.on('start', function () {
                    textbox.val(img.title());
                });
            });
        };

        updateTextbox();

        select.on('change', function () {
            updateTextbox();
        });

        button.on('click', function () {
            var sid = select.val();

            self.context.find(sid, function(img) {
                img.on('start', function () {
                    img.title(textbox.val());
                });
            });
        });
    };

    return ContainerExample;
});
