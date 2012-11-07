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

define(['raintime/css/stylesheet', 'raintime/css/rule_set'], function (Stylesheet, RuleSet, logger) {
    var MAX_STYLES = 31;

    /**
     * Manages the stylesheets inside the page keeping track of where each CSS file is and
     * cleaning up the remaining whitespace when necessary.
     *
     * @name CssRegistry
     * @constructor
     */
    function CssRegistry() {
        /**
         * A map that stores the CSS files loaded for each component and the number of instances added
         * to the page for each component. The following example shows how the data is stored in this object::
         *
         *      {
         *          'example;3.0': {
         *              cssFiles: {
         *                  '/example/3.0/css/index.css': new RuleSet,
         *                  '/example/3.0/css/accordion.css': new RuleSet()
         *              },
         *              instanceCount: 1
         *          }
         *      }
         *
         * @type {Object}
         * @private
         */
        this._components = {};

        /**
         * An array containing all the stylesheets loaded inside the page
         *
         * @type {Stylesheet[]}
         * @private
         */
        this._stylesheets = [];

        /**
         * An array containing the indexes of the stylesheets that need to be saved
         *
         * @type {Integer[]}
         * @private
         */
        this._unsavedSheets = [];

        /**
         * A pointer to the current active stylesheet (the one to which the next css to arive will be written)
         *
         * @type {Number}
         * @private
         */
        this._currentSheetIndex = 0;
    }

    /**
     * Register the css of a component to the registry
     *
     * @param {String} component the component id for which to register the css
     * @param {Object} css a CSS data object containing all the information required to create the rules
     *
     * @returns {Boolean} weather the insert was successfull or not
     */
    CssRegistry.prototype.register = function (component, css) {
        if (!this._components[component]) {
            this._components[component] = {
                instanceCount: 0,
                files: {}
            };
        }

        this._components[component].instanceCount++;

        return this._insert(component, css);
    };

    /**
     * Unregister a component from the registry
     *
     * @param {String} component the component id for which to unregister the css
     */
    CssRegistry.prototype.unregister = function (component) {
        this._components[component].instanceCount--;

        if (this._components[component].instanceCount === 0) {
            this._remove(component);
        }
    };

    /**
     * Filters a list of CSS files for a specific component and returns the files that don't exist
     * inside the registry
     *
     * @param {String} component the component id to which the files belong
     * @param {Array} files an array containing the file descriptor
     *
     * @returns {Array} an array of files that are not loaded
     */
    CssRegistry.prototype.getNewFiles = function (component, files) {
        var self = this;
        return files.filter(function (file) {
            return (!self._components[component] || 'undefined' === typeof self._components[component].files[file.path]);
        });
    };

    /**
     * Save the changes to the stylesheets
     */
    CssRegistry.prototype.save = function () {
        for (var i = 0, len = this._unsavedSheets.length; i < len; i++) {
            var index = this._unsavedSheets[i];
            this._stylesheets[index].write();
        }
    };

    /**
     * Queue a css object to be inserted inside the stylesheets
     *
     * @param {String} component the component id to which the CSS belongs
     * @param {Object} css the CSS data
     *
     * @returns {Boolean} weather the operation was successful
     * @private
     */
    CssRegistry.prototype._insert = function (component, css) {
        if (this._currentSheetIndex === MAX_STYLES) {
            this._collectWhitespace();

            if (this._currentSheetIndex === MAX_STYLES) {
                //logger.error('Style Registry: the maximum number of stylesheets has been reached.');
                console.log('fin');
                return false;
            }
        }
        var currentSheet = this._stylesheets[this._currentSheetIndex];
        if (!currentSheet) {
            currentSheet = this._stylesheets[this._currentSheetIndex] = new Stylesheet(this._currentSheetIndex);
        }

        for (var file in css) {
            if (css.hasOwnProperty(file)) {
                if ('undefined' === typeof this._components[component].files[file]) {
                    var rule = new RuleSet(css[file]);

                    if (!currentSheet.add(rule, component, file)) {
                        this._currentSheetIndex++; 
                        return this._insert(component, css);
                    } else {
                        this._unsavedSheets.push(this._currentSheetIndex);
                        this._components[component].files[file] = rule;
                    }
                }
            }
        }

        return true;
    };

    /**
     * Queue a component to have it's CSS files removed from the stylesheets
     *
     * @param {String} component the component id for which to remove the files
     * @private
     */
    CssRegistry.prototype._remove = function (component) {
        for (var file in this._components[component].files) {
            if (this._components[component].files.hasOwnProperty(file)) {
                var rule = this._components[component].files[file];
                rule.style.remove(rule);

                if (this._unsavedSheets.indexOf(rule.style.id) === -1) {
                    this._unsavedSheets.push(rule.style.id);
                }
            }
        }

        this._components[component] = void 0;
    };

    /**
     * Sweep the existing stylesheets and fill up the free whitespace by moving the rules to the first
     * empty stylesheet.
     *
     * @private
     */
    CssRegistry.prototype._collectWhitespace = function () {
        for (var i = 0, len = this._stylesheets.length; i < len; i++) {
            var style = this._stylesheets[i];

            var rules = this._getRulesWithin(style.getFreeSpace());
            console.log(rules);

            if (rules.length === 0) {
                continue;
            }

            for (var j = 0, l = rules.length; j < l; j++) {
                var rule = rules[j];

                if (rule.style.id === style.id) {
                    continue;
                }

                rule.style.remove(rule);
                style.add(rule);
            }

            style.write();
            //console.log(style.id);
            this._currentSheetIndex = style.id;
        }
    };

    /**
     * Get the files that would fit inside a stylesheet.
     *
     * @param {Integer} count the available space inside the stylesheet
     *
     * @returns {RuleSet[]} an array containing the RuleSets that fit inside the stylesheet
     */
    CssRegistry.prototype._getRulesWithin = function (count) {
        var left = count,
            rules = [];

        for (var componentId in this._components) {
            if(this._components.hasOwnProperty(componentId)) {
                var component = this._components[componentId];

                for (var path in component.files) {
                    if (component.files.hasOwnProperty(path)) {
                        var rule = component.files[path];

                        if ((left - rule.ruleCount) < 0) {
                            break;
                        }

                        left = left - rule.ruleCount;
                        rules.push(rule);
                    }
                }
            }
        }

        return rules;
    };

    /**
     * The class instance.
     * @type {CssRenderer}
     */
    CssRegistry._instance = null;

    /**
     * Returns the singleton instance.
     * @returns {CssRenderer} the singleton instance
     */
    CssRegistry.get = function () {
        return CssRegistry._instance || (CssRegistry._instance = new CssRegistry());
    };


    return CssRegistry;
});
