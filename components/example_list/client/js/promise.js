define(['raintime/lib/promise', 'logger'], function (Promise, logger) {

    /**
     * This class is used to show how to use the promise based functionality of the component's
     * lifecycle events.
     *
     * @name PromiseController
     * @class
     * @constructor
     */
    function PromiseController() {
        this.initDeferred = Promise.defer();
        this.startDeferred = Promise.defer();
    }

    /**
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     *
     * @returns {Promise} the promise that will resolved manually by the user
     */
    PromiseController.prototype.init = function () {
        var self = this;

        logger.info('Promise: "init" function was called.');

        setTimeout(function () {
            logger.info('Promise: "init" promise was resolved.');
            self.initDeferred.resolve();
        }, 500);

        return this.initDeferred.promise;
    };

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * @returns {Promise} the promise that will resolved manually by the user
     */
    PromiseController.prototype.start = function () {
        var self = this;

        logger.info('Promise: "start" function was called.');

        this._getChild('start').then(function (startButton) {
            var elem = $(startButton.context.getRoot().children()[0]);
            elem.button('option', 'label', 'Waiting for start promise...');

            setTimeout(function () {
                logger.info('Promise: "start" promise was resolved.');
                self.startDeferred.resolve();
                elem.button('option', 'label', 'Start promise resolved');
            }, 500);

        });

        return this.startDeferred.promise;
    };

    return PromiseController;
});
