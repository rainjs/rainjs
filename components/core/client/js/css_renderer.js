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

define(['raintime/lib/promise', 'util'], function (Promise, util) {

    var defer = Promise.defer;

    /**
     *
     */
    var MAX_STYLESHEETS = 31;

    /**
     *
     */
    var MAX_RULES = 4095;

    /**
     *
     */
    function CssRenderer () {
        /**
         *  {
         *      'id;version': {
         *          cssFiles: {
         *              'path1': {
         *                  ruleCount: 5,
         *                  styleIndex: 0,
         *                  start: 34,
         *                  end: 156
         *              },
         *              'path2': {
         *                  ruleCount: 25,
         *                  styleIndex: 0,
         *                  start: 157,
         *                  end: 567
         *              }
         *          },
         *          instanceCount: 1
         *      }
         *  }
         */
        this._cssMap = {};

        /**
         *  [{
         *      id: 'style0',
         *      ruleCount: 4000,
         *      nextStartPoint: 0
         *  },
         *  null,
         *  {
         *      id: 'style1',
         *      ruleCount: 2500,
         *      nextStartPoint: 0
         *  }]
         */
        this._styleTags = [];
    }

    /**
     * component.css[0].ruleCount
     * component.css[0].path
     * component.css[0].media
     * component.id
     * component.version
     */
    CssRenderer.prototype.loadCss = function (component) {
        var deferred = defer(),
            self = this,
            fullId = this._getFullId(component.id, component.version);

        if(typeof this._cssMap[fullId] === 'undefined') {
            this._cssMap[fullId] = {
                cssFiles: {},
                instanceCount: 0
            };
        }

        var componentCss = this._cssMap[fullId];
        componentCss.instanceCount++;

        var newFiles = component.css.filter(function (elem) {
            return (typeof componentCss.cssFiles[elem.path] === 'undefined');
        });

        if (newFiles.length === 0) {
            util.defer(function () {
                deferred.resolve();
            });
            return deferred.promise;
        }

        this._getFiles(newFiles).then(function (cssTexts) {
            newFiles = newFiles.filter(function (elem) {
                return (typeof cssTexts[elem.path] !== 'undefined');
            });

            if (newFiles.length === 0) {
                deferred.resolve();
                return;
            }

            var cssObjects = [];

            for (var i = 0, len = newFiles.length; i < len; i++) {
                var css = cssTexts[newFiles[i].path];

                if (typeof newFiles[i].media !== 'undefined') {
                    css = self._addMedia(css, newFiles[i].media);
                }

                css = self._addComments(css, newFiles[i].path);

                cssObjects.push({
                    css: css,
                    ruleCount: newFiles[i].ruleCount
                });
            }

            try {
                var positions = self._insert(cssObjects);

                for (var i = 0, len = newFiles.length; i < len; i++) {
                    componentCss.cssFiles[newFiles[i].path] = {
                        ruleCount: newFiles[i].ruleCount,
                        styleIndex: positions[i].styleIndex,
                        start: positions[i].start,
                        end: positions[i].end
                    };
                }

                deferred.resolve();
            } catch (ex) {
                deferred.reject(ex);
            }
        });

        return deferred.promise;
    };

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
     * Inserts the received styles into the html and takes into account about the number of rules
     * in a style tag or the number of style tags and returns an array of css files with string
     * starting point in the specific tag and end point.
     *
     * @params {Object[]} cssObjects the array of css files to be inserted in the style tag
     * @returns {Object[]} the array of css files
     * @throws {RainError} if the maximum number of style tags and rules is reached
     */
    CssRenderer.prototype._insert = function (cssObjects) {
        var enhancedCSSObjects;
        if (this._styleTags.length === 0) {
            var styleId = 0;
            var object = {
                id: "style" + styleId,
                ruleCount: 0,
                nextStartPoint: 0
            };
            this._styleTags.push(object);
            enhancedCSSObjects = this._traceCss(cssObjects, styleId);
        } else if (this._styleTags.length < MAX_STYLESHEETS){
            enhancedCSSObjects = this._traceCss(cssObjects, parseInt(this._styleTags.length - 1, 10));
        } else {
            throw new RainError('Number of rules excedeed', [componentOpt.viewId],
                    RainError.ERROR_PRECONDITION_FAILED, 'no view');
        }
        this._append(enhancedCSSObjects);
        return enhancedCSSObjects;
    };

    /**
     * Breaks the number of files and takes into account how you could add the rules in
     * styles. If the maximum size is reached error is thrown.
     *
     * @param {Object[]} cssObjects the array of css files to be inserted in the style tag
     * @param {Integer} styleId the index in the _styleTag array
     * @returns {Object[]} the array of css files
     * @throws {RainError}
     */
    CssRenderer.prototype._traceCss = function (cssObjects, styleId){
        var sum = this._styleTags[styleId].ruleCount,
            object,
            start = this._styleTags[styleId].nextStartPoint,
            computedRules = 0;
        for(var i=0,length=cssObjects.length; i< length; i++) {
            computedRules += cssObjects[i].ruleCount;
        }


        if ((styleId == MAX_STYLESHEETS - 1) &&
                (this._styleTags[styleId].ruleCount + computedRules > MAX_RULES)){


            //TODO: _freeSpaceRevize();


            throw new RainError('Number of rules excedeed', [componentOpt.viewId],
                    RainError.ERROR_PRECONDITION_FAILED, 'no view');
        }


        for(var i = 0, length = cssObjects.length; i < length; i++) {
            if(sum + cssObjects[i].ruleCount <= MAX_RULES) {
                sum += cssObjects[i].ruleCount;
                this._styleTags[styleId].ruleCount = sum;
                cssObjects[i].styleIndex = styleId;
                cssObjects[i].start = start;
                cssObjects[i].end = start+cssObjects[i].css.length;
                start = cssObjects[i].end + 1;
                this._styleTags[styleId].nextStartPoint = start;
            }
            else if (this._styleTags.length < MAX_RULES-1){
                sum = 0;
                start = 0;
                styleId ++;
                object = {
                        id: "style"+styleId,
                        ruleCount: 0,
                        nextStartPoint: 0
                };
                this._styleTags.push(object);
                if(sum + cssObjects[i].ruleCount <= MAX_RULES) {
                    sum += cssObjects[i].ruleCount;
                    this._styleTags[styleId].ruleCount = sum;
                    cssObjects[i].styleIndex = styleId;
                    cssObjects[i].start = start;
                    cssObjects[i].end = start+cssObjects[i].css.length;
                    start += cssObjects[i].end + 1;
                }
            }
        }
        return cssObjects;
    };

    /**
     * The actual append in the html of the tags, the adding is done with the hole number of rules added
     * to the style tag with a specific id
     *
     * @param {Objects[]} CSSObjects the array of css files to be added in the style tag
     */
    CssRenderer.prototype._append = function(CSSObjects){
        if (CSSObjects.length === 0) {
            return;
        }

        var appendance = [],
            newTag=1,
            obj = {
                what: '',
                where: 'style'+CSSObjects[0].styleIndex
            };

        if (CSSObjects.length !== 0) {
            for(var i=0,length=CSSObjects.length; i< length; i++) {
                if (obj.where === 'style'+CSSObjects[i].styleIndex) {
                    obj.what += CSSObjects[i].css;
                }
                else {
                    appendance.push(obj);
                    newTag++;
                    obj.where = 'style'+CSSObjects[i].styleIndex;
                    obj.what = CSSObjects[i].css;
                }
            }
        }

        if (appendance.length !== newTag) {
            appendance.push(obj);
        }

        for(var i = 0, length = appendance.length; i < length; i++) {
            if(document.getElementById(appendance[i].where)) {
                var styleElement = document.getElementById(appendance[i].where);
                if(styleElement.styleSheet){
                    styleElement.styleSheet.cssText = styleElement.styleSheet.cssText + appendance[i].what;
                }
                else {
                    styleElement.appendChild(document.createTextNode(appendance[i].what));
                }
            }
            else{
                var head = document.getElementsByTagName('head')[0];
                var _style = document.createElement('style');
                _style.setAttribute('type', 'text/css');
                _style.setAttribute('id', appendance[i].where);
                if(_style.styleSheet) {
                    _style.styleSheet.cssText = appendance[i].what;
                }
                else {
                    _style.appendChild(document.createTextNode(appendance[i].what));
                }
                head.appendChild(_style);
            }
        }
    };

    CssRenderer.prototype.unloadCss = function (id, version) {
        var fullId = this._getFullId(id, version),
            componentCss = this._cssMap[fullId];

        componentCss.instanceCount--;

        if (componentCss.instanceCount === 0) {
            this._remove(componentCss.cssFiles);

            var updates = this._computeRemovalUpdates(componentCss);

            delete this._cssMap[fullId];

            for (id in this._cssMap) {
                if (this._cssMap.hasOwnProperty(id)) {
                    var cssFiles = this._cssMap[id].cssFiles;

                    for (var path in cssFiles) {
                        if (cssFiles.hasOwnProperty(path)) {
                            this._updateCssEntry(cssFiles[path], updates);
                        }
                    }
                }
            }
        }
    };

    CssRenderer.prototype._computeRemovalUpdates = function (componentCss) {
        var updates = {};

        for (var path in componentCss.cssFiles) {
            if (componentCss.cssFiles.hasOwnProperty(path)) {
                var cssEntry = componentCss.cssFiles[path];

                if (typeof updates[cssEntry.styleIndex] === 'undefined') {
                    updates[cssEntry.styleIndex] = [];
                }

                updates[cssEntry.styleIndex].push({
                    from: cssEntry.end + 1,
                    noChars: cssEntry.end - cssEntry.start + 1
                });
            }
        }

        return updates;
    };

    CssRenderer.prototype._updateCssEntry = function (cssEntry, updates) {
        var ranges = updates[cssEntry.styleIndex];
        if (!ranges) {
            return;
        }

        var i = 0,
            len = ranges.length,
            diff = 0;

        while (i < len && cssEntry.start >= ranges[i].from) {
            diff += ranges[i].noChars;
            i++;
        }

        cssEntry.start -= diff;
        cssEntry.end -= diff;
    };

    /**
     * Removes styles from the style tag with the specified id in the cssFiles and subtracts
     * the number of rules from the _styleTag array
     *
     * @param {Object[]} cssFiles the array of cssFiles to be removed from the style tag with
     * a specified id.
     */
    CssRenderer.prototype._remove = function (cssFiles) {
        var _removeCSS = [];
        var _objectToRemove = {
                where: '',
                start: [],
                end: [],
                ruleCountToDelete: 0,
                idOfStyleTag: 0
        };

        for (var i in cssFiles) {
            var styleIndex = cssFiles[i].styleIndex;
            if (styleIndex !== _objectToRemove.where) {
                _removeCSS.push(_objectToRemove);
                _objectToRemove.where = 'style'+cssFiles[i].styleIndex;
                _objectToRemove.start.push(cssFiles[i].start);
                _objectToRemove.end.push(cssFiles[i].end);
                _objectToRemove.ruleCountToDelete = cssFiles[i].ruleCount;
                _objectToRemove.idOfStyleTag = cssFiles[i].styleIndex;
            }
            else {
                _objectToRemove.ruleCountToDelete += cssFiles[i].ruleCount;
                var found = false;
                for (var j = 0,lenghtOfPositions = _objectToRemove.start.length;
                    j < lenghtOfPositions; j++) {
                    if (_objectToRemove.end[j]+1 === cssFiles[i].start) {
                        _objectToRemove.end[j] = cssFiles[i].end;
                        found = true;
                    }
                }
                if (!found) {
                    _objectToRemove.start.push(cssFiles[i].start);
                    _objectToRemove.end.push(cssFiles[i].end);
                }
            }
        }

        _removeCSS.push(_objectToRemove);
        _removeCSS = _removeCSS.slice(1);
        for (var i = 0, length = __removeCSS.length; i < length; i++) {
            var idOfStyleTag = _removeCSS[i].idOfStyleTag;
            this._styleTags[idOfStyleTag] -= _removeCSS[i].ruleCountToDelete;
            this._cleanUpStyle(_removeCSS[i]);
        }
        //TODO: if there are 0 left in the _styleTags we should clean that up (algorithm debate)

    };
    
    /**
     * CleanupStyle removes the rules passed to the function from the style tags
     * 
     * @param {Object} removeCSSObject the rules to be deleted from the style tag
     */
    CssRenderer.prototype._cleanUpStyle = function (removeCSSObject) {
        var _idOfStyleTag = removeCSSObject.where;
        var newCSSText;
        var _styleTag = document.getElementById(_idOfStyleTag);
        if(_styleTag.styleSheet){
            newCSSText = this._clean(_styleTag.styleSheet.cssText,
                                        removeCSSObject.start, removeCSSObject.end);
            _styleTag.styleSheet.cssText = newCSSText;
        }
        else {
            newCSSText = $(_styleTag).text();
            $(_styleTag).text(newCSSText);
        }
    };


    /**
     * Cleans the css from the style tag in the background and returns the cleaned up new set of rules
     * 
     * @param {String} css the text from the styleTag
     * @param {Integer[]} startArray
     * @param {Integer[]} endArray
     * @returns
     */
    CssRenderer.prototype._clean = function (css, startArray, endArray) {

        var _strips = [];
        //you push the first strip of the css
        _strips.push(css.substring(0,startArray[0]));
        for(var i=0,length = startArray.length; i < length; i++) {
                if( i+1 < length ) {
                    //if there are many start points and end points we push in the strips the in betweens
                    _strips.push(css.substring(endArray[i],startArray[i+1]));
                }
                else {
                    //if there are no more start end points in this csstext then go to the end of the file
                    _strips.push(css.substring(endArray[i]));
                }
        }
        css = _strips.join('');
        return css;
    };

    CssRenderer.prototype._getFullId = function (id, version) {
        return id + ';' + version;
    };

    CssRenderer.prototype._addMedia = function (css, media) {
        return '@media ' + media + ' {\n'
            + css
            + '\n}';
    };

    CssRenderer.prototype._addComments = function (css, path) {
        return '/* Start of file ' + path + ' */\n'
            + css
            + '\n/* End of file ' + path + ' */\n';
    };

    /**
     * The class instance.
     * @type {CssRenderer}
     */
    CssRenderer._instance = null;

    /**
     * Returns the class' singleton instance.
     * @returns {CssRenderer} the singleton instance
     */
    CssRenderer.get = function () {
        return CssRenderer._instance || (CssRenderer._instance = new CssRenderer());
    };

    return CssRenderer;
});
