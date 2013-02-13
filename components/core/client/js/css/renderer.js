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

define(['raintime/lib/util',
        'raintime/lib/promise',
        'raintime/css/registry'
], function (util, Promise, StyleRegistry) {

    var defer = Promise.defer;
    var processing = {
            "path": ''
    };

    /**
     * Handles inserting and removing CSS into the page. The CSS is requested using AJAX and
     * the received CSS text is added to style tags with no more than 4095 rules. The maximum
     * number of stylesheets is 31. This is due to the limitations introduced by Internet
     * Explorer 8 and Internet Explorer 9 browsers.
     *
     * @name CssRenderer
     * @class
     * @constructor
     */
    function CssRenderer() {
        this._registry = StyleRegistry.get();
    }

    /**
     * Requests the CSS files for the specified component and inserts the CSS into the page. The
     * promise returned by this method is rejected when there is not enough space to insert
     * the CSS in the page.
     *
     * @param {Object} component the component for which to load the CSS. This is the object sent by the server when a component is rendered.
     * @returns {Promise} indicates when the loading of the CSS finished.
     */
    CssRenderer.prototype.load = function (component) {
        var deferred = defer(),
            self = this,
            css = [],
            componentId = this._getFullId(component.id, component.version),
            newFiles = this._registry.getNewFiles(componentId, component.css);

        this._getFiles(newFiles).then(function (contents) {
            for (var i = 0, len = newFiles.length; i < len; i++) {
                if(processing.path !== newFiles[i].path) { 
                    var file = newFiles[i];
                    processing.path = newFiles[i].path;
                    if (!contents[file.path]) {
                        continue;
                    }

                    var content = self._decorate(contents[file.path],
                                                 file.path,
                                                 file.media);

                    css.push({
                        path: file.path,
                        ruleCount: file.ruleCount,
                        content: content
                    });
                }
            }

            if (!self._registry.register(componentId, css)) {
                deferred.reject();
                return;
            }

            deferred.resolve();
        });

        processing.path = undefined;

        return deferred.promise;
    };

    /**
     * Removes the CSS from the page if the number of instances for the specified component
     * reaches 0.
     *
     * @param {Object} component the component for which to unload the CSS.
     */
    CssRenderer.prototype.unload = function (component) {
        var componentId = this._getFullId(component.id, component.version);
        this._registry.unregister(componentId);
    };

    /**
     * Decorate the CSS content with start and end of file comments and @media infoormation
     *
     * @param {String} text the CSS content
     * @param {String} path the path to the file containing the CSS data
     * @param {String} media @media rule content for this file
     *
     * @returns {String} the decorated CSS data
     */
    CssRenderer.prototype._decorate = function (text, path, media) {
        if ('undefined' !== typeof media) {
            text = [
                '@media ' + media + ' {',
                text,
                '}'
            ].join('\n');
        }

        text = [
            '/* Start of file ' + path + ' */',
            text,
            '/* End of file ' + path + ' */\n\n'
        ].join('\n');

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
     * @param {Object[]} cssFiles the files to be requested
     * @returns {Promise} a promise that is resolved when all the get requests finished
     */
    CssRenderer.prototype._getFiles = function (cssFiles) {
        var deferred = defer(),
            cssTexts = {},
            count = 0,
            len = cssFiles.length;

        if (len === 0) {
            util.defer(function () {
                deferred.resolve(cssTexts);
            });
        } else {
            cssFiles.forEach(function (cssFile) {
                var path = cssFile.path;
                $.get(path).complete(function (xhr) {
                    var text = xhr.responseText;
                    if (text && xhr.status < 400) {
                        cssTexts[path] = text;
                    }
                    count++;
                    if (count === len) {
                        deferred.resolve(cssTexts);
                    }
                });
            });
        }

        return deferred.promise;
    };

    /**
     * Gets the complete component identifier.
     *
     * @param {String} id the component id
     * @param {String} version the component version
     * @returns {String} the complete identifier
     */
    CssRenderer.prototype._getFullId = function (id, version) {
        return id + ';' + version;
    };

    /**
     * The class instance.
     *
     * @type {CssRenderer}
     */
    CssRenderer._instance = null;

    /**
     * Returns the singleton instance.
     *
     * @returns {CssRenderer} the singleton instance
     */
    CssRenderer.get = function () {
        return CssRenderer._instance || (CssRenderer._instance = new CssRenderer());
    };

    return CssRenderer;
});
