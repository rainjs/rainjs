"use strict";

var componentRegistry = require('../component_registry');
var renderer = require('../renderer');

/**
 * This Handlebars helper collects the css dependencies of a view and provides it to the renderer
 *
 * Syntax::
 *
 *      {{css path="cssPath" [name="componentId" [version="versionNumber"]]}}
 *
 * @example
 *      Collects the ``index.css`` of the current component.
 *
 *      {{css path="index.css"}}
 *
 * @example
 *      Collects the ``roundDiv.css`` of the component external_theming  with the latest version.
 *
 *      {{css name="external_theming" path="roundDiv.css"}}
 *
 *
 * @name CssHelper
 * @class
 * @constructor
 */
function CssHelper() {
}

/**
 * The helper receives in the context information about the injected css file.
 *
 * To determine the path for the css file, the following steps are performed:
 *
 * 1. if the component key is not specified, the current component id will be used.
 *
 * 2. if the version is not specified and the component key is present, the latest version for the component at step 1 is found and used.
 *
 * 3. The file has to be located in ``client/css/``.
 *
 * @param {Object} options the css file options
 * @param {String} [options.name] the component id
 * @param {String} [options.version] the component version
 * @param {String} options.path the path to the css file. E.g. index.css
 * @throws {RainError} precondition failed when the context has the wrong keys
 * @returns {String} Empty string
 */
CssHelper.prototype.helper = function (options) {
    var componentId = options.hash.name;
    var version = options.hash.version;
    var path = options.hash.path;

    var rain = renderer.rain;

    if (!path) {
        throw new RainError('CSS path is missing.', RainError.ERROR_PRECONDITION_FAILED);
    }

    if (version && !componentId) {
        throw new RainError('The component name is required if you are specifying the version.',
                            RainError.ERROR_PRECONDITION_FAILED);
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
        // set the query string for cross referencing
        if (component.id !== componentId || component.version !== version) {
            path += '?component=' + encodeURIComponent(component.id) + "&version=" + encodeURIComponent(component.version);
        }
    } else {
        // this path doesn't exist, but the user should see an error when a css isn't resolved
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
