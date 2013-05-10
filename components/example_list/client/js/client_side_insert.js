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

define([], function () {

    /**
     * Client-side insert/replace/delete example.
     *
     * @name ClientInsert
     * @constructor
     */
    function ClientInsert() {}

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    ClientInsert.prototype.start = function () {
        var root = this.context.getRoot(),
            container = root.find('.insert-panel'),
            insertNotes = root.find('.insert-notes'),
            insertContainer = root.find('.insert-container'),
            remove = root.find('.remove'),
            message = root.find('.message'),
            self = this;

        insertNotes.click(function () {
            self.context.remove('insertedComponent');
            self.context.insert({
                id: 'example',
                view: 'notes',
                sid: 'insertedComponent',
                placeholder: true
            }, container, function (component) {
                message.text('Inserted component: ' + component.id + ';' + component.version +
                    ' (staticId: ' + component.staticId + ')');
            });
        });

        insertContainer.click(function () {
            self.context.remove('insertedComponent');
            self.context.insert({
                id: 'example',
                view: 'containers_v2',
                sid: 'insertedComponent',
                placeholder: true
            }, container, function (component) {
                message.text('Inserted component: ' + component.id + ';' + component.version +
                    ' (staticId: ' + component.staticId + ')');
            });
        });

        remove.click(function () {
            self.context.remove('insertedComponent');
            message.text('No component.');
        });
    };

    return ClientInsert;
});

