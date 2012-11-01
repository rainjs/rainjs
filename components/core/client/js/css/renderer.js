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

define(function (require, module, exports) {
    var util = require('util');
    var Promise = require('raintime/lib/promise');
    var defer = Promise.defer;

    var StyleRegistry = require('raintime/css/registry');
    var registry = StyleRegistry.get();

    function CssRenderer() {}

    CssRenderer.prototype.load = function (component) {
        var deferred = defer(),
            self = this,
            css = {},
            componentId = this._getFullId(component.id, component.version),
            newFiles = registry.getNewFiles(componentId, component.css);

        if (0 === newFiles.length) {
            util.defer(function () {
                deferred.resolve();
            });
        } else {
            this._getFiles(newFiles).then(function (contents) {
                newFiles = newFiles.filter(function (file) {
                    return ('undefined' !== typeof contents[file.path]);
                });

                if (0 === newFiles.length) {
                    deferred.resolve();
                    return;
                }

                for (var i = 0, len = newFiles.length; i < len; i++) {
                    var content =  self._decorate(contents[newFiles[i].path], newFiles[i].path, newFiles[i].media);
                    css[newFiles[i].path] = {
                        length: content.length,
                        ruleCount: newFiles[i].ruleCount,
                        content: content
                    };

                    registry.register(componentId, css);
                }
                registry.save();
                deferred.resolve();
            });
        }

        return deferred.promise;
    };

    CssRenderer.prototype.unload = function (component) {
        var componentId = this._getFullId(component.id, component.version);
        registry.deregister(componentId);
        registry.save();
    };

    CssRenderer.prototype._decorate = function (text, path, media) {
        text = [
            '/* Start of file ' + path + ' */',
            text,
            '/* End of file ' + path + ' */\n\n'
        ].join('\n');

        if ('undefined' !== typeof media) {
            text = [
                '@media ' + media + ' {',
                text,
                '}'
            ].join('\n');
        }
        return text;
    };

    /**
     * Requests the CSS files using AJAX. Empty responses are ignored (this indicates that a 404
     * error occurred; the browser notifies the user about these errors so no special handling is
     * required here). This method returns the content of the CSS files in the following format::
     *
     *      {
     *          '/example/3.0/css/index.css': 'css text',
     *          '/example/3.0/css/accordion.css': 'css text'
     *      }
     *
     * @param Object[] cssFiles the files to be requested
     * @returns {Promise} a promise that is resolved when all the get requests finished
     */
    CssRenderer.prototype._getFiles = function (cssFiles) {
        var deferred = defer(),
            cssTexts = {},
            count = 0,
            len = cssFiles.length;

        cssFiles.forEach(function (cssFile) {
            var path = cssFile.path;
            $.get(path).complete(function (xhr) {
                var text = xhr.responseText;
                if (text) {
                    cssTexts[path] = text;
                }
                count++;
                if (count === len) {
                    deferred.resolve(cssTexts);
                }
            });
        });

        return deferred.promise;
    };

    /**
     * Gets the complete component identifier.
     *
     * @param {String} id the componenet id
     * @param {String} version the component version
     * @returns {String} the complete identifier
     */
    CssRenderer.prototype._getFullId = function (id, version) {
        return id + ';' + version;
    };

    /**
     * The class instance.
     * @type {CssRenderer}
     */
    CssRenderer._instance = null;

    /**
     * Returns the singleton instance.
     * @returns {CssRenderer} the singleton instance
     */
    CssRenderer.get = function () {
        return CssRenderer._instance || (CssRenderer._instance = new CssRenderer());
    };

    return CssRenderer;
});
