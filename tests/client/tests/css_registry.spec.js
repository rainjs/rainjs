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

describe ('registry API', function (){
    var component,
        adding,
        css,
        file;
    beforeEach(function () {
        component = "style0";
        adding = 0;
        css = [{ path: 'path1',
                ruleCount: 1,
                content: '.rule1{}',
                },
               { path: 'path2',
                 ruleCount: 1,
                 content: '.rule2{}',
                }];
        file = [{path: 'path1'},{path: 'path2'}];
    });

    describe('register method', function () {

        it('should add to the current styleSheet',
                                ['raintime/css/registry', 'raintime/css/stylesheet',
                                 'raintime/css/rule_set'], function(Registry, StyleSheet, RuleSet){

            var fakeRegistry = new Registry(),
                rules = new RuleSet(css);

            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();

            StyleSheet.prototype.add.andCallFake(function (rule) {
                return true;
            });

            fakeRegistry.register(component, css);

            expect(fakeRegistry.register).toHaveBeenCalledWith(component, css);
            expect(fakeRegistry._currentSheetIndex).toEqual(0);
            expect(fakeRegistry._unsavedSheets.length).toEqual(1);
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rules);
            expect(StyleSheet.prototype.add.calls.length).toEqual(2);

        });

        it ('should generate another styletag if the actual styletag is full',
                                        ['raintime/css/registry', 'raintime/css/stylesheet',
                                         'raintime/css/rule_set'],function(Registry, StyleSheet, RuleSet){

            var fakeRegistry = new Registry(),
                rules = new RuleSet(css);

            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();

            StyleSheet.prototype.add.andCallFake(function (rule) {
                if(adding === 0) {
                    adding++;
                    return true;
                }else if (adding === 1){
                    adding++;
                    return false;
                }else {
                    return true;
                }
            });

            fakeRegistry.register(component, css);

            expect(fakeRegistry.register).toHaveBeenCalledWith(component, css);
            expect(fakeRegistry._currentSheetIndex).toEqual(1);
            expect(fakeRegistry._unsavedSheets.length).toEqual(2);
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rules);
            expect(StyleSheet.prototype.add.calls.length).toEqual(3);
            expect(adding).toEqual(2);
        });

        it ('should generate an error message if the max style tags is reached',
                                    ['raintime/css/registry', 'raintime/css/stylesheet',
                                     'raintime/css/rule_set'],function (Registry, StyleSheet, RuleSet){

            var fakeRegistry = new Registry(),
                rules = new RuleSet(css),
                success;

            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            Registry.prototype._getRulesWithin.andCallThrough();
            Registry.prototype._collectWhitespace.andCallThrough();
            StyleSheet.prototype.getRulesWithin.andReturn([]);
            StyleSheet.prototype.getFreeSpace.andReturn(0);

            StyleSheet.prototype.add.andCallFake(function (rule, css, file) {
                    adding++;
                    return false;
            });

            success = fakeRegistry.register(component, css);

            expect(fakeRegistry.register).toHaveBeenCalledWith(component,css);
            expect(fakeRegistry._currentSheetIndex).toEqual(31);
            expect(success).toBe(false);
        });
    });


    describe("unregister method", function(){

        it("should remove a css",  ['raintime/css/registry', 'raintime/css/stylesheet',
                                    'raintime/css/rule_set'], function(Registry, StyleSheet, RuleSet){

            var removed = false,
                fakeRegistry = new Registry();

            Registry.prototype.register.andCallThrough();
            Registry.prototype._save.andCallThrough();
            Registry.prototype.unregister.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            Registry.prototype._remove.andCallThrough();

            StyleSheet.prototype.add.andCallThrough();
            StyleSheet.prototype.write.andCallThrough();
            StyleSheet.prototype._append.andCallThrough();
            StyleSheet.prototype.remove.andCallThrough();

            StyleSheet.prototype.remove.andCallFake(function (rule) {
                removed = true;
            });

            fakeRegistry.register(component, css);
            fakeRegistry.unregister(component);

            expect(removed).toBe(true);
        });
    });


    describe ("get new files method", function () {

        it("should return an empty array if ther aren't new files",  
                            ['raintime/css/registry', 'raintime/css/stylesheet',
                             'raintime/css/rule_set'], function(Registry, StyleSheet, RuleSet){

            var resp,
                fakeRegistry = new Registry(),
                filterFunction, 
                response;

            Registry.prototype.register.andCallThrough();
            Registry.prototype.getNewFiles.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            Registry.prototype._save.andCallThrough();
            StyleSheet.prototype.add.andCallThrough();

            fakeRegistry.register(component, css);
            filterFunction = function () {
                return (!fakeRegistry._components[component] || 
                        'undefined' === typeof fakeRegistry._components[component].files[file.path]);
            };
            response = fakeRegistry.getNewFiles(component,file);
            resp = filterFunction();

            expect(resp).toBe(true);
            expect(response).toEqual([]);
        });

        it("should return an array if there are found new files", 
                        ['raintime/css/registry', 'raintime/css/stylesheet',
                         'raintime/css/rule_set'], function(Registry, StyleSheet, RuleSet){

            var fakeRegistry = new Registry(),
                resp,
                filterFunction,
                file2 = [{path: 'path3'},{path: 'path4'}],
                response; 

            Registry.prototype.register.andCallThrough();
            Registry.prototype.getNewFiles.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            Registry.prototype._save.andCallThrough();
            StyleSheet.prototype.add.andCallThrough();
            StyleSheet.prototype.write.andCallThrough();
            StyleSheet.prototype.add.andCallThrough();

            fakeRegistry.register(component, css);
            filterFunction = function () {
                return (!fakeRegistry._components[component] || 
                        'undefined' === typeof fakeRegistry._components[component].files[file2.path]);
            };
            response = fakeRegistry.getNewFiles(component, file2);
            resp = filterFunction();

            expect(resp).toBe(true);
            expect(response).toEqual(file2);
        });
    });
});
