"use strict";

var crypto = require('crypto'),
    util = require('util'),
    logger = require('../logging').get(),
    config = require('rain/lib/configuration'),
    adapter = require('./adapter').get(),
    Promise = require('promised-io/promise');

/**
 * Monitoring module.
 *
 * @class
 * @constructor
 * @name Monitoring
 */
function Monitoring () {
    var self = this;

    if(!config.monitoring || adapter === null || !config.monitoring.metrics) {
        logger.debug('Monitoring module inactive');
        this._enabled = true;
        return this;
    }

    this._defaultSend = config.monitoring.step || 60;
    this._measurementMap = {};

    for (var i in config.monitoring.metrics) {
        if (!config.monitoring.metrics[i].disabled) {
            this._measurementMap[i] = config.monitoring.metrics[i];
        }
    }

    this._doNotReset = false;

    this._promises = [];

    //@overwrite the setInterval
    console.log(this._measurementMap);
    for (var i in this._measurementMap) {
        if(this._measurementMap[i].step) {
            this._overWriteTimeout(i);
        }
    }

    setInterval(function () {
        self._sendData();
    }, this._defaultSend * 1000);

}

Monitoring._instance = null;

/**
 * Singleton getter.
 *
 * @returns {Monitoring} instance of the Monitoring class.
 */
Monitoring.get = function () {
    return Monitoring._instance ||
        (Monitoring._instance = new Monitoring());
}

/**
 * Start of measurement block, computes depending on the operation of the use case.
 *
 * @param {String} configKey, the name of the use case.
 * @param {String} id, the unique measurement id.
 * @returns {String} id, the unique measurement id.
 */
Monitoring.prototype.startMeasurement = function (configKey, id) {
    if(this._enabled) {
        return;
    }

    if (!this._measurementMap[configKey]) {
        throw new RainError(util.format('There is no measurement configuration availabe for %s', configKey),
            RainError.ERROR_PRECONDITION_FAILED);
    }

    //register the measurement
    //add the configuration for the measurement
    if (!id || !this._measurementMap[configKey].measurements ||
        !this._measurementMap[configKey].measurements[id]) {
        var id = this._putToMap(configKey, id);
    }

    var typeofMeasurement = this._measurementMap[configKey].operation;
    var measurements = this._measurementMap[configKey].measurements;

    if(typeofMeasurement === 'average') {
        measurements[id].time = Date.now();
    }

    measurements.activeRequests ++;

    return id;
}

/**
 * End of measurement block, computes depending on the operation of the use case.
 *
 * @param {String} configKey, the name of the use case.
 * @param {String} id, the unique measurement id.
 */
Monitoring.prototype.endMeasurement = function (configKey, id) {
    if(this._enabled) {
        return;
    }

    //depending on the type from the config start the time or decrement or stop duration;
    var typeofMeasurement = this._measurementMap[configKey].operation;
    var measurements = this._measurementMap[configKey].measurements;

    if(typeofMeasurement === 'average') {
        var requestTime = Date.now() - measurements[id].time;
        measurements.total += requestTime;
        measurements[id].times.push(requestTime);
        measurements[id].time = 0;
        measurements[id].end = true;
    }

    measurements.resolvedRequests ++;
    measurements.activeRequests --;
}

/**
 * Special events of collecting monitoring data to the measurementMap
 *
 * @param {String} configKey, useCase for which to gather data.
 */
Monitoring.prototype.registerEvent = function (configKey) {

    if(this._enabled) {
        return;
    }

    if (!config.monitoring.metrics[configKey]) {
        throw new RainError(util.format('There is no measurement configuration availabe for %s', configKey),
            RainError.ERROR_PRECONDITION_FAILED);
    }

    if (this._measurementMap[configKey].operation === 'count') {

        if(!this._measurementMap[configKey].measurements) {
            this._measurementMap[configKey].measurements = {
                activeRequests: 0
            }
        }

       this._activeRequests ++;
    }

}

/**
 * Closes Monitoring, writes everything to the Zabbix Server and then finishes.
 *
 * @returns {Promise} when all ongoing writes to zabbix server are finished.
 */
Monitoring.prototype.close = function() {
    if(this._enabled) {
        process.nextTick(function () {
            return Promise.all(this._promises);
        });
    }

    this._sendData('all');
    return Promise.all(this._promises);
}

/**
 * Pushes collected data to the adapter for it to sent it to the monitoring proxy.
 *
 * @param {[JSON]} data, the data to be sent to the adapter
 * @returns status if the data has been successfully sent to the zabbix server.
 * @private
 */
Monitoring.prototype._sendData = function (step) {
    var deferred = Promise.defer(),
        data = this._composeData(step),
        self = this;

    if (data.length === 0) {
        return;
    }

    this._promises.push(deferred.promise);

    var removePromise = function (promise) {
        var index = self._promises.indexOf(promise);
        self._promises.splice(index, 1);
    };

    adapter.sendData(data).then(function () {
        //should I resolve with something?/should I log something
        removePromise(deferred.promise);
        deferred.resolve();
    }, function (err) {
        //should I resolve with something // should I log something
        logger.error('Failed to send data', err);
        self._doNotReset = true;
        removePromise(deferred.promise);
        deferred.reject(new RainError('Failed to send data to zabbix, not reseting values'), true);
    });

}

/**
 * Insert unique id to the useCase key in the measurementMap. If id is not present than it will be generated
 * automatically.
 *
 * @param {String} configKey, the useCase for which the measurement id should be add.
 * @param {String} [id], optional unique measurement id, if none present it will be generated.
 * @returns {String} returns the id added to the measurementMap
 * @private
 */
