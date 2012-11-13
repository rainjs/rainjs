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
     * A model defining the structure of an object containing the CSS rules defined in a CSS file.
     *
     * @param {Object} data the CSS data received from the server
     * @param {Integer} data.ruleCount the number of rules inside the file
     * @param {Integer} data.length the length of the content inside the file
     * @param {String} data.content the content of the CSS file
     *
     * @property {Integer} ruleCount the number of rules in the set
     * @property {Integer} length the length of the content inside the set
     * @property {String} content the CSS content inside the set
     *
     * @name RuleSet
     * @constructor
     */
    function RuleSet(data) {
        this.start = 0;
        this.style = null;

        Object.defineProperties(this, {
            'ruleCount': {
                value: data.ruleCount,
                writable: false
            },
            'length': {
                value: data.length,
                writable: false
            },
            'content': {
                value: data.content,
                writable: false
            }
        });
    }

    return RuleSet;
});
