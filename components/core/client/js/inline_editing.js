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

define(['raintime/translation',
        'raintime/messaging/sockets',
        'raintime/lib/promise'
], function (ClientTranslation, Sockets, Promise) {

    var socket = Sockets.getSocket('/core');

    /**
     * Decides when to activate the click events on the editing regions.
     *
     * @type {Boolean}
     * @private
     */
    var isEditEnabled = true;

    /**
     * This class provides methods when working with inline translations.
     *
     * @name InlineEditing
     * @class
     */
    function InlineEditing() {}

    /**
     * When the 'edit' view mode is selected, the t and nt functions and the t and nt Handlebars
     * helpers generate additional information to identify the translated message. This information
     * is generated as an html tag and hidden.
     *
     * This function extracts that information and based on it adds behavior to the DOM parent of
     * the text node (the message). When the user clicks the editing region the text can be edited
     * and later saved or canceled using two buttons.
     *
     * The saved translations are stored on the server-side in the session and on client-side in
     * local storage.
     */
    InlineEditing.refreshTranslationPlaceholders = function () {
        $('.rain-inline-editing').each(function () {
            var parent = $(this).parent(),
                data = {
                    message: InlineEditing._getText(parent),
                    component: {
                        id: $(this).attr('data-id'),
                        version: $(this).attr('data-version')
                    },
                    msgId: $(this).attr('data-msgId'),
                    msgIdPlural: $(this).attr('data-msgIdPlural') || null,
                    singular: $(this).attr('data-singular'),
                    plural: $(this).attr('data-plural') || null,
                    count: $(this).attr('data-count') || null,
                    args: JSON.parse($(this).attr('data-args') || null)
                };

            parent.addClass('rain-edit-message');
            parent.attr('contenteditable', 'true');

            parent.bind('click.inlineEditing', function (event) {
                if (!isEditEnabled) {
                    return;
                }

                var actions = parent.find('.rain-edit-actions');

                if (actions && actions.length === 1) {
                    return;
                }

                parent.html('');

                InlineEditing._createMessages(parent, data);
                InlineEditing._createActionsElement(parent, data);

                event.preventDefault();
                event.stopImmediatePropagation();
            });

            $(this).remove();
        });

        var hasEscapedPlaceholders = false;

        /**
         * Depending on how the strings returned by the t and nt functions are used, the results
         * may be html escaped and will not be caught by the first selector.
         *
         * To avoid that we search through all the text nodes for content that has inline editing
         * special meaning (the rain-inline-editing class) and transform it into a html tag. Then
         * we run the first selector again.
         */
        $('*', 'body')
            .andSelf()
            .contents()
            .filter(function () {
                return this.nodeType === 3;
            })
            .filter(function () {
                return this.nodeValue.indexOf('rain-inline-editing') !== -1 &&
                       $(this).parent().prop('tagName') !== 'SCRIPT';
            })
            .each(function () {
                hasEscapedPlaceholders = true;

                var index = this.nodeValue.indexOf('\n<span class="rain-inline-editing"'),
                    inlineText = this.nodeValue.substring(index + 1, this.nodeValue.length -1),
                    newContent = this.nodeValue.substring(0, index),
                    parent = $(this).parent();

                parent.html(newContent);
                parent.append($(inlineText));
            }
        );

        if (hasEscapedPlaceholders) {
            InlineEditing.refreshTranslationPlaceholders();
        }
    };

    /**
     * Gets the contents of the text nodes for an element.
     *
     * @param {jQuery} parent the parent of the translated message
     *
     * @returns {String} the translated message
     */
    InlineEditing._getText = function (parent) {
        return parent.contents().filter(function () {
            return this.nodeType == 3;
        }).text().trim();
    };

    /**
     * Adds to the message parent the original singular and plural translations.
     *
     * @param {jQuery} parent the parent of the translated message
     * @param {Object} data the translation data
     */
    InlineEditing._createMessages = function (parent, data) {
        parent.append($('<span class="singular">' + data.singular + '</span>')).append('<br>');
        if (data.msgIdPlural) {
            parent.append($('<span class="plural">' + data.plural + '</span>')).append('<br>');
        }
    };

    /**
     * Adds to the message parent "Save" and "Cancel" buttons and attaches click events.
     *
     * @param {jQuery} parent the parent of the translated message
     * @param {Object} data the translation data
     */
    InlineEditing._createActionsElement = function (parent, data) {
        var actions = $('<span contenteditable="false" class="rain-edit-actions"></span>');

        var save = $('<span class="rain-edit-actions-save">Save</span>'),
            cancel = $('<span class="rain-edit-actions-cancel">Cancel</span>');

        actions.append(save);
        actions.append(cancel);

        parent.append(actions);
        parent.append('<br>');

        save.click(InlineEditing._saveTranslation.bind(this, parent, data));
        cancel.click(InlineEditing._cancelTranslation.bind(this, parent, data.message));
    };

    /**
     * Saves the modified translation message.
     *
     * @param {jQuery} parent the parent of the translated message
     * @param {Object} data the translation data
     */
    InlineEditing._saveTranslation = function (parent, data) {
        var singularMessage = parent.find('.singular').html(),
            pluralMessage = data.msgIdPlural ? parent.find('.plural').html() : null;

        var translation = {
            moduleId: data.component.id + ' ' + data.component.version.replace('.', '_'),
            language: rainContext.language,
            msgId: data.msgId,
            translations: [data.msgIdPlural, singularMessage, pluralMessage]
        };

        socket.emit('save_translation', translation, function () {
            var componentTranslation = ClientTranslation.get(data.component),
                newMessage;

            componentTranslation.saveInlineTranslation(translation);

            newMessage = componentTranslation.translate(data.msgId, data.msgIdPlural,
                                                        data.count, data.args);

            InlineEditing._cancelTranslation(parent, newMessage);
        });

        return false;
    };

    /**
     * Removes the buttons and updates the translation for the region.
     *
     * @param {jQuery} parent the parent of the translated message
     * @param {String} newMessage the new translation message
     */
    InlineEditing._cancelTranslation = function (parent, newMessage) {
        parent.html(newMessage);

        return false;
    };

    /**
     * Disables the click events for the editing regions.
     */
    InlineEditing.disableEditEvents = function () {
        isEditEnabled = false;
    };

    /**
     * Enables the click events for the editing regions.
     */
    InlineEditing.enableEditEvents = function () {
        isEditEnabled = true;
    };

    /**
     * Removes the inline translations for all components.
     *
     * @returns {Promise} a promise to be resolved after the translations were removed
     */
    InlineEditing.removeInlineTranslations = function () {
        var deferred = Promise.defer();

        socket.emit('remove_translations', function () {
            ClientTranslation.removeInlineTranslations();
            deferred.resolve();
        });

        return deferred.promise;
    };

    return InlineEditing;
});