Monitoring.prototype._putToMap = function (configKey, id) {
    if (!id) {
        var id = this._generateMeasurementId();
        logger.debug(util.format('No id specified for the measurement %s, generating new one', configKey));
    }

    if(!this._measurementMap[configKey].measurements) {
        this._measurementMap[configKey]["measurements"] = {};
        if(this._measurementMap[configKey].operation === 'average') {
            this._measurementMap[configKey].measurements["total"] = 0;
        }
        this._measurementMap[configKey].measurements["resolvedRequests"] = 0;
        this._measurementMap[configKey].measurements["activeRequests"] = 0;
    }

    console.log(this._measurementMap[configKey]);
    //I always need a total for easy avg

    var measurements = this._measurementMap[configKey].measurements;

    if (this._measurementMap[configKey].operation === 'average') {
        this._measurementMap[configKey].measurements[id] = {};
        //I would need to store the time maybe but this is not mandatory, to be discussed
        measurements[id]["times"] = [];
        //time is the beginning of Start needed to compute process time;
        measurements[id]["time"] = 0;
    }

    return id;
}

/**
 * Creates a composition Array to be sent to zabbix proxy. If send is successful than metrics of times
 * are reset, otherwise are kept until the next successful send to zabbix.
 *
 * @param {Number/String} [step], optional parameter refering to which interval of time should the
 * composition refer, if absent it's refering to the other measurements that do not over write
 * the timer. If step is ``all`` (only if the close method is called) than all data collected is sent
 * to zabbix.
 *
 * @returns {Array} composed data to send to the zabbix server
 * @private
 */
Monitoring.prototype._composeData = function (step) {
    console.log('Composing data to send for', step);
    var composition = [];


    for (var i in this._measurementMap) {
        if(this._measurementMap[i].measurements && !this._measurementMap[i].step && !step) {
            console.log(this._measurementMap[i]);
            var value;
            if (this._measurementMap[i].operation === 'average') {
                value = this._average(i);
                composition.push({
                    key: this._measurementMap[i].secondaryKey,
                    value: this._measurementMap[i].resolvedRequests
                });
            } else if (this._measurementMap[i].operation === 'count') {
                value = this._measurementMap[i].measurements.activeRequests;
            } else if (this._measurementMap[i].operation === 'resolvedRequests') {
                value = this._measurementMap[i].measurements.resolvedRequests
            }


            composition.push({
                key: this._measurementMap[i].key,
                value: value
            });
        } else if(step && this._measurementMap[i].step === step &&
            this._measurementMap[i].measurements) {
            var value;
            if (this._measurementMap[i].operation === 'average') {
                value = this._average(i);
                composition.push({
                    key: this._measurementMap[i].secondaryKey,
                    value: this._measurementMap[i].resolvedRequests
                });
            } else if (this._measurementMap[i].operation === 'count') {
                value = this._measurementMap[i].measurements.activeRequests;
            } else if (this._measurementMap[i].operation === 'resolvedRequests') {
                value = this._measurementMap[i].measurements.resolvedRequests
            }

            composition.push({
                key: this._measurementMap[i].key,
                value: value
            });

        } else if (step === 'all' && this._measurementMap[i].measurements) {
            var value;
            if (this._measurementMap[i].operation === 'average') {
                value = this._average(i);
                composition.push({
                    key: this._measurementMap[i].secondaryKey,
                    value: this._measurementMap[i].resolvedRequests
                });
            } else if (this._measurementMap[i].operation === 'count') {
                value = this._measurementMap[i].measurements.activeRequests;
            } else if (this._measurementMap[i].operation === 'resolvedRequests') {
                value = this._measurementMap[i].measurements.resolvedRequests
            }


            composition.push({
                key: this._measurementMap[i].key,
                value: value
            });
        }
    }

    if(!this._doNotReset) {
        this._resetData(step);
    }

    return composition;

}

/**
 * Reset values for measurements of times after successful sending.
 *
 * @param {Number} step, the interval of time, useful for reseting only the sent data at that
 * interval.
 * @private
 */
Monitoring.prototype._resetData = function (step) {
    for (var i in this._measurementMap) {
        if(this._measurementMap[i].step === step) {
            for  (var j in this._measurementMap[i].measurements) {
                if (this._measurementMap[i].measurements[j] instanceof Object &&
                    this._measurementMap[i].measurements[j].end){
                    console.log('deleting', this._measurementMap[i]);
                    delete this._measurementMap[i].measurements[j];
                    this._measurementMap[i].measurements.resolvedRequests = 0;
                } else {
                    this._measurementMap[i].measurements.resolvedRequests = 0;
                }
            }
        }
    }
}

/**
 * Overwrites the timer for use cases that have a different intervals of sending.
 *
 * @param {String} key, the name of the useCase.
 * @private
 */
Monitoring.prototype._overWriteTimeout = function (key) {
    var self = this;
    setInterval(function () {
        self._sendData(self._measurementMap[key].step);
    }, this._measurementMap[key].step * 1000);
}

/**
 * Generates a unique id.
 *
 * @returns {String} the generated unique id.
 * @private
 */
Monitoring.prototype._generateMeasurementId = function () {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Calculates the average for a use case.
 *
 * @param {String} configKey, the name of the use case.
 * @returns {number} the calculated average
 * @private
 */
Monitoring.prototype._average = function (configKey) {
    var measurements = this._measurementMap[configKey].measurements;
    return measurements.total/measurements.resolvedRequests;
}


module.exports = Monitoring;
