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

define(['/example/js/note.js'], function (Note) {

    function Notes() {}

    Notes.prototype.start = function () {
        var self = this,
            notes;

        this._root = this.context.getRoot();
        this._notes = [];

        this.context.find('flowLayout', function () {
            self._layout = this;

            // Find notes loaded from session and re-create them.
            notes = self._root.find('.note');
            notes.each(function () {
                var note = Note.create($(this));
                self._bind(note);
                self._notes.push(note);
            });

            self._root.find('.add-note').on('click', self._addNote.bind(self));
            self._root.find('.remove-note').on('click', self._removeNote.bind(self));

            // socket used for saving notes
            self._socket = self.context.messaging.getSocket('/example/3.0/notes');
        });
    };

    /**
     * Adds a new note to the board.
     */
    Notes.prototype._addNote = function () {
        var note;

        note = new Note();
        // bind event handlers
        this._bind(note);

        // add it to the internal notes list
        this._notes.push(note);

        // insert it in HTML
        this._layout.add(note.html().prop('outerHTML'), {
            index: this._layout.count() - 1
        });

        // save it in case others get added and this one isn't written
        this._save(note, this._notes.length - 1);
    };

    /**
     * Removes the first note.
     */
    Notes.prototype._removeNote = function () {
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

    /**
     * Binds event handlers for the update event of a note.
     *
     * @param {Note} note the note to bind events for
     */
    Notes.prototype._bind = function (note) {
        note.on('update', this._save.bind(this, note, this._notes.length));
    };

    /**
     * Saves the note to the session.
     *
     * @param {Note} note
     * @param {Number} index position in notes list
     */
    Notes.prototype._save = function (note, index) {
        var data = {
            index: index,
            note: note.serialize()
        };

        this._socket.emit('save', data);
    };

    return Notes;
});
