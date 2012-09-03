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

/**
 * Intent of type 'server'. No permissions are required to run it.
 *
 * @param {Object} data the intent's context data
 * @param {Object} context contains useful properties
 * @param {Object} context.session the current component's session
 * @param {Function} ack a callback that tells that the intent was finished, it needs to be called
 * @returns {Boolean}
 */
function allowedIntent(data, context, ack) {
    ack();
    return true;
}

/**
 * Intent of type 'server'. The user has to have a specific permission to run it that's defined in
 * the meta.json file for the current component.
 *
 * @param {Object} data the intent's context data
 * @param {Object} context contains useful properties
 * @param {Object} context.session the current component's session
 * @param {Function} ack a callback that tells that the intent was finished, it needs to be called
 * @returns {Boolean}
 */
function deniedIntent(data, context, ack) {
    ack();
    return true;
}

module.exports = {
    allowedIntent: allowedIntent,
    deniedIntent: deniedIntent
};
