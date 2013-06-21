// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"use strict";

var crypto = require('crypto'),
    util = require('util'),
    logger = require('../logging').get(),
    path = require('path'),
    config = require('../configuration'),
    adapter = require('./adapter').get(),
    Promise = require('promised-io/promise'),
    extend = require('node.extend'),
    url = require('url');

/**
 * Monitoring module. Populates a measurement map depending on useCases, if the useCases are disabled
 * than they are not added to the measurement map. The monitoring module will not work / will be disabled
 * in the following situation:
 * - the monitoring configuration is missing;
 * - the adapter module instance is missing or could not be initialized;
 * - the monitoring metrics key is missing;
 * - the disabled key in the monitoring configuration;
 *
 * The monitoring module can also measure some use cases for different tlds. In this sittuation please
 * use.
 * @example
 *      var monitoringInstance = Monitoring.get();
 *      var useCase = monitoringInstance.registerTld('<useCase>', '<host>');
 *      var id = monitoringInstance.startMeasurement(useCase);
 *      monitoringInstance.endMeasurement(useCase, id);
 *      monitoringInstance.registerEvent(useCase);
 *
 * The monitoring module can also load self dependent measurement plugins with their own measurement
 * plan and logic. To include your modules you should describe them in your configuration like so:
 * @example
 *      "measurementPlugins": {
 *           "pluginName": {
 *               "path": "./path/to/plugin"
 *           }
 *       }
 *
 * Also you should not forget to include the ``pluginName`` set above in your ``metrics`` key
 * from the configuration file. The way you write it in the metrics key is the same as for other
 * use cases.
 *
 * The monitoring module creates a measurementMap that would look like this:
 * @example
 *      "useCase1": {
 *          key:'zabbixUniqueKey',
 *          operation: 'count'/'average',
 *          secondaryKey: 'secondaryZabbixKey',
 *          step: {Number}
 *          measurements: {
 *              activeRequests: {Number},
 *              resolvedRequests: {Number},
 *              total: {Number},
 *              registered: {Boolean},
 *              start: {Time},
 *              end: {Time},
 *              uniqueId1: {
 *                  time: {Number},
 *                  end: {Boolean},
 *               }
 *               uniqueId2: {
 *                   time: {Number},
 *                   end: {Boolean},
 *               }
 *          }
 *      }
 *
 * **key** - Mandatory. The unique zabbix server key.
 * **operation** - Mandatory. The operation to be done on a specific use case. Posibilities are: ``count`` and
 * ``average``
 * **secondaryKey** - Optional. Only present if the operation set for the use case is ``average``. Otherwise
 * it will not be taken into consideration.
 * **step** - Optional. If present it will over write the interval of sending for the use case it is set. If
 * not present the interval is the global one.
 * **measurements** - Generated object on the first ``startMeasurement`` or ``registerEvent`` method call.
 * **activeRequests** - Generated on the first ``startMeasurement`` or ``registerEvent`` method call.
 * Incremented on ``startMeasurement`` or ``registerEvent`` call and decremented on ``endMeasurement`` call.
 * This key is reset only for registered events.
 * **resolvedRequests** - Generated on the first ``startMeasurement`` method call. Incremented on
 * ``endMeasurement`` call. The value is reset after every successfull send.
 * **total** - Generated on the first ``startMeasurement`` method call only for the use cases with the
 * operation ``average``. It represents the total time spent for resolving requests in a period time.
 * **registered** - Generated on the first ``registerEvent`` method call. It signals that the current
 * measurement is special and it has been registered not traditional ``startMeasurement``, ``endMeasurement``
 * process. Flag is used in the logic of the data reset.
 * **start** - Generated at every ``startMeasurement``, represents the time when the measurement was last started.
 * Needed for the logic of sending data. If no ``startMeasurement`` has been executed in that interval of time
 * than data for that use case will not be sent.
 * **end** - Generated at every ``endMeasurement``, represents the time when the measurement was last ended.
 * Needed for the logic of sending data. If no ``endMeasurement`` has been executed in that interval of time
 * than data for that use case will not be sent.
 * **uniqueId**1,2 - Set only for the usecases that have ``average`` operation set at the first ``startMeasurement``
 * method call. This id will be passed or will be automatically generated internaly using crypto. U should always
 * use an unique id. The id is not reusable, you can only end a measurement for a specific id, after that it
 * will be deleted.
 * **time** - Set only for unique Ids in use cases with ``average`` operation. Represents the time when
 * the ``startMeasurement`` was called for that specific id. Needed to calculate the time of a resolved
 * request.
 * **end** - Set only for unique Ids in use cases with ``average`` operation. Flags the id that it can
 * be deleted when ``resetData`` is called.
 *
 * @constructor
 * @name Monitoring
 * @throws {RainError} if any use case misses the mandatory zabbix key or the operation.
 */
