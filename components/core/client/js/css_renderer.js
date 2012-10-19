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

define(['raintime/lib/promise'], function (Promise) {

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
         *                  noRules: 5,
         *                  styleIndex: 0,
         *                  start: 34,
         *                  end: 156
         *              },
         *              'path2': {
         *                  noRules: 25,
         *                  styleIndex: 0,
         *                  start: 157,
         *                  end: 567
         *              }
         *          },
         *          noInstances: 1
         *      }
         *  }
         */
        this._cssMap = {};

        /**
         *  [{
         *      id: 'style0',
         *      noRules: 4000
         *  },
         *  {
         *      id: 'style1',
         *      noRules: 2500
         *  }]
         */
        this._styleTags = [];
    }

    /**
     * component.css[0].noRules
     * component.css[0].path
     * component.id
     * component.version
     */
    CssRenderer.prototype.loadCSS = function (component) {
        var deferred = defer(),
            fullId = this._getFullId(component);

        if(typeof this._cssMap[fullId] === 'undefined') {
            this._cssMap[fullId] = {
                cssFiles: {},
                noInstances: 0
            };
        }

        var componentCSS = this._cssMap[fullId];
        componentCSS.noInstances++;


        var dependencies = component.css.map(function (elem) {
            return 'text!' + elem.path;
        });

        require(dependencies, function () {
            for (var i = 0, len = arguments.length; i < len; i++) {
                var pos = this._insert(arguments[i], component.css[i].noRules);

                componentCSS.cssFiles[component.css[i].path] = {
                    noRules: component.css[i].noRules,
                    styleIndex: pos.styleIndex,
                    start: pos.start,
                    end: pos.end
                };
            }
        });

        return deferred.promise;
    };

    
    /**
     * Breaks the number of files and takes into account how you could add the rules in 
     * styles, if the maximum size is reached error is thrown
     * 
     * @paramse [{css:<text>, noRules:<Integer>}], styleId:<Integer> 
     * @returns [{css:<text>, noRules:0, styleIndex: 0, start: 0, end: 0 }]
     * @throws {RainError}
     */
    function traceCss(cssObjects, styleId){
        var sum = this._styleTags[styleId].noRules,
            object,
            start = 0,
            computeRules = 0;

        for (var i in cssObjects)
            computeRules + cssObjects[i].noRules;

        if ((styleId == 30) && 
                (this._styleTags[styleId].noRules + computedRules > 4095)){
            throw new RainError('Number of rules excedeed', [componentOpt.viewId],
                    RainError.ERROR_PRECONDITION_FAILED, 'no view');
            return ;
        }

        for(var i in cssObject) {
            if(sum + cssObjects[i].noRules <= MAX_RULES) {
                sum += cssObjects[i].noRules;
                this._styleTags[styleId].noRules = sum;
                cssObjects[i].styleIndex = 'style'+styleId;
                cssObjects[i].start = start;
                cssObjects[i].end = start+cssObjects[i].css.length;
                start += cssObjects[i].end + 1;
            }
            else {
                sum = 0;
                start = 0;
                styleId ++;
                object = {
                        id: "style"+styleId,
                        noRules: 0
                };
                this._styleTags.push(object);
                if(sum + cssObjects[i].noRules <= MAX_RULES) {
                    sum += cssObjects[i].noRules;
                    this._styleTags[styleId].noRules = sum;
                    cssObjects[i].styleIndex = 'style'+styleId;
                    cssObjects[i].start = start;
                    cssObjects[i].end = start+cssObjects[i].css.length;
                    start += cssObjects[i].end + 1;
                }
            }
        }
        return cssObjects;
    }


    /**
     * Inserts the recived styles into the html and takes into account about the number of rules
     * in a <style> tag or the number of <style> tags
     * 
     * @paramse [{css:<text>, noRules:<Integer>}]
     * @returns [{css:<text>, noRules:0, styleIndex: 0, start: 0, end: 0 }]
     * @throws {RainError}
     */
    
    CssRenderer.prototype._insert = function (cssObjects) {
        var returnCSSObjects;
        if (this._styleTags.length === 0) {
            var styleId = 0,
                object = {
                    id: "style"+styleId,
                    noRules: 0
                };
            this._styleTags.push(object);
            returnCSSObjects = traceCss(cssObjects, styleId);
        }
        else if (this._styleTags.length<=30){
            returnCSSObjects = traceCss(cssObjects, this._styleTags[this._styleTags.length]);
        }
        else {
            throw new RainError('Number of rules excedeed', [componentOpt.viewId],
                    RainError.ERROR_PRECONDITION_FAILED, 'no view');
            return;
        }
        _append(returnCSSObjects);
        return returnCSSObjects;  
    };

    /**
     * The actual append in the html of the tags, the adding is done with the hole number of rules added
     * to the <style> tag with a specific id
     * 
     * @params [{css:<text>, noRules: <Integer>, styleIndex: <Integer>, start: <Integer>, end: <Integer> }]
     */
    function _append(CSSObjects){
        var obj = {
                what: '',
                where: CSSObjects[0].styleIndex
            },
            appendance = [],
            newTag=0;

        for(var i in CSSObjects) {
            if (obj.where === CSSObjects[i].styleIndex)
                obj.what += CSSObjects[i].css;
            else {
                appendance.push(obj);
                newTag++;
                obj.where = CSSObjects[i].styleIndex;
                obj.what = CSSObjects[i].css;
            }
        }
        if (appendance.length !== newTag)
            appendance.push(obj);

        for(var i in appendance)
            if( $('#'+appendance[i].where).length !== 0)
                $('#'+appendance[i].where).html($('#'+appendance[i].where).html()+appendance[i].what);
            else{
                _style = document.createElement('style');
                $(_style).html(appendance[i].css);
                $(_style).attr('id', appendance[i].where);
                $('head').append(_style);
            }
    };


    CssRenderer.prototype._getFullId = function (component) {
        return component.id + ';' + component.version;
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