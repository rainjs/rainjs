var mod_path = require('path');
var mod_logger = require('../logger.js').getLogger(mod_path.basename(module.filename));
var mod_handlebars = require('handlebars');

/**
 * 
 * @name ComponentHelper
 * @constructor
 */
function ComponentHelper() {}

ComponentHelper.prototype.helper = function (options) {
    return "";
}

module.exports = {
    name: 'component',
    helper: new ComponentHelper.helper
};
