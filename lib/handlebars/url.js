"use strict";
var env = require('../environment');

function UrlHelper() {}

UrlHelper.prototype.helper = function (pathname, localized, options) {
    var url = "/example/resources/"+pathname;
    if(localized){
        url += '?loc';
    }

    return url;
};


module.exports = {
    name: 'url',
    helper: new UrlHelper().helper
};
