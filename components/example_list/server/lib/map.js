"use strict";

var http = require('http'),
    url = require('url'),
    Deferred = require('promised-io/promise').Deferred,
    seq = require('promised-io/promise').seq,
    Options = require('./map_options');

/**
 * This class makes available the final URL to a static
 * image map for a country with points of interest highlighted.
 *
 * The class uses the OpenStreetMap API exposed by MapQuest
 * {@link http://open.mapquestapi.com}.
 *
 * It uses their Nominatim service {@link http://open.mapquestapi.com/nominatim/}
 * for searching for points of interest in the country related to the current
 * platform language.
 * 
 * @param {String} code ISO-3166-1 alpha2 country code
 * @property {Options} options map options object to retrieve OSM HTTP options
 */
function Map(code) {
    this.options = new Options(code);
}

/**
 * Retrieves the static map URL.
 *
 * An HTTP request is made to get the longitudes and latitudes for the
 * points of interest first, and then the final static map URL is assembled.
 *
 * @returns {Promise} a promise that will get resolved with the static map image URL
 */
Map.prototype.load = function () {
    var self = this,
        // seq doesn't take a context, so bind one to each step
        steps = [search, parse, assemble].map(
            function (fn) {
                return fn.bind(self, self);
            }
        );

    return seq(steps);
};

/**
 * First step of the process: search for points of interest.
 *
 * @param {Map} self the class instance
 * @returns {Promise} a promise that gets resolved with the POI data
 */
function search(self) {
    var deferred = new Deferred();
    var req = http.get(self.options.pois(), function (res) {
        var data = [];
        res.setEncoding('utf8');
        res.on('data', data.push.bind(data));
        res.on('end', function () {
            deferred.resolve(data.join(''));
        });
    });
    req.on('error', deferred.reject);
    return deferred.promise;
}

/**
 * The second step of the process: parse the POI result.
 *
 * @param {Map} self the class instance
 * @param {Array} pois an array of search results
 * @returns {Promise} a promise that gets resolved with an array of locations for pois
 */
function parse(self, pois) {
    var deferred = new Deferred();

    process.nextTick(function () {
        try { pois = JSON.parse(pois); }
        catch (e) { return deferred.reject(); }

        deferred.resolve(
            pois.map(function (poi) {
                return [poi.lat, poi.lon];
            })
        );
    });

    return deferred.promise;
}

/**
 * The third and final step of the process: assemble the final static image URL.
 *
 * @param {Map} self the class instance
 * @param {Array} pois array of locations (latitudes and longitudes)
 * @returns {Promise} a promise that gets resolved with the final URL
 */
function assemble(self, pois) {
    var deferred = new Deferred();

    process.nextTick(function () {
        deferred.resolve(url.format(self.options.map(pois)));
    });

    return deferred.promise;
}

module.exports = Map;