function Monitoring () {

    var monitoringConf = config.monitoring;

    if (!monitoringConf || adapter === null || !monitoringConf.metrics || monitoringConf.disabled) {
        logger.debug('Monitoring module inactive');
        /**
         * Flag informing about the availability of the module. Default is false
         *
         * @type {boolean}
         * @private
         */
        this._disabled = true;
        return this;
    }

    var self = this;

    /**
     * Array of promises of data sent to Zabbix server.
     *
     * @type {Array}
     * @private
     */
    this._promises = [];

    /**
     * The default send rate of date to Zabbix server.
     *
     * @type {Number}
     * @private
     */
    this._globalStep = monitoringConf.step || 60;

    /**
     * The measurementMap created from the metrics configuration. See class description
     * for properties.
     *
     * @type {Object}
     * @private
     */
    this._measurementMap = {};

    /**
     *The measurementPlugin Map created from the monitoring configuration. See class description
     * for properties.
     *
     * @type {Object}
     * @private
     */
    this._measurementPlugins = {};


    for (var useCaseKey in monitoringConf.metrics) {

        this._validateMetricConfiguration(monitoringConf.metrics[useCaseKey]);

        if (!monitoringConf.metrics[useCaseKey].disabled) {
            //verify if this works
            this._measurementMap[useCaseKey] = extend({}, monitoringConf.metrics[useCaseKey]);
        }
    }

    /**
     * delay registering plugins, mess up multiple requires.
     */
    var measurementPlugins = monitoringConf.measurementPlugins;

    process.nextTick(function () {
        if (measurementPlugins && !measurementPlugins.disabled) {
            for (var plugin in measurementPlugins.plugins) {
                if (!measurementPlugins.plugins[plugin].disabled &&
                    self._measurementMap[plugin] && !self._measurementMap[plugin].disabled) {
                    self._registerMonitoringPlugin(plugin, measurementPlugins.plugins[plugin]);
                }
            }
        }
    });

    for (var useCaseKey in this._measurementMap) {
        if (this._measurementMap[useCaseKey].step) {
            this._setIntervalSending(this._measurementMap[useCaseKey].step);
        }
    }

    this._setIntervalSending();

};

/**
 * The instance of the Monitoring module.
 *
 * @type {Monitoring}
 * @private
 */
Monitoring._instance = null;

/**
 * Singleton getter.
 *
 * @returns {Monitoring} instance of the Monitoring class.
 */
Monitoring.get = function () {
    return Monitoring._instance ||
        (Monitoring._instance = new Monitoring());
};

/**
 * Start of the measurement for a specific useCase with an unique id. Logs errors if the use case
 * is missing or the specified useCase is not present in the metrics configuration. If no measurement
 * was started before for an use case it registers a measurement key in the measurement map. Please
 * see the class documentation for the parameters set by this method.
 *
 * @param {String} configKey the name of the use case.
 * @param {String} [id] the unique measurement id.
 * @returns {String} id the unique measurement id.
 */
Monitoring.prototype.startMeasurement = function (configKey, id) {
    if (this._disabled) {
        return;
    }

    if (this._validateUseCaseMeasurement(configKey)) {
        return;
    }

    if (!id || !this._measurementMap[configKey].measurements ||
        !this._measurementMap[configKey].measurements[id]) {
        var id = this._putToMap(configKey, id);
    }

    var typeofMeasurement = this._measurementMap[configKey].operation;
    var measurements = this._measurementMap[configKey].measurements;

    if (typeofMeasurement === 'average') {
        measurements[id].time = Date.now();
    }

    measurements.start = Date.now();

    measurements.activeRequests++;

    return id;
};

/**
 * End of measurement for a specific use case. Logs errors if the use case key is missing, the specified
 * use case is not present in the metrics configuration, the specified id is not present in the measurement
 * map or there was no measurement started before the ``endMeasurement`` was called.
 *
 * @param {String} configKey the name of the use case.
 * @param {String} [id] the unique measurement id.
 */
