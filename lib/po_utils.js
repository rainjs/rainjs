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

var fs = require('fs'),
    path = require('path');

// The gettext spec sets this character as the default
// delimiter for context lookups.
// e.g.: context\u0004key
var contextDelimiter = String.fromCharCode(4);

/**
 * Provides utility methods for po parsing
 *
 * @name PoUtils
 * @constructor
 */
function PoUtils() {}

/**
 * Parses the po data and creates an object using it. This object has the following structure:
 * {
 *     "": {key1: value1, ..., keyN: valueN}, //headers
 *     "msgid1": [null, "translation"],
 *     "msgid2": ["msgidPlural", "singular", "pluralForm0", "pluralForm1", ...],
 *     ...
 *     "msgidN": [null, "translation"]
 * }
 *
 *
 * @param {String} data the po data to be parsed
 * @returns {Object} the object containing the parsed po data
 * @memberOf PoUtils
 */
PoUtils.parsePo = function (data) {
    var rv = {},
        buffer = {},
        lastbuffer = "",
        errors = [],
        lines = data.split("\n"),
        match;

    for (var i = 0, len = lines.length; i < len; i++) {
        // remove trailing new lines
        lines[i] = lines[i].replace(/(\n|\r)+$/, '');

        // Empty line / End of an entry.
        if (/^$/.test(lines[i])) {
            if (typeof buffer['msgid'] !== 'undefined') {
                addTranslationEntry(rv, buffer);

                buffer = {};
                lastbuffer = "";
            }

        // comments
        } else if (/^(#[^~]|#$)/.test(lines[i])) {
            continue;

        // msgctxt
        } else if (match = lines[i].match(/^(?:#~ )?msgctxt\s+(.*)/)) {
            lastbuffer = 'msgctxt';
            buffer[lastbuffer] = dequote(match[1]);

        // msgid
        } else if (match = lines[i].match(/^(?:#~ )?msgid\s+(.*)/)) {
            lastbuffer = 'msgid';
            buffer[lastbuffer] = dequote(match[1]);

        // msgid_plural
        } else if (match = lines[i].match(/^(?:#~ )?msgid_plural\s+(.*)/)) {
            lastbuffer = 'msgid_plural';
            buffer[lastbuffer] = dequote(match[1]);

        // msgstr
        } else if (match = lines[i].match(/^(?:#~ )?msgstr\s+(.*)/)) {
            lastbuffer = 'msgstr_0';
            buffer[lastbuffer] = dequote(match[1]);

        // msgstr[0] (treak like msgstr)
        } else if (match = lines[i].match(/^(?:#~ )?msgstr\[0\]\s+(.*)/)) {
            lastbuffer = 'msgstr_0';
            buffer[lastbuffer] = dequote(match[1]);

        // msgstr[n]
        } else if (match = lines[i].match(/^(?:#~ )?msgstr\[(\d+)\]\s+(.*)/)) {
            lastbuffer = 'msgstr_' + match[1];
            buffer[lastbuffer] = dequote(match[2]);

        // continued string
        } else if (/^(?:#~ )?"/.test(lines[i])) {
            buffer[lastbuffer] += dequote(lines[i]);

        // something strange
        } else {
            errors.push("Strange line [" + i + "] : " + lines[i]);
        }
    }

    // handle the final entry
    if (typeof buffer['msgid'] !== 'undefined') {
        addTranslationEntry(rv, buffer);

        buffer = {};
        lastbuffer = "";
    }

    // parse out the header
    if (rv[""] && rv[""][1]) {
        var cur = {},
            hlines = rv[""][1].split(/\\n/);
        for (var i = 0; i < hlines.length; i++) {
            if (!hlines[i].length)
                continue;

            var pos = hlines[i].indexOf(':', 0);
            if (pos != -1) {
                var key = hlines[i].substring(0, pos),
                    val = hlines[i].substring(pos + 1);

                if (cur[key] && cur[key].length) {
                    errors.push("SKIPPING DUPLICATE HEADER LINE: " + hlines[i]);
                } else if (/#-#-#-#-#/.test(key)) {
                    errors.push("SKIPPING ERROR MARKER IN HEADER: " + hlines[i]);
                } else {
                    // remove beginning spaces if any
                    val = val.replace(/^\s+/, '');
                    cur[key] = val;
                }
            } else {
                errors.push("PROBLEM LINE IN HEADER: " + hlines[i]);
                cur[hlines[i]] = '';
            }
        }

        // replace header string with assoc array
        rv[""] = cur;
    } else {
        rv[""] = {};
    }

    // GNU Gettext silently ignores errors. So we only log the errors.
    if (errors.length) {
        //TODO: log errors here
    }

    return rv;
};

/**
 * Adds a new entry to the translations map
 *
 * @param {Object} map the object in which translations should be placed
 * @param {Object} buffer the object in which the entry data was collected
 */
function addTranslationEntry(map, buffer) {
    var msgid =
        (typeof buffer['msgctxt'] !== 'undefined' && buffer['msgctxt'].length)
        ? buffer['msgctxt'] + contextDelimiter + buffer['msgid']
        : buffer['msgid'];

    var msgidPlural =
        (typeof buffer['msgid_plural'] !== 'undefined' && buffer['msgid_plural'].length)
        ? buffer['msgid_plural']
        : null;

    var match,
        translations = [];

    // find msgstr_* translations and push them on
    for (var str in buffer) {
        if (match = str.match(/^msgstr_(\d+)/)) {
            translations[parseInt(match[1], 10)] = buffer[str];
        }
    }
    translations.unshift(msgidPlural);

    // only add it if we've got a translation
    // NOTE: this doesn't conform to msgfmt specs
    if (translations.length > 1) {
        map[msgid] = translations;
    }
}

/**
 * Removes the quotes from the start and end of the string
 *
 * @param {String} str the string to be dequoted
 * @returns the string with the quotes removed
 */
function dequote(str) {
    var match;
    if (match = str.match(/^"(.*)"/)) {
        str = match[1];
    }
    // unescape all embedded quotes
    str = str.replace(/\\"/g, '"');
    return str;
}

module.exports = PoUtils;
