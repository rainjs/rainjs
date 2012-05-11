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

var util = require('util'),
    qs = require('querystring'),
    extend = require('node.extend'),
    countries = require('./map_countries');

/**
 * Global HTTP options.
 * @type {Object}
 */
var options = {
        common: {
            host: 'open.mapquestapi.com'
        },
        // for the points of interest request
        pois: {
            path: '/nominatim/v1/search?%s',
            params: {
                format: 'json',
                limit: 30
            }
        },
        // for the static map image request
        map: {
            // locations of countries
            countries: {
                gb: {
                    center: '53.500440692794946,-4.196281785273997',
                    zoom: 6
                },
                us: {
                    center: '39.02683550257916,-98.17333256277196',
                    zoom: 4
                },
                de: {
                    center: '50.832979514488855,10.72315180788033',
                    zoom: 6
                },
                fr: {
                    center: '46.64865559597015,2.7690502456979114',
                    zoom: 6
                },
                ro: {
                    center: '45.8356618294671,24.895515088564498',
                    zoom: 7
                }
            },
            pathname: '/staticmap/v4/getmap',
            search: '?%s',
            params: {
                size: '600,500',
                type: 'hyb',
                imageType: 'jpeg'
            }
        }
    },
    // icon for pois (see {@link http://open.mapquestapi.com/staticmap/icons.html})
    icon = 'blue-%d',
    // search query (see special phrases {@link http://wiki.openstreetmap.org/wiki/Nominatim/Special_Phrases})
    q = 'Airport%s';

/**
 * Provides HTTP options for calls to the Open MapQuest API.
 * 
 * @param {String} code ISO-3166-1 alpha2 country code
 * @property {String} code
 * @property {Object} http cache for http options
 */
function Options(code) {
    this.code = code;
    this.http = {};
}

/**
 * Get the HTTP options for the pois call.
 * 
 * @returns {Object} HTTP options
 */
Options.prototype.pois = function () {
    if (this.http.pois) {
        return this.http.pois;
    }

    var params = extend(
            {
                countrycodes: this.code,
                q: util.format(
                    q,
                    // the nominatim service doesn't handle searches in US
                    // as for other countries, so just use the countrycodes param
                    this.code === 'us' ? '' : ' in ' + countries[this.code]
                )
            },
            options.pois.params
        );

    return this.http.pois = {
        host: options.common.host,
        path: util.format(options.pois.path, qs.stringify(params))
    };
};

/**
 * Get the HTTP options for the static map image call.
 * 
 * @param {Array} pois an array of POI locations (lat, long)
 * @returns {Object} HTTP options
 */
Options.prototype.map = function (pois) {
    if (this.http.map) {
        return this.http.map;
    }

    var params = extend(
            options.map.countries[this.code],
            {
                // pois query param: label,lat,lon|label,lat,lon ...
                pois: pois.map(
                    function (poi, idx) {
                        // insert standard icon, start from 1
                        poi.unshift(util.format(icon, idx + 1));
                        return poi.join(',');
                    }
                ).join('|')
            },
            options.map.params
        );

    return this.http.map = {
        protocol: 'http',
        host: options.common.host,
        pathname: options.map.pathname,
        search: util.format(
            options.map.search,
            // the map service wants commas unescaped
            qs.stringify(params).replace(/%2C/gi, ',')
        )
    };
};

module.exports = Options;
