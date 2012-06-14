define(['util', 'raintime/lib/event_emitter'], function (Util, EventEmitter) {
    /**
     * A note. Takes care of updating the content after the user
     * enters characters in the note's textarea. Emits an update event
     * in this case also.
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
     * @type {Array}
     */
    Note._colors = ['yellow', 'pink', 'blue'];

    /**
     * Available rotation angles for notes.
     * @type {Array}
     */
    Note._angles = [-10, -5, 5, 10];
    

    /**
     * Delay after a keypress event after which an update is triggered.
     * @type {Number} milliseconds
     */
    Note._delay = 300;

    /**
     * Creates a note from an existing jQuery DIV.
     * Parses the CSS classes and textarea's content.
     * @returns {Note} a new note
     */
    Note.create = function (div) {
        var color, angle, content
        var textarea = div.find('textarea');
        var cls = div.attr('class');
        var regexp, result;

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
     * @param {Array} list
     * @returns {Object}
     */
    Note.prototype._rand = function (list) {
        return list[Math.floor(Math.random() * list.length)];
    };

    /**
     * Generates and returns the note's HTML.
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
    }

    /**
     * Serializes the note.
     * @returns {Object}
     */
    Note.prototype.serialize = function () {
        return {
            content: this._content,
            'class': this._classes()
        };
    };

    return Note;
});