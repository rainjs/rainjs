define(['logger'], function (logger) {
    function Logging() {}

    Logging.prototype.start = function () {
        var root = this.context.getRoot();

        root.find('#log-submit').on('click', function () {
            var message = root.find('#log-message').val();
            var level = root.find('#log-level').val();

            logger[level](message);
        });
    };

    return Logging;
});
