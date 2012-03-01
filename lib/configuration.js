/*
Copyright (c) 2011, Mitko Tschimev <mitko.tschimev@1und1.de>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

"use strict";

var self = null;
var fs = require('fs');
var path = require('path');
var util = require('./util');

var Configuration = function(){

};

Configuration.prototype.load = function(configPath){
    if(!configPath){
        throw "configPath is required!";
    }
    self = new Configuration();
    var confData = fs.readFileSync(configPath, 'utf8');
    try{
        confData = JSON.parse(confData);
        util.extend(this, confData);
        this.server.serverRoot = path.resolve(this.server.serverRoot);
        this.server.documentRoot = path.resolve(this.server.documentRoot);
        this.server.componentPath = path.resolve(this.server.componentPath);
    } catch(ex){
        console.log("Server configuration has no valid JSON structure!", configPath);
    }
};

self = new Configuration();

module.exports = self;

