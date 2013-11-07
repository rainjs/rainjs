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

define(['js/note'], function (Note) {
    var canSend = true,
        needResend = false,
        dataList = {};

    function FloatNotes() {}

    FloatNotes.prototype.start = function () {
        this._setup();
        this._board = this._root.find('.board');
    };

    /**
     * Read the notes and bind the update events.
     */
    FloatNotes.prototype._setup = function () {
        var self = this,
            notes;

        this._root = this.context.getRoot();
        this._notes = [];

        // find notes loaded from session and re-create them
        notes = this._root.find('.note');
        notes.each(function () {
            var note = Note.create($(this));
            self._bind(note);
            self._notes.push(note);
        });

        this._root.find('.add-note').on('click', this._addNote.bind(this));

        // socket used for saving notes
        this._socket = this.context.messaging.getSocket('notes');
    };

    /**
     * Adds a new note to the board.
     */
    FloatNotes.prototype._addNote = function () {
        var note;

        note = new Note();
        // bind event handlers
        this._bind(note);

        // add it to the internal notes list
        this._notes.push(note);

        this._addNoteInPage(note);

        // save it in case others get added and this one isn't written
        this._save(note, this._notes.length - 1);
    };

    /**
     * Add the note in the page.
     *
     * @param {Note} note the note to add
     */
    FloatNotes.prototype._addNoteInPage = function (note) {
        this._board.append(note.html());
    };

    /**
     * Binds event handlers for the update event of a note.
     *
     * @param {Note} note the note to bind events for
     */
    FloatNotes.prototype._bind = function (note) {
        note.on('update', this._save.bind(this, note, this._notes.length));
    };

    /**
     * Saves a list of updated notes that did not get the chance to be updated yet.
     *
     * @param {Object} list - object with all the updated notes
     */
    FloatNotes.prototype._saveList = function () {
        var self = this;
        canSend = false;


        this._socket.emit('save-list', dataList, function (error, data) {

            if(error) {
                self._saveList();
            }
            canSend = true;
            needResend = false;
        });
    };

    /**
     * Saves the note to the session.
     *
     * @param {Note} note
     * @param {Number} index position in notes list
     */
    FloatNotes.prototype._save = function (note, index) {
        var self = this;
        var data = {
            index: index,
            note: note.serialize()
        };

        if (canSend) {
            canSend = false;

            this._socket.emit('save', data, function (error, data) {
                canSend = true;

                if(error) {
                    self._save(note, index);
                }

                if (needResend) {
                    self._saveList(dataList);
                }
            });

        } else {
            needResend = true;
            dataList[index] = data;
        }
    };

    return FloatNotes;
});
