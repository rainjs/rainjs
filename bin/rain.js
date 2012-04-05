#!/usr/bin/env node

var fs = require('fs')
    mod_path = require('path')
    color = require('colors')
    exec = require('child_process').exec
    wrench = require('wrench')
    program = require('commander')
    daemon = require('daemon')
    platform_list = ['nodejs']
    utils   = require('./lib/utils.js')
    sys_util = require('util')
    Table = require('cli-table');

process.title = 'rain';
program
    .version(JSON.parse(fs.readFileSync(mod_path.join(mod_path.dirname(__dirname), 'package.json'), 'utf8')).version)
    .usage('<options> <command>')
    .option('-d, --debug', 'start the server with the node debugger\n'+
            '\t\t\t       server is NOT restarting on uncaught exceptions\n')
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

var withDaemon = program.daemon && process.platform != 'darwin' && process.platform != 'win32';

/**
 * create new application
 */
function createProject(path, project_name) {
    var project_path = mod_path.join(mod_path.resolve(path), project_name);
    if (!mod_path.existsSync(project_path) && !utils.checkValidProject(project_path)) {
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
                                log('Error: problem to setup component'.red)
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
    }
};


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
        )
    }
};


function setupProject(project_path) {
    var coreComponentsName = 'core', 
        paths = {
             conf: mod_path.join(project_path, 'conf'),
             components: mod_path.join(project_path, 'components'),
             'public': mod_path.join(project_path, 'public'),
             log: mod_path.join(project_path, 'log')
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
        mod_path.resolve(mod_path.join(__dirname, '../init/conf')),
        paths.conf
    );
    //copy core-component
    wrench.copyDirSyncRecursive(
        mod_path.resolve(mod_path.join(__dirname, '../components/'+coreComponentsName)),
        mod_path.join(paths.components, coreComponentsName)
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

    var component_path = mod_path.join(project_path, 'components', component_name);
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
};

function debug(){
    console.log(program);
};

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
    } else {
        //===========START RAIN SERVER===========
        var conf_path = program.conf ||
                        process.env.RAIN_CONF ||
                        mod_path.join(actPath, 'conf', 'server.conf.default'),
            pid_path = utils.getPidDir();

        process.title = 'rain-server';

        if (withDaemon) {
            //start daemon
            daemon.start();
            
            //create configurationfile
            var server_prop_file = process.pid+' '+conf_path,
            conf_spid    = mod_path.join(pid_path, 'rain.server.'+process.pid),
            conf_project = mod_path.join(actPath, '.server');
            
            //write server config
            fs.writeFileSync(conf_spid, server_prop_file);
            fs.writeFileSync(conf_project, server_prop_file);
            
            //lock pidfile
            daemon.lock(conf_spid);
            
            //clear conf files if server shutting down
            process.on('SIGTERM', function() {
                try {
                    fs.unlinkSync(conf_project);
                    fs.unlinkSync(conf_spid);
                } catch(ev){
                    
                }
                process.exit(0);
            });
            
            process.on('uncaughtException', function (err) {
                console.error('Uncaught exception: ' + err.stack);
                if (!program.debug) {
                    require('child_process').exec('cd ' + actPath +' && rain restart');
                }
            });
        }

        if (program.debug) {
            process.kill(process.pid, 'SIGUSR1');
        }

        require('../lib/server').initialize();

        //===========RAIN SERVER STARTED===========
        return true;
    }
};

function stop(pid){
    if (!pid) {
        var actPath = process.cwd();
        if (utils.checkValidProject(actPath)) {
            if(utils.serverIsUp(actPath)) {
                var result = utils.getServerPIDContent(mod_path.join(actPath, '.server'));
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
        console.log('Server stopped!'.green);
    } catch (ev) {
        try {
            fs.unlinkSync(mod_path.join(actPath, '.server'));
        } catch (ev) {}
        try {
            fs.unlinkSync(mod_path.join(utils.getPidDir(), 'rain.server.' + pid));
        } catch (ev) {}
        console.log('No running server for this project');
    }
    
    process.exit(0);
};

function stopall(){
    var server = utils.getServerList(),
        countServer = 0;

    //shutdown all server
    for(var i = server.length; i--;){
        var pid = server[i].substring(12);
      try {
        process.kill(pid,'SIGTERM');
        countServer++;
      } catch (e) {}
    }

    console.log('%s Server shutted down!'.green, countServer);
  };

function restart(){
    var pid = null,
        conf = null;
    if (!pid){
        var actPath = process.cwd();
        if(utils.checkValidProject(actPath)){
            if(utils.serverIsUp(actPath)){
                var result = utils.getServerPIDContent(mod_path.join(actPath, '.server'));
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
        }
    } catch (e) {
        // pid doesn't exist anymore
    }

    if (!conf) {
        console.log('No running server!'.yellow);
        console.log('Starting server with default config'.green);
    }
    //wait till the old server was finally killed
    while (utils.serverIsUp(actPath) == true) {}
    start(conf);
};

function list(type){
    if (!type || type == 'server') {
        var table_s = new Table({
            head : ['PID', 'Config Path', 'Port'],
            colWidths : [ 10, 45, 10 ]
        });

        var files = utils.getServerList();
        for (var i = files.length; i--;) {
            var s_file = utils.getServerPIDContent(mod_path.join(utils.getPidDir() ,files[i]));
            var server_conf = JSON.parse(fs.readFileSync(s_file[1]));
            table_s.push([s_file[0], s_file[1], server_conf.server.port]);
        }

        log(' Server List:'.cyan, table_s.toString());
    }
};


function log(){
    var arr_String = [''];
    for(var str in arguments){
        arr_String.push(arguments[str]);
    }
    console.log(arr_String.join('\n'));
};
