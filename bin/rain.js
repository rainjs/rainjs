#!/usr/bin/env node

//Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var fs = require('fs'),
    path = require('path'),
    color = require('colors'),
    exec = require('child_process').exec,
    wrench = require('wrench'),
    program = require('commander'),
    platform_list = ['nodejs'],
    utils   = require('./lib/utils.js'),
    sys_util = require('util'),
    Table = require('cli-table');

process.title = 'rain';
program
    .version(JSON.parse(fs.readFileSync(path.join(path.dirname(__dirname), 'package.json'), 'utf8')).version)
    .usage('<options> <command>')
    .option('-d, --debug', 'start the server with the node debugger\n'+
            '\t\t\t       server is NOT restarting on uncaught exceptions\n'+
            '\t\t\t       NOT working for windows\n'
            )
    .option('-c, --conf <path_to_conf>', 'start server with custom configuration')
    .option('-n, --no-daemon', 'start server without daemon mode');

program
    .command('create-project <path> <project-name>')
    .description('create a project')
    .action(createProject);

program
    .command('create-component <component-name>')
    .description('create a component')
    .action(createComponent);

program
    .command('start [#pid]')
    .description([
       'start the server on project root'
    ].join('\n'))
    .action(start);

program
    .command('stop [#pid]')
    .description([
       'stop the associated server on project root',
       'stop the server with the associated with the process id [#pid]'
    ].join('\n'))
    .action(stop);

program
    .command('restart')
    .description([
       'restarts the associated server on project root'
    ].join('\n'))
    .action(restart);

program
    .command('stopall')
    .description('shutting down all server')
    .action(stopall);


var extendedHelp = [
    '  Examples:'
    ,''
    ,'    $ rain create-project /home/username/workspace newProject'
    ,''
    ,'    $ rain start'
    ,'    $ rain start -c /home/username/workspace/custom_confs/server.conf'
    ,''
    ,'    $ rain stop'
    ,'    $ rain stop 5361'
    ,''
].join('\n');

program.on('--help', function(){
    console.log(extendedHelp);
});

program.parse(process.argv);
if (!program.debug && program.rawArgs.length <= 2) {
    console.log(program.helpInformation()+'\n\n\n'+extendedHelp);
}

/**
 * create new application
 */
function createProject(path, project_name) {
    var project_path = path.join(path.resolve(path), project_name);
    if (!fs.existsSync(project_path) && !utils.checkValidProject(project_path)) {
        log('Directory '+project_path.blue+' does not exist!');
        program.confirm('Create Directory?  -  yes/no: ', function(yes) {
            if (yes && setupProject(project_path)) {
                program.confirm('Do you want to create a component?  -  yes/no: ', function(yes) {
                    if (yes) {
                        program.prompt('Componentname: ', function(name){
                            //remove lineEnd
                            name = name.replace(/\n$/, '');
                            if (yes && name) {
                                setupComponent(project_path, name, function() {
                                    projectCreated();
                                });
                            } else {
                                log('Error: problem to setup component'.red);
                                projectCreated();
                            }
                        });
                    } else {
                        projectCreated();
                    }
                });
            } else {
                log('Error: problem to setup the project'.red);
            }
        });
    } else {
        log('Project exists!'.red);
    }

    var projectCreated = function() {
        process.stdin.destroy();
        log(
            'Project created'.green
            ,''
            ,'Go to the root directory of the project and start the server.'
            ,'  $ cd '+project_path+' | rain start'
            ,''
            ,'Happy developing ;-)'.rainbow
            ,''
        );
    };
}


function createComponent(component_name){
    var actPath = process.cwd();
    if (utils.checkValidProject(actPath)) {
        setupComponent(actPath, component_name, function() {
            process.stdin.destroy();
        });
    } else {
        log(
            'This is not a rain project!'.red
            ,'Please go to your project root and try it again!'
        );
    }
}


