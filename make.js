#!/usr/bin/env node

var fs          = require('fs')
    ,mod_path   = require('path')
    ,colors     = require('colors')
    ,os         = require('os')
    ,content    = ''
    ,root       = mod_path.resolve(mod_path.join(__dirname));

                                                                                                                                                                                                                                                                                                                                    
console.log('patching modules...');

var patch1 = fs.readFileSync(mod_path.resolve(__dirname+'/patches/gettext/lib/gettext.js'), 'utf8'),
    patch2 = fs.readFileSync(mod_path.resolve(__dirname+'/patches/node-xml/lib/node-xml.js'));

var basePath = __dirname,
    windows = !mod_path.existsSync(basePath+'/node_modules/gettext/lib/gettext.js');

if(windows){
    basePath = "../../";
    if(fs.symlinkSync(__dirname + '/../../node_modules', __dirname + '/node_modules')){
        console.log('created symlink of node_modules for windows');
    }
}

fs.writeFileSync(mod_path.resolve(basePath+'/node_modules/gettext/lib/gettext.js'), patch1, 'utf8');
console.log('patched gettext');
fs.writeFileSync(mod_path.resolve(basePath+'/node_modules/node-xml/lib/node-xml.js'), patch2, 'utf8');
console.log('patched node-xml');
console.log("2/2 modules patched");