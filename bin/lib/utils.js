var path = require('path'),
    fs = require('fs');

var root = path.resolve(__dirname, '..', '..');

module.exports.startServer = function (options) {
    var workingDir = options.parent.dir,
        rainFile = path.join(workingDir, '.rain');

    try {
        fs.statSync(rainFile);
    } catch (e) {
        console.log(workingDir, 'is not a valid rain project');
        process.exit(1);
    }

    if (options.debug && 'win32' != process.platform) {
        process.kill(process.pid, 'SIGUSR1');
    }

    fs.writeFileSync(rainFile, process.pid);
    process.on('SIGTERM', function () {
        fs.truncateSync(fs.openSync(rainFile, 'w+'), 0);
        process.exit();
    });

    process.chdir(workingDir);
    require(path.join(root, 'lib', 'server')).initialize();
}

