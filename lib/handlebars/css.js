var mod_path = require('path');
var mod_logger = require('../logger.js').getLogger(mod_path.basename(module.filename));
var mod_handlebars = require('handlebars');

/**
 * This Handlebars component transforms a set of component parameters into a link tag that
 * references a css file location from a specific component.
 *
 * The helper receives in the context information about the Rain environment, like the current
 * component and the current list of existing versioned components.
 *
 * To determine the path for the css file, the following steps are performed: 1) if the component
 * key is not specified, the current component id will be used; 2) the latest version for the
 * component with the id established at step 1 is found and used; 3) prefix the specified path
 * with 'htdocs/css/' and generate the link tag string.
 *
 * Usage: {{css path="index.css"}}
 *        {{css component="button" version="1.1" path="index.css"}}
 *
 * @param {Object} options the css file options
 * @param {String} [options.component] the component id
 * @param {String} [options.version] the component version
 * @param {String} options.path the path to the css file from the htdocs/css/ folder. E.g. index.css
 * @throws {Error} when the context has the wrong keys
 * @returns the generated link tag
 */
function helper(options) {
    var component = options.hash['component'],
        version = options.hash['version'],
        path = options.hash['path'];

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

    if (!component) {
        component = rain.component.config.id;
    }

    var rainComponent = rain.component;
    version = rainComponent.componentcontainer.getLatestVersion(component, version);
    if (!version) {
        logger.info('Component ' + component + ' could not be found.');
        return '';
    }

    path = 'htdocs/css/' + path;
    if (component != rainComponent.config.id ||
        version != rainComponent.config.version) {
        // The css file is found in another component.
        path = 'webcomponent://' + component + ';' + version + '/' + path;
    }

    return renderHtml(path);
}

/**
 * Generate a link tag based on the file path.
 *
 * @param {String} path the css file path
 * @returns the generated link tag
 */
function renderHtml(path) {
    return new mod_handlebars.SafeString(
        '<link rel="stylesheet" href="' + path + '" type="text/css"/>'
    );
}

module.exports = {
    name: 'css',
    helper: helper
};
