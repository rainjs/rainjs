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
 * Gets a component specified by ``id`` and ``version`` or the latest version specified by ``id``
 *
 * @param {String} id the component name
 * @param {String} [version] the component version
 * @returns {Component|undefiend} the component instance
 */
Component.get = function (componentsDir, id, version) {
    var files = fs.readdirSync(componentsDir),
        versions = [];

    for (var i = files.length; i--;) {
        var file = path.join(componentsDir, files[i]);

        try {
            var stat = fs.statSync(file);
        } catch (e) {
            continue;
        }

        if (!stat.isDirectory()) {
            continue;
        }

        try {
            var component = require(path.join(file, 'meta.json'));
        } catch (e) {
            continue;
        }

        if (!component.version) {
            continue;
        }

        component.version = this._normalizeVersion(component.version);
        version && (version = this._normalizeVersion(version));
        if (component.id == id) {
            versions.push(component.version);
        }
    }

    var v = semver.maxSatisfying(versions);

    if (!v || (version && semver.neq(version, v))) {
        return;
    }

    return new Component(id, v);
};

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
        cmp = this.get(componentsDir, id, version),
        skeleton = path.resolve(path.join(__dirname, '../init/component'));

    if (cmp && version) {
        throw new Error('Component ' + id + ' version ' + version + ' already exists.');
    } else if (cmp) {
        version = semver.inc(cmp.version, 'minor');
    }

    if (!cmp && !version) {
        version = '1.0.0';
    }
    version = this._normalizeVersion(version);

    var componentPath = path.join(componentsDir, id + '_' + version);

    if (path.existsSync(componentPath)) {
        throw new Error('Path ' + componentPath + ' already exists.');
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

/**
 * Normalizes component version to major.minor.patch format
 *
 * @param {String} version the version to normalize
 * @returns {String} the normalized version
 */
Component._normalizeVersion = function (version) {
    var matches = /^([0-9]*)\.?([0-9]*)\.?([0-9]*)?$/.exec(version);
    matches.shift();

    for (var i = matches.length; i--;) {
        if (!matches[i]) {
            version += '.0';
        }
    }

    return version;
}

module.exports = Component;
