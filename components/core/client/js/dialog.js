define(['raintime'], function (Raintime) {
    "use strict";

    function Dialog() {}

    Dialog.prototype.init = $.noop;
    Dialog.prototype.start = function () {
        var close = $('.core-dialog .close');

        close.on('click', function () {
            $('.core-dialog').remove();
            $('.core-modal').remove();

            Raintime.componentRegistry.deregister(this.context.instanceId);
        });
    };

    Dialog.prototype.destroy = function() {
        var root = this.context.getRoot();

        root.empty();
    };

    return Dialog;
});