Monitoring.prototype.endMeasurement = function (configKey, id) {
    if (this._disabled) {
        return;
    }

    if (this._validateUseCaseMeasurement(configKey)) {
        return;
    }

    if (!this._measurementMap[configKey].measurements ||
        (!this._measurementMap[configKey].measurements[id] &&
        this._measurementMap[configKey].operation === 'average')) {
        logger.error(util.format('There was no measurement started for %s on useCase %s', id, configKey));
        return;
    }

    //depending on the type from the config start the time or decrement or stop duration;
    var typeofMeasurement = this._measurementMap[configKey].operation;
    var measurements = this._measurementMap[configKey].measurements;

    if (typeofMeasurement === 'average') {
        var requestTime = Date.now() - measurements[id].time;
        measurements.total += requestTime;
        measurements[id].time = 0;
        measurements[id].end = true;
    }

    measurements.end = Date.now();
    measurements.resolvedRequests++;
    measurements.activeRequests--;
};

/**
 * Collecting other types of monitoring data not depending on ``startMeasurement`` and ``endMeasurement``
 * methods, this method can be called only for the use cases that have a ``count`` operation.
 *
 * @param {String} configKey useCase for which to gather data.
 */
Monitoring.prototype.registerEvent = function (configKey, value) {

    if (this._disabled) {
        return;
    }

    this._validateUseCaseMeasurement(configKey);

    if (this._measurementMap[configKey].operation === 'count') {
        if (!this._measurementMap[configKey].measurements) {
            this._measurementMap[configKey].measurements = {
                activeRequests: 0,
                registered: true
            };
        }

        var measurement = this._measurementMap[configKey].measurements;

        measurement.start = Date.now();
        if (!value && value !== 0) {
            measurement.activeRequests++;
        } else {
            measurement.activeRequests += value;
        }
    } else {
        logger.error(util.format('Not possible to measure %s, register events are only availabe' +
            ' for usecases with ``count`` operation', configKey));
        return;
    }

};

/**
 * Registers a tld use case if no host is passed then it will return the current useCase, also
 * if the tld configuration is disabled it will also return the same useCase. If the module
 * is disabled then this method will not work. This module also dynamically adds a clone of the base
 * use case concatanated with the tld retrieved from the host paramether.
 *
 * @param {String} configKey the name of the use case.
 * @param {String} [host] optional parameter representing the host that requests the measurement.
 * @returns {String/Null} returns the name of the use case or null if the module is disabled.
 */
Monitoring.prototype.registerTld = function (configKey, host) {
    if (this._disabled) {
        return;
    }

    if (!host) {
        return configKey;
    }

    if (!config.monitoring.enableTld || !this._measurementMap[configKey]) {
        return configKey;
    }

    var urlParams = url.parse('http://' + host).hostname.split('.'),
        useCase = configKey,
        tld = urlParams[urlParams.length - 1];

    if (urlParams.length >= 2 && isNaN(parseInt(tld, 10))) {
        useCase = configKey + '_' + tld;

        if (!this._measurementMap[useCase]) {
            this._insertTld(configKey, useCase, tld);
        }
    }

    return useCase;
};

/**
 * Writes all the collected data to the Monitoring Server. No more monitoring can be done
 * after calling this method.
 *
 * @returns {Promise} when all ongoing writes to zabbix server are finished.
 */
Monitoring.prototype.close = function() {
    var self = this;
    if (this._disabled) {
        process.nextTick(function () {
            Promise.all(self._promises);
        });
    }

    this._sendData('all');
    this._disabled = true;
    return Promise.all(this._promises);
};

/**
 * Inserts useCase with tld in the measurementMap. Clones the base use case and concatenates the tld
 * at the use case name, the zabbix key and the secondary zabbix key if present.
 *
 * @param {String} configKey the base name of the use case.
 * @param {String} useCase the new name of the use case.
 * @param {String} tld the name of the tld.
 * @private
 */
Monitoring.prototype._insertTld = function (configKey, useCase, tld) {
    var useCaseObject = extend({}, this._measurementMap[configKey]);

    var useCaseTld = '_'  + tld;
    useCaseObject.key += useCaseTld;
    if (useCaseObject.secondaryKey) {
        useCaseObject.secondaryKey = useCaseObject.secondaryKey + useCaseTld;
    }

    this._measurementMap[useCase] = useCaseObject;
};

/**
 * Validate if the measurement calculation can be computed or not for a specific use case.
 *
 * @param {String} configKey the use case for which the validation is made
 * @returns {Boolean} if the validation of the use cases are ok or not
 * @private
 */
