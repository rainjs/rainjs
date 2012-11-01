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
    var MAX_STYLES = 2;

    function CssRegistry() {
        this.components = {};
        this.stylesheets = [];
        this.unsavedStyles = [];
        this.currentSheet = 0;
    }

    CssRegistry.prototype.register = function (component, css, file, rule) {
        if (!this.components[component]) {
            this.components[component] = {
                instanceCount: 0,
                files: {}
            };
        }

        this.components[component].instanceCount++;

        this._insert(component, css);
    };

    CssRegistry.prototype.deregister = function (component) {
        this.components[component].instanceCount--;

        if (this.components[component].instanceCount === 0) {
            this._remove(component);
        }
    };

    CssRegistry.prototype.getNewFiles = function (component, files) {
        var self = this;
        return files.filter(function (file) {
            return (!self.components[component] || 'undefined' === typeof self.components[component].files[file.path]);
        });
    };

    CssRegistry.prototype.save = function () {
        for (var i = 0, len = this.unsavedStyles.length; i < len; i++) {
            var index = this.unsavedStyles[i];
            this.stylesheets[index].write();
        }
    };

    CssRegistry.prototype._insert = function (component, css) {
        if (this.stylesheets.length >= MAX_STYLES) {
            this._collectWhitespace();

            if (this.stylesheets.indexOf(this.currentSheet) === (this.stylesheets.length -1)) {
                logger.error('Style Registry: the maximum number of stylesheets has been reached.');
                return;
            }
        }

        var currentSheet = this.stylesheets[this.currentSheet];
        if (!currentSheet) {
            currentSheet = this.stylesheets[this.currentSheet] = new Stylesheet(this.currentSheet);
        }

        for (var file in css) {
            if (css.hasOwnProperty(file)) {
                if (!this.components[component].files[file]) {
                    var rule = new RuleSet(css[file]);
                    this.components[component].files[file] = rule;

                    if (!currentSheet.add(rule)) {
                        this.curentSheet++;
                        this._insert(rule);
                    } else {
                        this.unsavedStyles.push(this.currentSheet);
                    }
                }
            }
        }
    };

    CssRegistry.prototype._remove = function (component) {
        for (var file in this.components[component].files) {
            if (this.components[component].files.hasOwnProperty(file)) {
                var rule = this.components[component].files[file];
                rule.style.remove(rule);

                if (this.unsavedStyles.indexOf(rule.style.id) === -1) {
                    this.unsavedStyles.push(rule.style.id);
                }
            }
        }

        this.components[component] = void 0;
    };

    CssRegistry.prototype._collectWhitespace = function () {
        for (var i = 0, len = this.stylesheets.length; i < len; i++) {
            var style = this.stylesheets[i];

            var rules = this._getRulesWithin(style.getFreeSpace());

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
            this.currentSheet = style.id;
        }
    };

    CssRegistry.prototype._getRulesWithin = function (count) {
        var left = count,
            rules = [];

        for (var componentId in this.components) {
            if(this.components.hasOwnProperty(componentId)) {
                var component = this.components[componentId];

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
