var server = require('./lib/server');
var conf = process.cwd() + '/conf/server.conf.default';
var fs = require('fs');

var motd = fs.readFileSync('motd.txt', 'utf8');
console.log("\n\n\n" + motd + "\n\n\n");
server.start(conf);
