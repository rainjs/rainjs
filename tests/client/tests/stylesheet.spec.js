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

var MAX_RULES = 4095; // the maximum number of rules in a stylesheet
var firstRule = '.first-div { background: red; }\n';
var secondRule = '.second-div { background: red; }\n';

describe('Stylesheet', function () {
    var Spy = {};
    beforeEach(function() {
        Spy.styleElement = jasmine.createSpyObj('Spy.styleElement', ['setAttribute']);
        Spy.styleElement.textContent = '';
        Spy.headElement = jasmine.createSpyObj('Spy.headElement', ['appendChild']);
    });

    describe('constructor', function() {
        it('should create the style tag', ['raintime/css/stylesheet'], function (Stylesheet) {
            spyOn(document, 'getElementsByTagName');
            spyOn(document, 'createElement');
            document.getElementsByTagName.andReturn([Spy.headElement]);
            document.createElement.andReturn(Spy.styleElement);

            var style = new Stylesheet(0);

            expect(document.createElement).toHaveBeenCalledWith('style');
            expect(Spy.styleElement.setAttribute).toHaveBeenCalledWith('id', 'style0');
            expect(document.getElementsByTagName).toHaveBeenCalledWith('head');
            expect(Spy.headElement.appendChild).toHaveBeenCalledWith(Spy.styleElement);
            expect(style._styleSheet).toEqual(Spy.styleElement);

            // remove the spies on the dom methods so that require still works :P
            document.getElementsByTagName.andCallThrough();
            document.createElement.andCallThrough();
        });
    });

    describe('add()', function () {
        it('should push the rule to the append queue if there is room for it and return true',
            ['raintime/css/stylesheet', 'raintime/css/rule_set'], function(Stylesheet, RuleSet) {
                spyOn(document, 'getElementsByTagName');
                spyOn(document, 'createElement');
                document.getElementsByTagName.andReturn([Spy.headElement]);
                document.createElement.andReturn(Spy.styleElement);

                var style = new Stylesheet(0);
                var rule = new RuleSet({
                    length: firstRule.length,
                    ruleCount: 1,
                    content: firstRule
                });

                style.add.andCallThrough();
                var success = style.add(rule);

                expect(success).toBe(true);
                expect(style._ruleCount).toBe(1);
                expect(style._transaction._append.length).toBe(1);

                // remove the spies on the dom methods so that require still works :P
                document.getElementsByTagName.andCallThrough();
                document.createElement.andCallThrough();
            });

        it('should return false and do nothing if there is not enough space',
            ['raintime/css/stylesheet', 'raintime/css/rule_set'], function(Stylesheet, RuleSet) {
                spyOn(document, 'getElementsByTagName');
                spyOn(document, 'createElement');
                document.getElementsByTagName.andReturn([Spy.headElement]);
                document.createElement.andReturn(Spy.styleElement);

                var style = new Stylesheet(0);
                var rule = new RuleSet({
                    length: firstRule.length,
                    ruleCount: 1,
                    content: firstRule
                });

                // force the rulecount to maximum so no other rules will fit
                style._ruleCount = MAX_RULES;

                style.add.andCallThrough();
                var success = style.add(rule);

                expect(success).toBe(false);
                expect(style._ruleCount).toBe(MAX_RULES);
                expect(style._transaction._append.length).toBe(0);

                // remove the spies on the dom methods so that require still works :P
                document.getElementsByTagName.andCallThrough();
                document.createElement.andCallThrough();
            });
    });

    describe('remove()', function () {
        it('should push the rule to the remove queue if there is room for it and return true',
            ['raintime/css/stylesheet', 'raintime/css/rule_set'], function(Stylesheet, RuleSet) {
                spyOn(document, 'getElementsByTagName');
                spyOn(document, 'createElement');
                document.getElementsByTagName.andReturn([Spy.headElement]);
                document.createElement.andReturn(Spy.styleElement);

                var style = new Stylesheet(0);
                var rule = new RuleSet({
                    length: firstRule.length,
                    ruleCount: 1,
                    content: firstRule
                });

                style.remove.andCallThrough();
                style.remove(rule);

                expect(style._transaction._remove.length).toBe(1);

                // remove the spies on the dom methods so that require still works :P
                document.getElementsByTagName.andCallThrough();
                document.createElement.andCallThrough();
            });
    });

    describe('getFreeSpace()', function () {
        it('should correctly compute the free space inside the stylesheet',
            ['raintime/css/stylesheet'], function(Stylesheet) {
                spyOn(document, 'getElementsByTagName');
                spyOn(document, 'createElement');
                document.getElementsByTagName.andReturn([Spy.headElement]);
                document.createElement.andReturn(Spy.styleElement);

                var style = new Stylesheet(0);

                style.getFreeSpace.andCallThrough();
                style._ruleCount = 95;
                var space = style.getFreeSpace();

                expect(space).toBe(4000);

                // remove the spies on the dom methods so that require still works :P
                document.getElementsByTagName.andCallThrough();
                document.createElement.andCallThrough();
            });
    });

    describe('write()', function () {
        it('should add all the rules in the append queue to the stylesheet',
            ['raintime/css/stylesheet', 'raintime/css/rule_set'], function(Stylesheet, RuleSet) {
                spyOn(document, 'getElementsByTagName');
                spyOn(document, 'createElement');
                document.getElementsByTagName.andReturn([Spy.headElement]);
                document.createElement.andReturn(Spy.styleElement);

                var style = new Stylesheet(0);

                // push some rules to the append queue
                style._transaction._append.push(new RuleSet({
                    length: firstRule.length,
                    ruleCount: 1,
                    content: firstRule
                }));
                style._transaction._append.push(new RuleSet({
                    length: secondRule.length,
                    ruleCount: 1,
                    content: secondRule
                }));

                style.write.andCallThrough();
                style._append.andCallThrough();
                style._text.andCallThrough();
                style._getMapText.andCallThrough();
                style.write();

                expect(style._styleSheet.textContent).toBe(".first-div { background: red; }\n.second-div { background: red; }\n");

                // remove the spies on the dom methods so that require still works :P
                document.getElementsByTagName.andCallThrough();
                document.createElement.andCallThrough();
            });

        it('should add all the rules in the append queue to the stylesheet under IE',
            ['raintime/css/stylesheet', 'raintime/css/rule_set'], function(Stylesheet, RuleSet) {
                spyOn(document, 'getElementsByTagName');
                spyOn(document, 'createElement');
                document.getElementsByTagName.andReturn([Spy.headElement]);
                document.createElement.andReturn(Spy.styleElement);
                Spy.styleElement.styleSheet = {
                    cssText: ''
                };

                var style = new Stylesheet(0);

                // push some rules to the append queue
                style._transaction._append.push(new RuleSet({
                    length: firstRule.length,
                    ruleCount: 1,
                    content: firstRule
                }));
                style._transaction._append.push(new RuleSet({
                    length: secondRule.length,
                    ruleCount: 1,
                    content: secondRule
                }));

                style.write.andCallThrough();
                style._append.andCallThrough();
                style._text.andCallThrough();
                style._getMapText.andCallThrough();
                style.write();

                expect(style._styleSheet.styleSheet.cssText).toBe(".first-div { background: red; }\n.second-div { background: red; }\n");

                // remove the spies on the dom methods so that require still works :P
                document.getElementsByTagName.andCallThrough();
                document.createElement.andCallThrough();
                Spy.styleElement.styleSheet = undefined;
            });

        it('should remove all the rules in the remove queue to the stylesheet',
            ['raintime/css/stylesheet', 'raintime/css/rule_set'], function(Stylesheet, RuleSet) {
                spyOn(document, 'getElementsByTagName');
                spyOn(document, 'createElement');
                document.getElementsByTagName.andReturn([Spy.headElement]);
                document.createElement.andReturn(Spy.styleElement);
                Spy.styleElement.textContent = ".first-div { background: red; }\n.second-div { background: red; }\n";

                var style = new Stylesheet(0);

                // push some rules to the append queue
                style._transaction._remove.push(new RuleSet({
                    length: firstRule.length,
                    ruleCount: 1,
                    content: firstRule
                }));

                style.write.andCallThrough();
                style._remove.andCallThrough();
                style._getMapText.andCallFake(function () {
                    return '.first-div { background: red; }\n.second-div { background: red; }\n';
                });
                style._text.andCallThrough();
                style.write();

                expect(Spy.styleElement.textContent).toBe(".second-div { background: red; }\n");

                // remove the spies on the dom methods so that require still works :P
                document.getElementsByTagName.andCallThrough();
                document.createElement.andCallThrough();
            });

        it('should remove all the rules in the remove queue from the stylesheet under IE',
            ['raintime/css/stylesheet', 'raintime/css/rule_set'], function(Stylesheet, RuleSet) {
                spyOn(document, 'getElementsByTagName');
                spyOn(document, 'createElement');
                document.getElementsByTagName.andReturn([Spy.headElement]);
                document.createElement.andReturn(Spy.styleElement);
                Spy.styleElement.styleSheet = {
                    cssText: ".first-div { background: red; }\n.second-div { background: red; }\n"
                };

                var style = new Stylesheet(0);

                // push some rules to the append queue
                style._transaction._remove.push(new RuleSet({
                    length: firstRule.length,
                    ruleCount: 1,
                    content: firstRule
                }));

                style.write.andCallThrough();
                style._remove.andCallThrough();
                style._getMapText.andCallFake(function () {
                    return '.first-div { background: red; }\n.second-div { background: red; }\n';
                });
                style._text.andCallThrough();
                style.write();

                expect(Spy.styleElement.styleSheet.cssText).toBe(".second-div { background: red; }\n");

                // remove the spies on the dom methods so that require still works :P
                document.getElementsByTagName.andCallThrough();
                document.createElement.andCallThrough();
                Spy.styleElement.styleSheet = undefined;
            });
    });
});
