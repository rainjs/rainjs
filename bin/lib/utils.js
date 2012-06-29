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

var path = require('path'),
    fs = require('fs');

exports.checkValidProject = function (projectPath) {
  return fs.existsSync(path.join(projectPath, '.rain'));
};

exports.checkPidDirectory = function(){
  //create process directories
  if(fs.existsSync(this.getPidDir()))
      return true;
  return false;
};

exports.componentExists = function(component_path){
  return fs.existsSync(component_path);
};

exports.createPidDirectory = function(){
  //create process id directory
  fs.mkdirSync(this.getPidDir(), 0775);
};

exports.getPidDir = function(){
  return path.resolve(process.env.HOME || process.env.UserProfile, '.rain');
};

exports.serverIsUp = function(project_path){
  if (fs.existsSync(path.join(project_path, '.server'))) {
    return true;
  }

  return false;
};

exports.getServerPIDContent = function (filePath) {
  var result = fs.readFileSync(filePath).toString().match(/^([0-9]+) (.+)/);
  return [result[1], result[2]];
};

exports.getServerList = function(){
  var files = fs.readdirSync(this.getPidDir()),
      serverfiles = [];

  for(var i = files.length; i--;){
    if(~files[i].indexOf('RAINSERVER'))
      serverfiles.push(files[i]);
  }
  return serverfiles;
};
