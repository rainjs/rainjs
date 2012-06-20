var path = require('path'),
    fs = require('fs'),
    sdkUtil = require('../lib/utils');

function register(program) {
    program
        .command('stop')
        .description('stop the rain server')
        .action(stop);
}

function stop(options) {
    try {
        var projectRoot = sdkUtil.getProjectRoot(options.parent.dir);
    } catch (e) {
        console.log(options.parent.dir, 'is not located inside a valid rain project.');
        process.exit(1);
    }

    var pid = fs.readFileSync(path.join(projectRoot, '.server'), 'utf-8');

    if (!pid) {
        console.log('Rain server not running, nothing to do.');
        process.exit(0);
    }

    try {
        process.kill(pid, 'SIGTERM');
        console.log('Stopped rain server.');
    } catch (e) {
        // the process is already dead
        console.log('Rain server not running, nothing to do.');
    }
}

module.exports = register;
