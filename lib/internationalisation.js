"use strict";
var config = require('./configuration'),
    SESSION_ROUTES = ['controller', 'view'];

/**
 * Handle function for the language middleware.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 * @param {Function} next callback passed by connect that execute the next middleware when called
 */
function internationalisation(request, response, next) {
    var host = request.headers.host,
        accepted_language = request.headers["accept-language"],
        urlParams = host.split('.'),
        lastIndex = urlParams.length - 1,
        domain = urlParams[lastIndex],
        localization = accepted_language.split(',')[0].replace('-','_'),
        defaultLanguage, supportedLanguages;

    if('domain' in config) {
        defaultLanguage = config[domain].defaultLanguage,
        supportedLanguages = config[domain].supportedLanguages;

        if(request.rainRoute && SESSION_ROUTES.indexOf(request.rainRoute.routeName) === -1) {
            return next();
        } else if(!request.session.global.get("userLanguage")){
            var languages = []; 
            for(var i = 0, len = config.languages.length; i < len; i++) {
                if(supportedLanguages.indexOf(config.languages[i].key) !== -1) {
                    languages.push(config.languages[i]);
                }
            }
            request.session.global.set("acceptedLanguages", languages);
            if(supportedLanguages.indexOf(localization) !== -1) {
                request.session.global.set("userLanguage", localization);
            } else {
                request.session.global.set("userLanguage", defaultLanguage);
            }
            request.sessionStore.save(request.session.global);
        }
    } else {
        //try to set the default language to Accepted-Language header if possible
        if(request.rainRoute && SESSION_ROUTES.indexOf(request.rainRoute.routeName) === -1) {
            return next();
        } else if(!request.session.global.get("userLanguage")){
            var foundAcceptedLanguage = false;
            for(var i = 0, len = config.languages.length; i < len; i++) {
                if(config.languages[i].key === localization) {
                    foundAcceptedLanguage = true;
                }
            }
            if(foundAcceptedLanguage) {
                request.session.global.set("userLanguage", localization);
            }
        }
    }

    return next();
};

module.exports = function () {
    return internationalisation;
};
