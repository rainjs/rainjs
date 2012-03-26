"use strict";

function translate(component, msgId, msgIdPlural, count, args) {
    var util = require('util');
    var params = [count ? msgIdPlural : msgId].concat(args);
    return util.format.apply(util, params);
}

function loadLanguageFile(file, locale, domain, callback) {

}

module.exports = {
    translate: translate,
    loadLanguageFile: loadLanguageFile
};
