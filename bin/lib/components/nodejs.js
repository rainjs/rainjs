var wrench = require('wrench');
var fs = require('fs');
var path = require('path');

module.exports = function (options) {
    wrench.copyDirSyncRecursive(path.resolve(path.join(__dirname, '../../../init/skeletons/nodejs')), options.path);

    // Manipulate meta.json.
    var metajs = fs.readFileSync(options.path + '/meta.json', 'utf8').replace(/\{\{application_name\}\}/g, options.name);
    fs.writeFileSync(options.path+'/meta.json', metajs, 'utf8');

    // Manipulate client-side controller.
    var metajs = fs.readFileSync(options.path + '/client/js/index.js', 'utf8').replace(/\{\{application_name\}\}/g, options.name);
    fs.writeFileSync(options.path+'/client/js/index.js', metajs, 'utf8');
};
