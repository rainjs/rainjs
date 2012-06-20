var path = require('path'),
    fs = require('fs');

function register(program) {
    program
        .command('stop')
        .description('stop the rain server')
        .action(stop);
}

function stop(options) {
    var workingDir = options.parent.dir,
        pid = fs.readFileSync(path.join(workingDir, '.rain'), 'utf-8');

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