function setupProject(project_path) {
    var coreComponentsName = 'core',
        errorComponentName = 'error',
        placeholderComponentName = 'placeholder',
        paths = {
             conf: path.join(project_path, 'conf'),
             components: path.join(project_path, 'components'),
             'public': path.join(project_path, 'public'),
             log: path.join(project_path, 'log')
        };

    //create project directory
    fs.mkdirSync(project_path, 0755);
    //create components directory
    fs.mkdirSync(paths.components, 0755);
    //create conf directory
    fs.mkdirSync(paths.conf, 0755);
    //create log directory
    fs.mkdirSync(paths.log, 0755);
    //copy default configurations
    wrench.copyDirSyncRecursive(
        path.resolve(path.join(__dirname, '../init/conf')),
        paths.conf
    );
    //copy core-component
    wrench.copyDirSyncRecursive(
        path.resolve(path.join(__dirname, '../components/'+coreComponentsName)),
        path.join(paths.components, coreComponentsName)
    );
    //copy error-component
    wrench.copyDirSyncRecursive(
        path.resolve(path.join(__dirname, '../components/'+errorComponentName)),
        path.join(paths.components, errorComponentName)
    );
    //copy placeholder-component
    wrench.copyDirSyncRecursive(
        path.resolve(path.join(__dirname, '../components/'+placeholderComponentName)),
        path.join(paths.components, placeholderComponentName)
    );

    // create a package.json file for the project
    var projectName = project_path.split('/').splice(-1);
    var json = [
                '{',
                '    "name": "' + projectName + '",',
                '    "version": "0.0.1",',
                '    "dependencies": []',
                '}\n'
                ];
    fs.writeFileSync(project_path + '/package.json', json.join('\n'));
    //write ghostfile to know that is a rain project
    fs.writeFileSync(project_path+'/.rain', '');
    return true;
}

function setupComponent(project_path, component_name, callback) {

    var component_path = path.join(project_path, 'components', component_name);
    if (utils.componentExists(component_path)) {
        console.log('Component already exists'.red);
        return false;
    }
    console.log('Choose your platform:');
    program.choose(platform_list, function(i) {
        //create component directory
        fs.mkdirSync(component_path, 0755);
        switch (platform_list[i]) {
            case 'wicket':
                console.log('wicket not implemented yet');
                break;

            case 'pustefix':
                console.log('pustefix not implemented yet');
                break;

            case 'nodejs':
            default:
                require('./lib/components/nodejs')({
                    name : component_name,
                    path : component_path
                });
            break;
        }

        log(
            'Component created'.green
            ,''
            ,'You can find your component in'
            ,component_path.blue
        );
        if(callback) {
            callback();
        }
    });
}

function debug(){
    console.log(program);
}

