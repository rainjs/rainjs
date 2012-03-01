var server = require('./lib/server');
var conf = process.cwd() + '/conf/server.conf.default';
server.start(conf);
