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

define(function () {

    /**
     *
     * @param componentData
     * @constructor
     */
    function Component(componentData) {
        this._id = componentData.id;
        this._version = componentData.version;
        this._instanceId = componentData.instanceId;
        this._html = componentDate.html;
        this._containerId = componentData.containerId;
        this._rootElement = null;
    }

    Component.prototype.id = function () {
        return this._id;
    };

    Component.prototype.version = function () {
        return this._version;
    };

    Component.prototype.uniqueId = function () {
        return this.id() + ';' + this.version();
    };

    Component.prototype.instanceId = function () {
        return this._instanceId;
    };

    Component.prototype.html = function () {
        return this._html;
    };

    Component.prototype.containerId = function () {
        return this._containerId;
    };

    Component.prototype.cssClass = function () {
        return 'app-container ' + this.id() + '_' + componentData.version().replace(/\./g, '_');
    };

    Component.prototype.rootElement = function () {
        if (!this._rootElement || this._rootElement.length === 0) {
            this._rootElement = $('#' + this.instanceId);
        }

        return this._rootElement;
    };

    return Component;
});
