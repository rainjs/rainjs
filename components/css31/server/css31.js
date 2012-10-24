"use strict";

var path = require('path'),
    fs = require('fs'),
    wrench = require('wrench'),
    terminal = require('child_process').exec,
    child;

function create31Components() {
    var componentPath = path.join(__dirname, '../../');
    var filePath = path.join(__dirname, '../client/templates/index.html');
    try {
        for(var i=0;i<31;i++) {
        wrench.rmdirSyncRecursive(componentPath+'/component'+i);
        }
    } catch (err) {
        console.log('An error occurred when cleaning the previous folder information: ', err);
        //return;
    }
    var k=0;
    for(var i=0;i<31;i++){
        (function (i) {
                child = terminal('rain create-component component'+i, function(error,stdout,stderr){
            var copil = terminal('chmod 777 -R '+componentPath+'component'+i, function(error,stdout,stderr){
                var cssFile = componentPath+'component'+i+'/client/css/index.css';
                var htmlFile = componentPath+'component'+i+'/client/templates/index.html';
                var rule = '.rule { background-color : #23'+parseInt(i%10,10)+';width:auto;height:auto;}';
                fs.appendFileSync(cssFile, rule);
                var tag = '{{css path="index.css"}} <div class="rule">Component'+i+'</div>';
                fs.appendFileSync(htmlFile,tag);
             });
            //console.log('stdout:','success creating component'+k);
            ++k;
            //console.log(__dirname);
        });
        })(i);
    }
    fs.writeFileSync(filePath,'');
    //console.log("tamtam",filePath);
    for(var i=0;i<31;i++){
        var cssContent = '{{ component name = "component'+i+'" version="1.0" view="index"}}<br/>\n'
        fs.appendFileSync(filePath, cssContent);
    }
}

create31Components();