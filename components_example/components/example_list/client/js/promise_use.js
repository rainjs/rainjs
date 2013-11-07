define(['logger'], function (logger) {
    /**
     * This class is used to show how to use the promise based functionality of the component's
     * lifecycle events.
     *
     * @name PromiseUse
     * @class
     * @constructor
     */
    function PromiseUse() {}

    /**
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     *
     * @returns {Promise} the promise that will resolved manually by the user
     */
    PromiseUse.prototype.init = function () {
        logger.info('PromiseUse: "init" function was called.');
    };

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * @returns {Promise} the promise that will resolved manually by the user
     */
    PromiseUse.prototype.start = function () {
        logger.info('PromiseUse: "start" function was called.');

        this._getChild('promise').then(function (promise) {
            logger.info('PromiseUse: _getChild promise was resolved.');

            promise.on('start', function () {
                logger.info('PromiseUse: received start event from the "promise" child.');
            });
        });

        this.context.find('promise', function (promise) {
            logger.info('PromiseUse: the controller for the "promise" child was found.');
        });
    };

    return PromiseUse;
});
