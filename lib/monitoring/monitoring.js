"use strict";

var crypto = require('crypto'),
    util = require('util'),
    logger = require('../logging').get(),
    config = require('rain/lib/configuration'),
    adapter = require('./adapter').get(),
    Promise = require('promise-io/promised');

/**
 * Monitoring module.
 *
 * @constructor
 * @name Monitoring
 */
function Monitoring () {
    if (!config.monitoring.adapter.options.monitoringHost) {
        throw new RainError('There should be a host key name set for the monitoring machine',
                    RainError.ERROR_PRECONDITION_FAILED);
    }

    this._defaultSend = config.monitoring.step || 60;
    this._defaultHost = config.monitoring.adapter.options.monitoringHost;

    if(!config.monitoring.metrics) {
        throw new RainError('There is no measurement key in your monitoring configuration',
                    RainError.ERROR_PRECONDITION_FAILED);
    }

    this._measurementMap = config.monitoring.metrics;
    for(var i in this._measurementMap) {
        this._measurementMap[i]["measurements"] = {};
    }
}

Monitoring.instance = null

/**
 * Singleton getter.
 *
 * @returns {Monitoring} instance of the Monitoring class.
 */
Monitoring.get = function () {
    return Monitoring.instance ||
        (Monitoring.instance = new Monitoring);
}

/**
 * Start of measurement block, computes depending on the type of use case.
 *
 * @param {String} configKey, the name of the use case.
 * @param {String} id, the unique measurement id.
 * @returns {String} id, the unique measurement id.
 */
Monitoring.prototype.start = function (configKey, id) {

    if (!this._measurementMap[configKey]) {
        throw new RainError(util.format('There is no measurement configuration availabe for %s', configKey),
                        RainError.ERROR_PRECONDITION_FAILED);
    }

    //register the measurement
    //add the configuration for the measurement
    if (!this._measurementMap[configKey][id]) {
        var id = this._putToMap(configKey, id);
    }

    var typeofMeasurement = this._measurementMap[configKey].type;
    var measurements = this._measurementMap[configKey].measurements[id];

    if(typeofMeasurement === 'time') {
        measurements.time = Date().now;
    } else if(typeofMeasurement === 'number') {
        this._increment(configKey, id);
    }

    return id;
}

/**
 * End of measurement block, computes depending on the type of use case.
 *
 * @param {String} configKey, the name of the use case.
 * @param {String} id, the unique measurement id.
 */
Monitoring.prototype.end = function (configKey, id) {
    //depending on the type from the config start the time or decrement or stop duration;
    var typeofMeasurement = this._measurementMap[configKey].type;
    var measurements = this._measurementMap[configKey].measurements[id];

    if(typeofMeasurement === 'time') {
        var requestTime = Date().now - measurements.time;
        measurements.total += requestTime;
        measurements.times.push(requestTime);
        measurements.time = 0;
        measurements.requests ++;
    } else {
        this._decrement(configKey, id);
    }
}

Monitoring.prototype._increment = function (configKey, id) {
    if(id) {
        this._measurementMap[configKey].measurementes[id].total ++;
    } else {
        this._measurementMap[configKey].total ++;
    }
}

Monitoring.prototype._decrement = function (configKey, id) {
    this._measurementMap[configKey].measurementes[id].total --;
}

/**
 * Calculates the average for a use case with the specific measurement id.
 *
 * @param {String} configKey, the name of the use case.
 * @param {String} id, unique measurement id.
 * @returns {number} the calculated average
 * @private
 */
Monitoring.prototype._average = function (configKey, id) {
    var measurements = this._measurementMap[configKey].measurements[id];
    return measurments.time/measurements.requests;
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
        this._generateMeasurementId();
        logger.debug(util.format('No id specified for the measurement %s, generating new one', configKey));
    }

    this._measurementMap[configKey].measurements[id] = {
        //I always need a total for easy avg
        total: 0
    }

    var measurements = this._measurementMap[configKey].measurements[id];

    if (this_measurementMap[configKey].type === 'time') {
        //I would need to store the time maybe but this is not mandatory, to be discussed
        measurements["times"] = [];
        //time is the beginning of Start needed to compute process time;
        measurements["time"] = 0;
        measurements["requests"] = 0;
    }

    return id;
}

/**
 * Special events of collecting monitoring data to the measurementMap
 *
 * @param {String} configKey, useCase for which to gather data.
 */
Monitoring.prototype.event = function (configKey) {

    if (!config.monitoring.metrics[configKey]) {
        throw new RainError(util.format('There is no measurement configuration availabe for %s', configKey),
            RainError.ERROR_PRECONDITION_FAILED);
    }

    if (this._measurementMap[configKey].type === 'number' &&
        !this._measurementMap[configKey].immediately) {

        if(!this._measurementMap[configKey].total) {
            this._measurementMap["total"] = 0;
        }

        this._increment(configKey);
    }


    if (this._measurementMap[configKey].immediately) {
        var deferred = Promise.defer();
        //figure out to send everything here
        if (this._measurementMap[configKey].type === 'number') {
            this._sendData([{
                host: this._defaultHost,
                key: this._measurementMap[configKey].key,
                value: 1
            }]).then(function () {
                    //should I resolve with something?/should I log something
                    deferred.resolve();
                    process.nextTick(function () {
                        return deferred.promise;
                    });
                },
            function () {
                //should I resolve with something // should I log something
                deferred.reject();
                process.nextTick(function () {
                    return deferred.promise;
                });
            });
        }
    }


}

/**
 * Pushes collected data to the adapter for it to sent it to the monitoring proxy.
 *
 * @param {[JSON]} data, the data to be sent to the adapter
 * @returns status if the data has been successfully sent to the zabbix server.
 * @private
 */
Monitoring.prototype._sendData = function (data) {
    var deferred = Promise.defer();
    Adapter.sendData(data).then(function () {
        //should I resolve with something?/should I log something
        deferred.resolve();
    }), function () {
        //should I resolve with something // should I log something
        deferred.reject();
    };

    return deferred.promise;
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

module.exports = Monitoring;