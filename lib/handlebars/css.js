"use strict";

var componentRegistry = require('../component_registry');
var renderer = require('../renderer');

/**
 * This Handlebars helper collects the css dependencies of a view and provide it to the renderer
 *
 * @name CssHelper
 * @constructor
 */
function CssHelper() {}

/**
 * The helper receives in the context information about the injected css file.
 *
 * To determine the path for the css file, the following steps are performed:
 *
 * 1. if the component key is not specified, the current component id will be used.
 *
 * 2. if the version is not specified and the component key is present, the latest version
 *    for the component at step 1 is found and used.
 *
 * 3. prefix the specified path with ``htdocs/css/`` and push it to the collection for the renderer.
 *
 * @param {Object} options the css file options
 * @param {String} [options.component] the component id
 * @param {String} [options.version] the component version
 * @param {String} options.path the path to the css file from the htdocs/css/ folder. E.g. index.css
 * @throws {RainError} precondition failed when the context has the wrong keys
 * @returns {String} Empty string
 */
CssHelper.prototype.helper = function (options) {
    var componentId = options.hash.component;
    var version = options.hash.version;
    var path = options.hash.path;

    var rain = renderer.rain;

    if (!path) {
        throw new RainError('css path is missing.', RainError.ERROR_PRECONDITION_FAILED);
    }

    var component = rain.component;
    if (!componentId) {
        componentId = component.id;
        version = component.version;
    } else {
        version = componentRegistry.getLatestVersion(componentId, version);
    }

    if (version) {
        path = '/' + componentId + '/' + version + '/css/' + path;
    } else {
        //this path doesn't exist, but the user should see an error when a css isn't resolved
        path = '/' + componentId + '/css/' + path;
        console.log('Component ' + componentId + ' could not be found.');
    }

    rain.css.push(path);

    return '';
};

module.exports = {
    name: 'css',
    helper: new CssHelper().helper
};
