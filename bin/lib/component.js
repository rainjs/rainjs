var path = require('path'),
    fs = require('fs'),
    wrench = require('wrench');
    semver = require('semver');

/**
 * RAIN component
 *
 * @param {String} id the component name
 * @param {String} version the component version
 * @constructor
 */
function Component(id, version) {
    this.id = id;
    this.version = version;
}

/**
 * Create a new component
 *
 * @param {String} id the component name
 * @param {String} [version='1.0.0'] the component version
 * @returns {Component} the newly created component
 * @throws {Error} if the component already exists
 * @throws {Error} if the component path already exists
 */
Component.create = function (projectRoot, id, version) {
    var componentsDir = path.join(projectRoot, 'components'),
        skeleton = path.resolve(path.join(__dirname, '../init/component'));

    version = version || '1.0';

    var componentPath = path.join(componentsDir, id + '_' + version);

    if (path.existsSync(componentPath)) {
        throw new Error('Component ' + id + ' version ' + version + ' already exists.');
    }

    fs.mkdirSync(componentPath, '0755');
    wrench.copyDirSyncRecursive(skeleton, componentPath);
    this._updatePlaceholders(path.join(componentPath, 'meta.json'), {
        'component_name': id,
        'component_version': version
    });
    this._updatePlaceholders(path.join(componentPath, 'client', 'templates', 'index.html'), {
        'component_name': id
    });

    return new Component(id, version);
};

/**
 * Update placeholders in a specific file.
 *
 * @param {String} filePath the file path
 * @param {Object} placeholders the placeholder map
 */
Component._updatePlaceholders = function (filePath, placeholders) {
    var fileContent = fs.readFileSync(filePath, 'utf8'),
        regExp,
        key;

    for (key in placeholders) {
        if (placeholders.hasOwnProperty(key)) {
            regExp = new RegExp('\{\{' + key + '\}\}', 'g');
            fileContent = fileContent.replace(regExp, placeholders[key]);
        }
    }

    fs.writeFileSync(filePath, fileContent, 'utf8');
}

module.exports = Component;
