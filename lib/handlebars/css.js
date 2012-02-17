var mod_path = require('path');
var mod_logger = require('../logger.js').getLogger(mod_path.basename(module.filename));
var mod_handlebars = require('handlebars');

/**
 * This Handlebars helper transforms a set of component parameters into a link tag that
 * references a css file location from a specific component.
 *
 * @name CssHelper
 * @constructor
 */
function CssHelper() {}

/**
 * The helper receives in the context information about the Rain environment, like the current
 * component and the current list of existing versioned components.
 *
 * To determine the path for the css file, the following steps are performed:
 *
 * 1. if the component key is not specified, the current component id will be used.
 *
 * 2. if the version is not specified and the component key is present, the latest version
 *    for the component at step 1 is found and used.
 *
 * 3. prefix the specified path with ``htdocs/css/`` and generate the link tag string.
 *
 * @param {Object} options the css file options
 * @param {String} [options.component] the component id
 * @param {String} [options.version] the component version
 * @param {String} options.path the path to the css file from the htdocs/css/ folder. E.g. index.css
 * @throws {Error} precondition failed when the context has the wrong keys
 * @returns {String} the generated link tag
 */
CssHelper.prototype.helper = function (options) {
    var component = options.hash.component;
    var version = options.hash.version;
    var path = options.hash.path;

    if (!this.rain || typeof this.rain !== 'function') {
        throw new Error('precondition failed: rain function is missing.');
    }

    var rain = this.rain();

    if (!rain.component) {
        throw new Error('precondition failed: component attribute is missing.');
    }

    if (!path) {
        throw new Error('precondition failed: css path is missing.');
    }

    var rainComponent = rain.component;
    if (!component) {
        component = rainComponent.config.id;
        version = rainComponent.config.version;
    } else {
        version = rainComponent.componentcontainer.getLatestVersion(component, version);
        if (!version) {
            mod_logger.warn('Component ' + component + ' could not be found.');
            return '';
        }
    }

    path = 'htdocs/css/' + path;
    if (component != rainComponent.config.id
        || version != rainComponent.config.version) {
        // The css file is found in another component.
        path = 'webcomponent://' + component + ';' + version + '/' + path;
    }

    return renderHtml(path);
};

/**
 * Generate a link tag based on the file path.
 *
 * @param {String} path the css file path
 * @returns {String} the generated link tag
 * @private
 * @memberOf CssHelper#
 */
function renderHtml(path) {
    return new mod_handlebars.SafeString(
        '<link rel="stylesheet" href="' + path + '" type="text/css"/>'
    );
}

module.exports = {
    name: 'css',
    helper: new CssHelper().helper
};
