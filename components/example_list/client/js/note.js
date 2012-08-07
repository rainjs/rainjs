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

define(['util', 'raintime/lib/event_emitter'], function (Util, EventEmitter) {

    /**
     * A note. Takes care of updating the content after the user
     * enters characters in the note's textarea. In this case it also
     * emits an update event.
     */
    function Note(color, angle, content, div, textarea) {
        this._color = color || this._rand(Note._colors);
        this._angle = angle || this._rand(Note._angles);
        this._content = content || '';
        if (div && textarea) {
            this._div = div;
            this._textarea = textarea;
            this._bind();
        }
    }

    /**
     * Available colors for notes.
     *
     * @type {Array}
     */
    Note._colors = ['yellow', 'pink', 'blue'];

    /**
     * Available rotation angles for notes.
     *
     * @type {Array}
     */
    Note._angles = [-10, -5, 5, 10];

    /**
     * Delay after a keypress event after which an update is triggered.
     *
     * @type {Number} milliseconds
     */
    Note._delay = 300;

    /**
     * Creates a note from an existing jQuery DIV.
     * Parses the CSS classes and textarea's content.
     *
     * @returns {Note} a new note
     */
    Note.create = function (div) {
        var color, angle, content,
            textarea = div.find('textarea'),
            cls = div.attr('class'),
            regexp, result;

        regexp = new RegExp('\\b(' + Note._colors.join('|') + ')\\b');

        result = regexp.exec(cls);
        if (result) {
            color = result[1];
        }

        regexp = new RegExp('\\bangle-(?:plus|minus)-(\\d+)\\b');

        result = regexp.exec(cls);
        if (result) {
            angle = result[1];
        }

        if (textarea) {
            content = textarea.text();
        }

        return new Note(color, angle, content, div, textarea);
    };

    Util.inherits(Note, EventEmitter);

    /**
     * Picks a random item out of a list.
     *
     * @param {Array} list
     * @returns {Object}
     */
    Note.prototype._rand = function (list) {
        return list[Math.floor(Math.random() * list.length)];
    };

    /**
     * Generates and returns the note's HTML.
     *
     * @returns {jQuery} the generated DIV with event handlers attached
     */
    Note.prototype.html = function () {
        if (!this._div || !this._textarea) {
            this._textarea = $('<textarea></textarea>');
            this._div = $('<div>').addClass(this._classes()).append(this._textarea);
            this._bind();
        }

        return this._div;
    };

    /**
     * Binds event handles for the note.
     */
    Note.prototype._bind = function () {
        this._textarea.on('keypress', this._keypress.bind(this));
        this._textarea.on('change', this._update.bind(this));
    };

    /**
     * Assembles the note's CSS classes.
     *
     * @returns {String} a space separated list of class names
     */
    Note.prototype._classes = function () {
        return [
            'note',
            this._color,
            'angle-' + (this._angle < 0 ? 'minus' : 'plus-') + this._angle
        ].join(' ');
    };

    /**
     * Starts a timeout for updating after the user has stopped typing.
     */
    Note.prototype._keypress = function () {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }

        this._timeout = setTimeout(this._update.bind(this), Note._delay);
    };

    /**
     * Updates the internal note's content with the textarea value.
     * Emits the update event.
     */
    Note.prototype._update = function () {
        this._content = this._textarea.val();

        this.emit('update');
    };

    /**
     * Serializes the note.
     *
     * @returns {Object}
     */
    Note.prototype.serialize = function () {
        return {
            'text': this._content,
            'class': this._classes()
        };
    };

    return Note;
});
