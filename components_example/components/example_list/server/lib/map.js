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