Monitoring.prototype._validateUseCaseMeasurement = function (configKey) {
    if (this._disabled) {
        return true;
    }

    if (!configKey) {
        logger.error('You must always pass the configuration key of the use case');
        return true;
    }

    if (!this._measurementMap[configKey]) {
        logger.error(util.format('There is no measurement available for %s',
            configKey));
        return true;
    }

    return false;
};
/**
 * Validates the configuration of an use case.
 *
 * @param useCase
 * @private
 * @throws {RainError} if any use case misses the mandatory zabbix key or the operation.
 */
Monitoring.prototype._validateMetricConfiguration = function (useCase) {
    if (!useCase.key) {
        throw new RainError(util.format('Zabbix key is missing in usecase %s', useCase),
            RainError.ERROR_PRECONDITION_FAILED);
    }
    if (!useCase.operation) {
        throw new RainError(util.format('Operation key is missing in usecase %s', useCase),
            RainError.ERROR_PRECONDITION_FAILED);
    }

    if (!(useCase.operation === 'count' || useCase.operation === 'average')) {
        throw new RainError(util.format('The operation %s for use case %s is not ' +
            'supported', useCase.operation, useCase), RainError.ERROR_PRECONDITION_FAILED);
    }
};

/**
 * Sends the collected data to Monitoring Server.
 *
 * @params {Number} step the interval of time of sending data.
 * @private
 */
Monitoring.prototype._sendData = function (step) {
    var deferred = Promise.defer(),
        data = this._composeData(step),
        self = this;

    data.then(function (dataToSend) {
        if (dataToSend.length === 0) {
            return;
        }

        self._promises.push(deferred.promise);

        var removePromise = function (promise) {
            var index = self._promises.indexOf(promise);
            self._promises.splice(index, 1);
        };

        adapter.sendData(dataToSend).then(function () {
            removePromise(deferred.promise);
            self._resetData(step);
            deferred.resolve();
        }, function (err) {
            logger.error('Failed to send data', err);
            removePromise(deferred.promise);
            deferred.reject(new RainError('Failed to send data to zabbix, not reseting values'), true);
        });
    }, function (err) {
        logger.error(err);
    });
};

/**
 * Insert unique id to the useCase key in the measurementMap. If id is not present than it will
 * be generated automatically.
 *
 * @param {String} configKey, the useCase for which the measurement id should be add.
 * @param {String} [id], optional unique measurement id, if none present it will be generated.
 * @returns {String} returns the id added to the measurementMap
 * @private
 */
Monitoring.prototype._putToMap = function (configKey, id) {
    if (!id) {
        var id = this._generateMeasurementId();
        logger.debug(util.format('No id specified for the measurement %s, ' +
            'generating new one', configKey));
    }

    if (!this._measurementMap[configKey].measurements) {
        this._measurementMap[configKey].measurements = {};
        if (this._measurementMap[configKey].operation === 'average') {
            this._measurementMap[configKey].measurements["total"] = 0;
        }
        this._measurementMap[configKey].measurements["resolvedRequests"] = 0;
        this._measurementMap[configKey].measurements["activeRequests"] = 0;
    }

    var measurements = this._measurementMap[configKey].measurements;

    if (this._measurementMap[configKey].operation === 'average') {
        measurements[id] = {};
        measurements[id]["times"] = [];
        measurements[id]["time"] = 0;
    }

    return id;
};

/**
 * Creates the standard composition object for useCase to be sent to Monitoring
 * Server.
 *
 * @param {Object} useCase the useCase for which the calculations are made
 * @param {String/Number} [step] the interval of time
 * @returns {Array} the resulted composition Array for Adapter Sender
 * @private
 */
Monitoring.prototype._composeDataForUseCase = function (useCase, step) {
    var value,
        composition = [];

    var  timeInterval = (step === 'all' || !step) ? this._globalStep * 1000 : step * 1000;

    if (useCase.operation === 'average' &&
        useCase.measurements.resolvedRequests !== 0) {
        value = this._average(useCase);
        if (useCase.secondaryKey) {
            composition.push({
                key: useCase.secondaryKey,
                value: useCase.measurements.resolvedRequests
            });
        }
    } else if (useCase.operation === 'count' &&
        (Date.now() - useCase.measurements.start <= timeInterval ||
        Date.now() - useCase.measurements.end <= timeInterval)){
            value = useCase.measurements.activeRequests;
    } else if (useCase.operation === 'resolvedRequests' &&
        useCase.measurements.resolvedRequests !== 0) {
            value = useCase.measurements.resolvedRequests;
    }

    useCase.timeOfSend = Date.now();


    if (typeof value !== 'undefined') {
        composition.push({
            key: useCase.key,
            value: value
        });
    }

    return composition;
};

