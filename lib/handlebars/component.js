var mod_path = require('path');
var mod_logger = require('../logger.js').getLogger(mod_path.basename(module.filename));
var mod_handlebars = require('handlebars');

/**
 * This Handlebars helper transforms a set of parameters into a custom HTML tag. This tag will
 * be parsed later and replaced with a view from a specific component.
 *
 * @name ComponentHelper
 * @constructor
 */
function ComponentHelper() {}

/**
 * The helper receives in the context information about the Rain environment, like the current
 * component and the current list of existing versioned components.
 *
 * The helper decides what view should use and from what component, adds the information to the
 * tag library of the current component and then generates the HTML tag.
 *
 * To determine what component and view to use, the following steps are performed:
 *
 * 1. if the name key is not specified, the current component id will be used.
 *
 * 2. if the version is not specified and the name key is present, the latest version
 * for the component at step 1 is found and used.
 *
 * 3. if the view key is not specified, the default ``index`` view will be used.
 *
 * @param {Object} options the component options
 * @param {String} [options.name] the component id
 * @param {String} [options.version] the component version
 * @param {String} [options.view|'index'] the view id.
 * @param {String} [options.sid|undefined] the component static id, used in the client-side controller
 * @param {String} [options.data|undefined] the data sent from the parent
 * @throws {Error} when the context has the wrong keys
 * @returns {String} the generated custom HTML tag
 */
ComponentHelper.prototype.helper = function (options) {
    var component = options.hash['name'],
        version = options.hash['version'],
        view = options.hash['view'],
        sid = options.hash['sid'],
        data = options.hash['data'];

    if (!this.rain || typeof this.rain !== 'function') {
        throw new Error('precondition failed: rain function is missing.');
    }

    var rain = this.rain();
    var rainComponent = rain.component;

    if (!rainComponent) {
        throw new Error('precondition failed: component attribute is missing.');
    }

    if (!view) {
        view = 'index';
    }

    if (!component) {
        component = rainComponent.config.id;
        version = rainComponent.config.version;
    }

    var componentContainer = rainComponent.componentcontainer;
    version = componentContainer.getLatestVersion(component, version);
    if (!version) {
        mod_logger.warn('Component ' + component + ' could not be found.');
        return '';
    } else {
        var module = component + ';' + version;
        var selector = generateSelector(component, version, view);

        var configuration = componentContainer.getConfiguration(module);
        var requiredView = componentContainer.getViewByViewId(configuration, view);

        if (!requiredView) {
            mod_logger.warn('Component ' + configuration.id + ' does not have the '+
                            view + 'view .');
            return '';
        }

        rainComponent.addTagLib({
            namespace: '',
            selector: selector,
            module: module,
            view: requiredView.view
        });

        try {
            if (data) {
                data = data.replace(/([^\\])'/g, '$1"');
                JSON.parse(data);
            }
        } catch (ex) {
            mod_logger.warn('Invalid data key in component helper declaration: ', data);
            data = '';
        }

        return renderHtml(selector, sid, data);
    }
}

/**
 * Generate a selector string.
 *
 * @param {String} component the component id
 * @param {String} version the component version
 * @param {String} view the view id
 * @returns {String} the generated selector string
 * @private
 * @memberOf ComponentHelper#
 */
function generateSelector(component, version, view) {
    var selector = component + '_' + version + '_' + view;
    return selector.replace(/[^a-zA-Z0-9_-]+/g, '');
}

/**
 * Generate a link tag based on the file path.
 *
 * @param {String} selector the selector string
 * @param {String} sid the static id
 * @param {String} data the data sent from the parent
 * @returns {String} the generated HTML tag
 * @private
 * @memberOf ComponentHelper#
 */
function renderHtml(selector, sid, data) {
    var html = '<' + selector;

    if (sid) {
        html += " data-sid='" + sid + "'";
    }

    if (data) {
        html += " data-tmp='" + data + "'";
    }

    html += ' />';
    return new mod_handlebars.SafeString(html);
}

module.exports = {
    name: 'component',
    helper: new ComponentHelper().helper
};
