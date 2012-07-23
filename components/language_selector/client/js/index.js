define(['raintime/messaging/sockets'], function (Sockets) {

    /**
     * The language selector component provides a way to change the user language.
     * After the drop down list changed the page is refreshed.
     *
     * @name LanguageSelector
     * @class
     * @constructor
     */
    function LanguageSelector() {}

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    LanguageSelector.prototype.start = function () {
        var select = this.context.getRoot().find('.languages'),
            socket = Sockets.getSocket('/core');

        select.change(function (event) {
            if (socket.socket.connected) {
                var language = select.val();
                socket.emit('change_language', language, function (error) {
                    window.location.href = window.location.href;
                });
            }
        });
    };

    return LanguageSelector;
});