/**
 * Creates a standard composition Array to be sent to Monitoring Server.
 *
 * @param {Number/String} [step] optional parameter refering to which interval of time should the composition refer.
 *
 * @returns {Array} composed data to send to the Monitoring Server
 * @private
 */
Monitoring.prototype._composeData = function (step) {
    var composition = [],
        resultsPromises = {},
        self = this,
        deferred = Promise.defer();

    var sendAllData = step === 'all';

    for (var useCase in this._measurementMap) {
        var isDefault = !this._measurementMap[useCase].step && !step,
            hasCurrentStep = step && this._measurementMap[useCase].step === step;

        if (isDefault || hasCurrentStep || sendAllData) {
            if (this._measurementPlugins[useCase]) {
                var pluginResult = this._measurementPlugins[useCase].run();
                resultsPromises[useCase] = pluginResult;
            } else if (this._measurementMap[useCase].measurements){
                composition = composition.concat(this._composeDataForUseCase(this._measurementMap[useCase],
                    step));
            }
        }
    }

    Promise.allKeys(resultsPromises).then(function (resultObject) {
        for (var key in resultObject) {
            self.registerEvent(key, resultObject[key]);
            composition = composition.concat(self._composeDataForUseCase(self._measurementMap[key],
                step));

        }
        deferred.resolve(composition);
    }, function (err) {
        deferred.reject(err);
    });

    return deferred.promise;

};

/**
 * Reset values for measurements of times after successful sending.
 *
 * @param {Number} step the interval of time, useful for reseting only the sent data at that interval.
 * @private
 */
Monitoring.prototype._resetData = function (step) {
    var  timeInterval = (step === 'all' || !step) ? this._globalStep * 1000 : step * 1000;

    var measurementMap = this._measurementMap;
    for (var key in measurementMap) {
        if (measurementMap[key].step === step &&
            Date.now() - measurementMap[key].timeOfSend <= timeInterval) {
            var measurements = measurementMap[key].measurements;
            for  (var data in measurements) {
                if (measurements[data] instanceof Object &&
                    measurements[data].end){
                    delete measurements[data];
                    measurements.resolvedRequests = 0;
                } else {
                    measurements.resolvedRequests = 0;
                }

                if (measurements && measurements.registered) {
                    measurements.activeRequests = 0;
                }
                if (measurements) {
                    measurements.total = 0;
                }
            }
        }
    }
};

/**
 * Overwrites the timer for use cases that have a different intervals of sending.
 *
 * @param {Number} step the interval of sending data.
 * @private
 */
Monitoring.prototype._setIntervalSending = function (step) {
    var self = this;
    setInterval(function () {
        self._sendData(step);
    }, (step || self._globalStep) * 1000);
};

/**
 * Generates an unique id.
 *
 * @returns {String} the generated unique id.
 * @private
 */
Monitoring.prototype._generateMeasurementId = function () {
    return crypto.randomBytes(16).toString('hex');
};

/**
 * Calculates the average for a use case.
 *
 * @param {String} useCase the name of the use case.
 * @returns {number} the calculated average
 * @private
 */
Monitoring.prototype._average = function (useCase) {
    var measurements = useCase.measurements;
    return measurements.total/measurements.resolvedRequests;
};

/**
 * Registers some individual monitoring plugins with logic of their own.
 *
 * @param {String} pluginName the name of the plugin must be the same with the use case name
 * @param {Object} pluginConfiguration the properties of the requested plugin
 * @throws {RainError} if the plugin name is not present among the use cases
 * @throws {RainError} if the path to the plugin is not valid.
 * @private
 */
Monitoring.prototype._registerMonitoringPlugin = function (pluginName, pluginConfiguration) {
    if (!this._measurementMap[pluginName]) {
        throw new RainError(util.format('Cannot load plugin %s because it is not present in ' +
            'the use cases', pluginName), RainError.ERROR_PRECONDITION_FAILED);
    }

    try {
        var plugin = require(path.join(process.cwd(), pluginConfiguration.path));
        this._measurementPlugins[pluginName] = new plugin();
        logger.debug(util.format('Registered measurement plugin %s successful', pluginName));
    } catch (err) {
        throw new RainError(util.format('Failed to load plugin %s: %s %s', pluginName,
            err.message, err.stacktrace), RainError.ERROR_PRECONDITION_FAILED);
    }
};

module.exports = Monitoring;
