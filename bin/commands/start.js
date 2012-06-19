function register(program) {
    program
        .command('start')
        .description('start the rain server')
        .option('-n, --no-daemon', 'start the server without daemon mode')
        .option('-d, --debug', 'start the server in debug mode')
        .action(start);
}

function start(options) {
    var workingDir = options.parent.dir;
}

module.exports = register;
