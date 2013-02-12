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

/**
 * Parse the header fields.
 *
 * @param {String} string - The header field
 * @param {Function} [map] - The map function to be used
 * @param {Function} [sort] - The sort function to be used
 * @return {[String]} - The values of the parsed header
 */

function parseHeaderField(string, map, sort) {
    var strings;

    if (typeof string === undefined) {
        return;
    }

    string.replace('-','_');
    strings = trimsplit(string, ',');
    strings = strings.map(parseParams);

    map = map || parseStandard;
    sort = sort || sortQuality;

    strings = strings.map(map);
    strings.sort(sort);

    return strings;
};

/**
 * Split function depending on a token
 *
 * @param {String} string - the string you need to be split
 * @param {String} token - the rule that you want to split the string
 * @returns {[String]} - the splitted string
 */
function trimsplit(string, token) {
    var strings,
        results = [];
    strings = string.split(token);

    for (var i = 0, len = strings.length; i < len; i++) {
        string = strings[i];
        results.push(string.trim());
    }

    return results;
};

/**
 * The parsing function to parse the parameters of the header.
 *
 * @param {String} string - The header string
 * @returns {Object} - The value the parameters and the quality object generated after parsing
 */
function parseParams(string) {
    var strings, stringsParam, q, param,
        params = {},
        paramToObj = function(str, obj) {
            param = trimsplit(str, '=');
            return obj[param[0]] = param[1];
        };

    strings = trimsplit(string, ';');
    stringsParam = strings.slice(1);
    for (var i = 0, len = stringsParam.length; i < len; i++) {
        param = stringsParam[i];
        paramToObj(param, params);
    }
    if (typeof params.q !== undefined) {
        q = Number(params.q);
    } else {
        q = 1;
    }
    return {
        value: strings[0],
        params: params,
        quality: q
    };
};

/**
 * The standard parsing function.
 *
 * @param {Object} - The object needed to be parsed
 * @returns {Any} - The value of the object
 */
function parseStandard(obj) {
    return obj.value;
};

/**
 * The standard sorting function depending on the ``q`` value / the quality.
 *
 * @param {Object} a - first object for comparison
 * @param {Object} b - second object for comparison
 * @returns {Integer} - represents the result after the comparison
 */
function sortQuality(a, b) {
    if (a.quality < b.quality) {
        return 1;
    }
    return -1;
};

/**
 * Main parsing function of the http-language-header
 *
 * @param {String} header - the language header
 * @returns {ParsedObject} - the parsed object containing _values, getBestLanguageMatch() and getValues()
 */
function Parser(header) {
    var values = parseHeaderField(header);
    return new ParsedObject(values);
};

/**
 * The constructor of the ParsedObject
 *
 * @construct
 * @param {[String]} values - the values resulting from the parsed header
 */
function ParsedObject(values) {
    this._values = values;
}

/**
 * Get the best language match from an array of candidates.
 *
 * @param {[String]} candidates - the array of predefined languages
 * @returns {String | undefined} - the best language match from the candidates
 * @example
 *      var parsedHeader = new ParsedObject(['en', 'en_US']);
 *      var result = getBestLanguage(['ar_AR', 'en_UK']);
 *      console.log(results);
 */
ParsedObject.prototype.getBestLanguageMatch = function(candidates) {
    var acceptable, accepted, candidate, i, length, value, _i, _j, _len, _len1;
    acceptable = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = candidates.length; _i < _len; _i++) {
        candidate = candidates[_i];
        _results.push({
          value: candidate,
          q: -1,
          length: 0
        });
      }
      return _results;
    })();
    for (_i = 0, _len = acceptable.length; _i < _len; _i++) {
      candidate = acceptable[_i];
      value = candidate.value + "_";
      for (i = _j = 0, _len1 = this._values.length; _j < _len1; i = ++_j) {
        accepted = this._values[i];
        if ((value.indexOf(accepted + "_")) === 0) {
          length = (accepted.split("_")).length;
          if (length > candidate.length) {
            candidate.q = i;
            candidate.length = length;
          }
        }
      }
    }
    acceptable.sort(function(a, b) {
      if (a.q === -1 && b.q !== -1) {
        return 1;
      }
      if (a.q !== -1 && b.q === -1) {
        return -1;
      }
      if (a.q > b.q) {
        return 1;
      }
      if (a.q < b.q) {
        return -1;
      }
      if (a.length < b.length) {
        return 1;
      }
      if (a.length > b.length) {
        return -1;
      }
      return 0;
    });
    if (acceptable[0].q !== -1) {
      return acceptable[0].value;
    } else {
      if (this._values.indexOf("*") >= 0) {
        return candidates[0];
      }
    }
};

/**
 * Returns the values of the ParsedObject.
 *
 * @returns {[String]} - the values of the ParsedObject.
 */
ParsedObject.prototype.getValues = function () {
    return this._values;
};


module.exports = Parser;