function start(conf){
    var actPath = process.cwd();

    if (!utils.checkPidDirectory()) {
        utils.createPidDirectory();
    }

    if (!utils.checkValidProject(actPath)){
        console.log('this is not a rain project!'.red);
        return false;
    }

    if (conf) {
        program.conf = conf;
    }

    if (utils.serverIsUp(actPath)) {
        console.log('Server is still running!'.yellow);
        return false;
    }

    //===========START RAIN SERVER===========
    var conf_path = program.conf ||
                    process.env.RAIN_CONF ||
                    path.join(actPath, 'conf', 'server.conf.default'),
        pid_path = utils.getPidDir(),
        withDaemon = program.daemon && process.platform != 'darwin' && process.platform != 'win32';

    process.title = 'rain-server';

    if (withDaemon) {
        var daemon = require('daemon');
        var watcher = null;
        //start daemon
        daemon.start();

        //create configurationfile
        var server_prop_file = process.pid+' '+conf_path,
        conf_spid    = path.join(pid_path, actPath.replace(/\//gi, '._.')+'RAINSERVER'+process.pid),
        conf_project = path.join(actPath, '.server');

        //write server config
        fs.writeFileSync(conf_spid, server_prop_file);
        fs.writeFileSync(conf_project, server_prop_file);

        //lock pidfile
        daemon.lock(conf_spid);

        //clear conf files if server shutting down
        process.on('SIGTERM', function() {
            try {
                watcher.closeWatchers();
            } catch(ex) {
                console.error("Can't close all watching files: " + ex.stack);
            }

            try {
                fs.unlinkSync(conf_project);
                fs.unlinkSync(conf_spid);
            } catch(ex) {

            }
            process.exit(0);
        });

        process.on('uncaughtException', function (err) {
            console.error('Uncaught exception: ' + err.stack);
            if (!program.debug) {
                watcher.closeWatchers();
                require('child_process').exec('cd ' + actPath +' && rain restart');
            }
        });
    }

    if (process.platform != 'win32') {
        process.on('SIGINT', function () {
            console.log('\nServer is stopping...'.green);
            watcher.closeWatchers();
            process.exit(0);
        });
    }

    if (program.debug && process.platform != 'win32') {
        process.kill(process.pid, 'SIGUSR1');
    }

    require('../lib/server').initialize();
    watcher = require('../lib/watcher.js');

    //===========RAIN SERVER STARTED===========
    return true;
}

function stop(pid){
    if (!pid) {
        var actPath = process.cwd();
        if (utils.checkValidProject(actPath)) {
            if(utils.serverIsUp(actPath)) {
                var result = utils.getServerPIDContent(path.join(actPath, '.server'));
                pid = result[0];
            } else {
                console.log('No running server for this project');
                process.exit(0);
            }
        } else {
            console.log('this is not a compatible project!'.red);
            process.exit(1);
        }
    }

    try {
        process.kill(pid, 'SIGTERM');
        console.log('Server is stopping...'.green);
        while(utils.serverIsUp(actPath)) {}
    } catch (ev) {
        try {
            fs.unlinkSync(path.join(actPath, '.server'));
        } catch (ev) {}
        try {
            fs.unlinkSync(path.join(utils.getPidDir(), 'rain.server.' + pid));
        } catch (ev) {}
        console.log('No running server for this project');
    }
}

function stopall(){
    var server = utils.getServerList(),
        countServer = 0;

    //shutdown all server
    for(var i = server.length; i--;){
        var pid = server[i].split('RAINSERVER')[1];
        try {
            process.kill(pid,'SIGTERM');
            countServer++;
        } catch (e) {}
    }
    if (countServer > 0) {
        console.log('Stopping servers...');
        for(var i = server.length; i--;){
            var serverPath = server[i].split('RAINSERVER')[0].replace(/\._\./gi, '/');
            while(utils.serverIsUp(serverPath)) {}
            countServer++;
        }
    }

    console.log('%s Server stopped!'.green, countServer);
  }

function restart(){
    var pid = null,
        conf = null;
    if (!pid){
        var actPath = process.cwd();
        if(utils.checkValidProject(actPath)){
            if(utils.serverIsUp(actPath)){
                var result = utils.getServerPIDContent(path.join(actPath, '.server'));
                pid = result[0];
                conf = result[1];
            }
        } else {
            console.log('this is not a rain project!'.red);
            return false;
        }
    }

    try {
        if (pid) {
            process.kill(pid, 'SIGTERM');
            console.log('Restarting server...'.green);
            //wait till the old server was finally killed
            while(utils.serverIsUp(actPath)) {}
        }
    } catch (e) {
        // pid doesn't exist anymore
    }

    if (!conf) {
        console.log('No running server!'.yellow);
        console.log('Starting server with default config'.green);
    }
    start(conf);
}

function list(type){
    if (!type || type == 'server') {
        var table_s = new Table({
            head : ['PID', 'Config Path', 'Port'],
            colWidths : [ 10, 45, 10 ]
        });

        var files = utils.getServerList();
        for (var i = files.length; i--;) {
            var s_file = utils.getServerPIDContent(path.join(utils.getPidDir() ,files[i]));
            var server_conf = JSON.parse(fs.readFileSync(s_file[1]));
            table_s.push([s_file[0], s_file[1], server_conf.server.port]);
        }

        log(' Server List:'.cyan, table_s.toString());
    }
}


function log(){
    var arr_String = [''];
    for(var str in arguments){
        arr_String.push(arguments[str]);
    }
    console.log(arr_String.join('\n'));
}
