define(function () {
    function Controller() {}

    Controller.prototype.init = $.noop;
    Controller.prototype.start = function () {
        var dialog = $('#core-dialog');
        dialog.css({
            'position': 'absolute',
            'top': (window.innerHeight * 20 / 100) + 'px',
            'left': ((window.innerWidth - 600) / 2) + 'px',
            'width': '600px',
            'height': '300px',
            'overflow-y': 'scroll',
            'border': '1px solid black'
        });

    };

    return Controller;
});
