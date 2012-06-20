var daemon = require('daemon'),
    path = require('path'),
    fs = require('fs');

var root = path.resolve(__dirname, '..', '..');

function register(program) {
    program
        .command('start')
        .description('start the rain server')
        .option('-d, --debug', 'start the server in debug mode')
        .action(start);
}

function start(options) {
    var workingDir = options.parent.dir;

    try {
        fs.statSync(path.join(workingDir, '.rain'));
    } catch (e) {
        console.log(workingDir, 'is not a valid rain project');
        process.exit(1);
    }

    if (options.debug && 'win32' != process.platform) {
        process.kill(process.pid, 'SIGUSR1');
    }

    process.chdir(workingDir);
    require(path.join(root, 'lib', 'server')).initialize();
}

module.exports = register;
