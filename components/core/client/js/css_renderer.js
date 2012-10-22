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
         *      noRules: 4000,
         *      nextStartPoint: 0
         *  },
         *  {
         *      id: 'style1',
         *      noRules: 2500,
         *      nextStartPoint: 0
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
    CssRenderer.prototype.loadCss = function (component) {
        var deferred = defer(),
            self = this,
            fullId = this._getFullId(component.id, component.version);

        if(typeof this._cssMap[fullId] === 'undefined') {
            this._cssMap[fullId] = {
                cssFiles: {},
                noInstances: 0
            };
        }

        var componentCss = this._cssMap[fullId];
        componentCss.noInstances++;


        var newFiles = component.css.filter(function (elem) {
            return (typeof componentCss.cssFiles[elem.path] === 'undefined');
        });
        var dependencies = newFiles.map(function (elem) {
            return 'text!' + elem.path;
        });

        // CSS media queries
        // handle not found dependencies

        require(dependencies, function () {
            var cssObjects = [];
            for (var i = 0, len = arguments.length; i < len; i++) {
                var css = self._addComments(arguments[i], newFiles[i].path);
                cssObjects.push({
                    css: css,
                    noRules: newFiles[i].noRules
                });
            }

            try {
                var positions = self._insert(cssObjects);
                console.log('am apelat insertul');

                for (var i = 0, len = newFiles.length; i < len; i++) {
                    componentCss.cssFiles[newFiles[i].path] = {
                        noRules: newFiles[i].noRules,
                        styleIndex: positions[i].styleIndex,
                        start: positions[i].start,
                        end: positions[i].end
                    };
                }

                setTimeout(function () {deferred.resolve()}, 500);
            } catch (ex) {
                deferred.reject(ex);
            }
        });

        return deferred.promise;
    };



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
        console.log(cssObjects);
        if (this._styleTags.length === 0) {
            var styleId = 0;
                var object = {
                    id: "style"+styleId,
                    noRules: 0,
                    nextStartPoint: 0
                };
            this._styleTags.push(object);
            returnCSSObjects = this._traceCss(cssObjects, styleId);
            console.log(returnCSSObjects);
        }
        else if (this._styleTags.length<=30){
            console.log('ok');
            console.log(this._styleTags.length-1);
            returnCSSObjects = this._traceCss(cssObjects, parseInt(this._styleTags.length-1,10));
            
        }
        else {
            throw new RainError('Number of rules excedeed', [componentOpt.viewId],
                    RainError.ERROR_PRECONDITION_FAILED, 'no view');
            return;
        }
        this._append(returnCSSObjects);
        return returnCSSObjects;
    };


    /**
     * Breaks the number of files and takes into account how you could add the rules in
     * styles, if the maximum size is reached error is thrown
     *
     * @paramse [{css:<text>, noRules:<Integer>}], styleId:<Integer>
     * @returns [{css:<text>, noRules:0, styleIndex: 0, start: 0, end: 0 }]
     * @throws {RainError}
     */
    CssRenderer.prototype._traceCss = function (cssObjects, styleId){
        var sum = this._styleTags[styleId].noRules,
            object,
            start = this._styleTags[styleId].nextStartPoint,
            computedRules = 0;
        console.log("start---->",start);
        for (var i in cssObjects) {
            computedRules += cssObjects[i].noRules;
            //console.log(cssObjects[i].noRules);
        }
        

        if ((styleId == 30) &&
                (this._styleTags[styleId].noRules + computedRules > 4095)){
            throw new RainError('Number of rules excedeed', [componentOpt.viewId],
                    RainError.ERROR_PRECONDITION_FAILED, 'no view');
            return ;
        }
        
        for(var i in cssObjects) {
            if(sum + cssObjects[i].noRules <= MAX_RULES) {
                console.log('am mai putine reguli');
                sum += cssObjects[i].noRules;
                console.log('numarul de reguli--->',sum);
                this._styleTags[styleId].noRules = sum;
                console.log('numar regulin din ',styleId,' este ',this._styleTags[styleId].noRules);
                cssObjects[i].styleIndex = 'style'+styleId;
                console.log('am setat pe cssObjectul primit indexul ',cssObjects[i].styleIndex);
                cssObjects[i].start = start;
                console.log('stringul de inceput pentru cssObject ',cssObjects[i].start);
                console.log('startul --->',start);
                console.log('lengthul cssului --->',cssObjects[i].css.length);
                cssObjects[i].end = start+cssObjects[i].css.length;
                console.log('stringul de final pentru cssObject ',cssObjects[i].end);
                start = cssObjects[i].end + 1;
                console.log('noul start --->',start);
                this._styleTags[styleId].nextStartPoint = start;
                console.log('nextStartPointul meu din ',styleId,' --->',this._styleTags[styleId].nextStartPoint);
            }
            else {
                console.log('niciodata');
                sum = 0;
                start = 0;
                styleId ++;
                object = {
                        id: "style"+styleId,
                        noRules: 0,
                        nextStartPoint: 0
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
     * The actual append in the html of the tags, the adding is done with the hole number of rules added
     * to the <style> tag with a specific id
     *
     * @params [{css:<text>, noRules: <Integer>, styleIndex: <Integer>, start: <Integer>, end: <Integer> }]
     */
    CssRenderer.prototype._append = function(CSSObjects){
        //console.log('appending object',CSSObjects);
        if (CSSObjects.length === 0) return;
        var obj = {
                what: '',
                where: CSSObjects[0].styleIndex
            },
            appendance = [],
            newTag=1;
        console.log(CSSObjects.length);
        if (CSSObjects.length!=0) {
            for(var i in CSSObjects) {
                if (obj.where === CSSObjects[i].styleIndex) {
                    console.log('am gasit un identificator de appenduit');
                    obj.what += CSSObjects[i].css;
                }
                else {
                    console.log('what');
                    appendance.push(obj);
                    newTag++;
                    obj.where = CSSObjects[i].styleIndex;
                    obj.what = CSSObjects[i].css;
                }
            }
        }   
        if (appendance.length !== newTag)
                appendance.push(obj);
        
        console.log(appendance);
        for(var i in appendance)
            if( $('#'+appendance[i].where).length !== 0)
                $('#'+appendance[i].where).text($('#'+appendance[i].where).text()+appendance[i].what);
            else{
                console.log('hei');
                var _style = document.createElement('style');
                $(_style).text(appendance[i].what);
                $(_style).attr('id', appendance[i].where);
                //console.log(_style);
                $('head').append(_style);
            }
    };

    CssRenderer.prototype.unloadCss = function (id, version) {
        var fullId = this._getFullId(id, version);
    };

    /**
     *
     * @param {String} fullId identifies the component by concatenating id and version
     */
    CssRenderer.prototype._remove = function (fullId) {

    };

    CssRenderer.prototype._getFullId = function (id, version) {
        return id + ';' + version;
    };

    CssRenderer.prototype._addComments = function (css, path) {
        return '/* Start of file ' + path + ' */\n'
            + css
            + '\n/* End of file ' + path + ' */';
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
