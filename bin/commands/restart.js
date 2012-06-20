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
    var workingDir = options.parent.dir,
        pid = fs.readFileSync(path.join(workingDir, '.rain'), 'utf-8');

    try {
        process.kill(pid, 'SIGTERM');
    } catch (e) {
        // the process is already dead
        console.log('Rain server not running, starting a new instance');
    }

    sdkUtil.startServer(options);
}

module.exports = register;
