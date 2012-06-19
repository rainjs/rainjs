var daemon = require('daemon'),
    path = require('path');

function register(program) {
    program
        .command('start')
        .description('start the rain server')
        .option('-n, --no-daemon', 'start the server without daemon mode')
        .option('-d, --debug', 'start the server in debug mode')
        .action(start);
}

function start(options) {
    var workingDir = options.parent.dir,
        name = require(path.join(workingDir, 'package.json')).name;

    var server = require(path.join(workingDir, 'lib', 'server'));
    server.initialize();
}

module.exports = register;
