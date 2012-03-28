define(['raintime'], function (Raintime) {
    "use strict";

    function Controller() {}

    Controller.prototype.init = $.noop;
    Controller.prototype.start = function () {
        var close = $('.core-dialog .close');

        close.on('click', function () {
            $('.core-dialog').remove();
            $('.core-modal').remove();
        });

        Raintime.componentRegistry.deregister(this.context.instanceId);
    };

    return Controller;
});
