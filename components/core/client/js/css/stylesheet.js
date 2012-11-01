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

define([], function () {
    var MAX_RULES = 4095;

    function Stylesheet(id) {
        this._nextIndex = 0;
        this._ruleCount = 0;
        this._styleSheet = document.getElementById(id);
        this._transaction = {
            '_append': [],
            '_remove': []
        };

        // stylesheet does not exist, create it;
        if (!this._styleSheet) {
            this._styleSheet = document.createElement('style');
            this._styleSheet.setAttribute('id', 'style' + id);

            document.getElementsByTagName('head')[0].appendChild(this._styleSheet);
        }

        Object.defineProperties(this, {
            'id': {
                value: id,
                writable: false
            },
            'ruleCount': {
                value: this._ruleCount,
                writable: false
            }
        });
    }

    Stylesheet.prototype.add = function (rule) {
        if ((this._ruleCount + rule.ruleCount) > MAX_RULES) {
            return false;
        }

        this._ruleCount += rule.ruleCount;
        this._transaction._append.push(rule);

        return true;
    };

    Stylesheet.prototype.remove = function (rules) {
        this._transaction._remove.push(rules);
    };

    Stylesheet.prototype.write = function () {
        for (var action in this._transaction) {
            if (this._transaction.hasOwnProperty(action)) {
                if (!this._transaction[action].length) {
                    continue; // nothing to do here
                }

                this[action](this._transaction[action]);
                this._transaction[action] = [];
            }
        }
    };

    Stylesheet.prototype.getFreeSpace = function () {
        return MAX_RULES - this._ruleCount;
    };

    Stylesheet.prototype._append = function (rule) {
        var i, len,
            contents = [];

        for (i = 0, len = rule.length; i < len; i++) {
            rule[i].start = this._nextIndex;
            contents.push(rule[i].content);
            rule[i].style = this;
            this._nextIndex += rule[i].length;
        }

        this._text(this._text() + contents.join(''));
    };

    Stylesheet.prototype._remove = function (rules) {
        var i, len,
            index = 0,
            slices = [],
            text = this._text();

        for (i = 0, len = rules.length; i < len; i++) {
            var rule = rules[i];
            var slice = text.substring(index, rule.start);

            slices.push(slice);
            index = slice.length + rule.length;
            this._nextIndex -= rule.length;
        }

        this._text(slices.join(''));
    };

    Stylesheet.prototype._text = function (text) {
        if ('undefined' === typeof text) {
            if (this._styleSheet.styleSheet) {
                return this._styleSheet.styleSheet.cssText;
            } else {
                return this._styleSheet.textContent;
            }
        }

        if (this._styleSheet.styleSheet) {
            this._styleSheet.styleSheet.cssText = text;
        } else {
            this._styleSheet.textContent = text;
        }
    };

    return Stylesheet;
});
