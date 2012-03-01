var server = require('./lib/server');
var fs = require('fs');
var conf = fs.readFileSync(process.cwd() + '/conf/server.conf.default');
server({'conf': JSON.parse(conf)}, function () {
    console.log('Server Started');
});
