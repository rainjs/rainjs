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

define(['util',
        '/example/js/note.js',
        '/example/js/notes.js'], function (Util, Note, FloatNotes) {

    /**
     * This controller uses a layout to add and remove notes.
     */
    function FlowLayoutNotes() {}

    Util.inherits(FlowLayoutNotes, FloatNotes);

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    FlowLayoutNotes.prototype.start = function () {
        var self = this;

        this.context.find('flowLayout', function () {
            self._layout = this;

            FlowLayoutNotes.super_.prototype._setup.call(self);

            self._root.find('.remove-note').on('click', self._removeNote.bind(self));
        });
    };

    /**
     * Adds a new note to the layout.
     *
     * @param {Note} note the note to add
     */
    FlowLayoutNotes.prototype._addNoteInPage = function (note) {
        this._layout.add(note.html().prop('outerHTML'), {
            index: this._layout.count() - 1
        });
    };

    /**
     * Removes the first note.
     */
    FlowLayoutNotes.prototype._removeNote = function () {
        if (!this._notes.length) {
            return;
        }

        this._notes.splice(0, 1);

        this._layout.remove({
            index: 0
        });

        this._socket.emit('remove', {
            index: 0
        });
    };

    return FlowLayoutNotes;
});
