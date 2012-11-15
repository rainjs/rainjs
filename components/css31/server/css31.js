// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

var path = require('path'),
    fs = require('fs'),
    wrench = require('wrench'),
    terminal = require('child_process').exec,
    child;

function create31Components() {

    var componentPath = path.join(__dirname, '../../'),
        filePath = path.join(__dirname, '../client/templates/index.html'),
        k = 0;

    try {
        for(var i = 0; i < 31; i++) {
            wrench.rmdirSyncRecursive(componentPath + '/component' + i);
        }
    } catch (err) {
        console.log('An error occurred when cleaning the previous folder information: ', err);
    }

    for(var i = 0; i < 31; i++){
        (function (i) {
                child = terminal('rain create-component component' + i, function (error, stdout, stderr){
                    var output = terminal('chmod 777 -R ' + componentPath + 'component' + i,
                                function(error, stdout, stderr){

                    var cssFile = componentPath + 'component' + i + '/client/css/index.css',
                        htmlFile = componentPath + 'component' + i + '/client/templates/index.html',
                        rule = '.rule { background-color : #23'+parseInt(i%10,10)+';width:auto;height:auto;}',
                        tag = '{{css path = "index.css"}} <div class ="rule">Component' + i + '</div>';

                    fs.appendFileSync(cssFile, rule);
                    fs.appendFileSync(htmlFile, tag);
                    });
                ++k;
                });
        })(i);
    }

    fs.writeFileSync(filePath, '');

    for(var i = 0; i < 31; i++){
        var cssContent = '{{ component name = "component' + i
                            +'" version="1.0" view="index"}}<br/>\n';

        fs.appendFileSync(filePath, cssContent);
    }
}

create31Components();
