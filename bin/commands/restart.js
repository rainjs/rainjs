var path = require('path'),
    fs = require('fs'),
    sdkUtil = require('../lib/utils');

function register(program) {
    program
        .command('restart')
        .description('restart the rain server')
        .option('-d, --debug', 'start the server in debug mode')
        .action(restart);
}

function restart(options) {
    try {
        var projectRoot = sdkUtil.getProjectRoot(options.parent.dir);
    } catch (e) {
        console.log(options.parent.dir, 'is not located inside a valid rain project.');
        process.exit(1);
    }

    var pid = fs.readFileSync(path.join(projectRoot, '.server'), 'utf-8');

    try {
        process.kill(pid, 'SIGTERM');
    } catch (e) {
        // the process is already dead
        console.log('Rain server not running, starting a new instance');
    }

    sdkUtil.startServer(options);
}

module.exports = register;
