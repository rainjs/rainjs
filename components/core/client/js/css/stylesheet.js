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
    /**
     * The maximum number of rules per stylesheet.
     *
     * @type Number
     * @constant
     */
    var MAX_RULES = 4095;

    /**
     * A representation of the style tags inside the document which allow for the easy addition and
     * manipulation of the rules inside of them.
     *
     * @param {Int} id the style Id
     *
     * @property {Integer} id the id of the stylesheet
     * @property {Integer} ruleCount the number of rules in the stylesheet
     *
     * @name Stylesheet
     * @constructor
     */
    function Stylesheet(id) {
        /**
         * The next index at which to write
         *
         * @type {Number}
         * @private
         */
        this._nextIndex = 0;

        /**
         * The number of rules inside the stylesheet
         *
         * @type {Number}
         * @private
         */
        this._ruleCount = 0;

        /**
         * An object containing the the rules inside this stylesheet mapped by start index to
         * ease bulk updates (such as start index update when removing something above)
         *
         * @type {Object}
         * @private
         */
        this._ruleMap = {};

        /**
         * The stylesheet dom element
         *
         * @type {DomElement}
         * @private
         */
        this._styleSheet = document.getElementById(id);

        /**
         * A queue of actions to be performed on the next write
         *
         * @type {Object}
         * @private
         */
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

    /**
     * Queue a rule to be added to the stylesheet
     *
     * @param {RuleSet} rule the rule to be added
     *
     * @returns {Boolean} true if the addition was succesfull false otherwise
     */
    Stylesheet.prototype.add = function (rule) {
        if ((this._ruleCount + rule.ruleCount) > MAX_RULES) {
            return false;
        }

        this._ruleCount += rule.ruleCount;
        this._transaction._append.push(rule);

        return true;
    };

    /**
     * Queue a rule to be removed from the stylesheet
     *
     * @param {RuleSet} rules the rule to delete
     */
    Stylesheet.prototype.remove = function (rules) {
        this._transaction._remove.push(rules);
    };

    /**
     * Write the queued modifications to the stylesheet
     */
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

    /**
     * Calculate the free space left inside the stylesheet
     *
     * @returns {Integer} the free space left inside the stylesheet
     */
    Stylesheet.prototype.getFreeSpace = function () {
        return MAX_RULES - this._ruleCount;
    };

    /**
     * Append some rules to the stylesheet
     *
     * @param {RuleSet[]} rule the rules to be appended
     * @private
     */
    Stylesheet.prototype._append = function (rules) {
        var i, len,
            contents = [];

        for (i = 0, len = rules.length; i < len; i++) {
            rules[i].start = this._nextIndex;
            this._ruleMap[this._nextIndex] = rules[i];

            contents.push(rules[i].content);
            rules[i].style = this;
            this._nextIndex += rules[i].length;
        }

        this._text(this._text() + contents.join(''));
    };

    /**
     * Remove rules from the stylesheet
     *
     * @param {RuleSet[]} rules the rules to remove
     * @private
     */
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

            for (var idx in this._ruleMap) {
                if (this._ruleMap.hasOwnProperty(idx)) {
                    if (this._ruleMap[idx] > rule.start) {
                        var newIndex = this._ruleMap[idx] -rule.length;
                        this.ruleMap[idx].start = newIndex;
                        this._ruleMap[newIndex] = this._ruleMap[idx];
                        delete this._ruleMap[idx];
                    }
                }
            }
        }

        this._text(slices.join(''));
    };

    /**
     * Read/Write content to the stylesheet
     *
     * @param {String} text the content to be written
     * @private
     */
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
