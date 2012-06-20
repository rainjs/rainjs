var sdkUtil = require('../lib/utils');

function register(program) {
    program
        .command('start')
        .description('start the rain server')
        .option('-d, --debug', 'start the server in debug mode')
        .action(sdkUtil.startServer);
}

module.exports = register;
