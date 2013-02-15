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

var config = require('./configuration'),
    SESSION_ROUTES = ['controller', 'view'],
    url = require('url'),
    parser = require('./http-accept-language');

/**
 * @name Internationalisation
 * @namespace
 */
/**
 * Handle function for the language middleware.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Function} next callback passed by connect that execute the next middleware when called
 * @memberof Internationalisation
 */
function internationalisation(request, response, next) {
    var accepted_language = parser(request.headers["accept-language"]),
        urlParams = url.parse('http://'+request.headers.host).hostname.split('.'),
        lastIndex = urlParams.length - 1,
        domain = urlParams[lastIndex],
        defaultLanguage, supportedLanguages, bestLanguage,
        languages = [];

    console.log('accepted language ', accepted_language);
    if(domain in config.tlds) {
        defaultLanguage = config.tlds[domain].defaultLanguage;
        supportedLanguages = config.tlds[domain].supportedLanguages;

        if(request.rainRoute && SESSION_ROUTES.indexOf(request.rainRoute.routeName) === -1) {
            return next();
        } else if(!request.session.global.get("userLanguage")){

            for(var i = 0, len = config.languages.length; i < len; i++) {
                if(supportedLanguages.indexOf(config.languages[i].key) !== -1) {
                    languages.push(config.languages[i]);
                }
            }

            request.session.global.set("acceptedLanguages", languages);

            bestLanguage = accepted_language.getBestLanguageMatch(supportedLanguages);
            console.log('hehe', bestLanguage);
            if(typeof bestLanguage !== 'undefined') {
                request.session.global.set("userLanguage", bestLanguage);
            } else {
                request.session.global.set("userLanguage", defaultLanguage);
            }
        }
    } else {
        //try to set the default language to Accepted-Language header if possible
        if(request.rainRoute && SESSION_ROUTES.indexOf(request.rainRoute.routeName) === -1) {
            return next();
        } else if(!request.session.global.get("userLanguage")){

            for(var i = 0, len = config.languages.length; i < len; i++) {
                languages.push(config.languages[i].key);
            }

            bestLanguage = accepted_language.getBestLanguageMatch(languages);
            console.log('hehe', bestLanguage);

            if(typeof bestLanguage !== 'undefined') {
                request.session.global.set("userLanguage", bestLanguage);
            }
        }
    }
    request.sessionStore.save(request.session.global);
    console.log(request.session.global.get('userLanguage'));
    return next();
};

module.exports = function () {
    return internationalisation;
};
