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

var locale = {
    "language": {
        "domain": "messages",
        "data": {
            "messages": {
                "Dear Mr %1$s %2$s,": [
                    null,
                    "Draga Domnule %1$s %2$s,",
                    "Draga Domnilor %1$s %2$s,"
                ],
                "Send email": [
                    null,
                    "Trimite email",
                ],
                "":{"domain":"messages"}
            }
        }
    },
    "defaultLanguage": {
        "domain": "messages",
        "data": {
            "messages": {
                "Hello Mr %1$s %2$s,": [
                    null,
                    "Salut Domnule %1$s %2$s,"
                ],
                "For you": [
                    null,
                    "Pentru tine",
                    "Pentru voi"
                ],
                "button.custom.id": [
                    null,
                    "Text de buton",
                ],
                "":{"domain":"messages"}
            }
        }
    }
};

describe('Translation module', function () {
    var translation;

    var init = function (ClientTranslation, Jed) {
        translation = new ClientTranslation(locale);
        translation.translate.andCallThrough();
        Jed.sprintf.andCallThrough();
        Jed.prototype.translate.andCallThrough();
        Jed.prototype.textdomain.andCallFake(function () {
            return 'messages';
        });
    };

    it('should properly translate an existing message id',
        ['core/js/translation', 'raintime/lib/jed'], function (ClientTranslation, Jed) {
            init(ClientTranslation, Jed);

            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Trimite email';
            });

            expect(translation.translate('Send email', null, 1))
                .toEqual("Trimite email");

            expect(Jed.prototype.dcnpgettext)
                .toHaveBeenCalledWith(undefined, undefined, 'Send email', 1, undefined);
        });

    it('should properly translate an existing message id with arguments',
        ['core/js/translation', 'raintime/lib/jed'], function (ClientTranslation, Jed) {
            init(ClientTranslation, Jed);

            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Draga Domnule John Doe,';
            });

            expect(translation.translate('Dear Mr %1$s %2$s,', null, 1, ['John', 'Doe']))
                .toEqual("Draga Domnule John Doe,");

            expect(Jed.prototype.dcnpgettext)
                .toHaveBeenCalledWith(undefined, undefined, 'Dear Mr %1$s %2$s,', 1,
                                      ['John', 'Doe']);

        });

    it('should use the default language if it cannot find the translation',
        ['core/js/translation', 'raintime/lib/jed'], function (ClientTranslation, Jed) {
            init(ClientTranslation, Jed);

            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Salut Domnule John Doe,';
            });

            expect(translation.translate('Hello Mr %1$s %2$s,', null, 1, ['John', 'Doe']))
                .toEqual("Salut Domnule John Doe,");

            expect(Jed.prototype.dcnpgettext)
                .toHaveBeenCalledWith(undefined, undefined, 'Hello Mr %1$s %2$s,', 1,
                                      ['John', 'Doe']);

        });

    it('should return the message id if it cannot find the translation',
        ['core/js/translation', 'raintime/lib/jed'], function (ClientTranslation, Jed) {
            init(ClientTranslation, Jed);

            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Cancel';
            });

            expect(translation.translate('Cancel', null, 1, ['John', 'Doe']))
                .toEqual("Cancel");

            expect(Jed.prototype.dcnpgettext)
                .toHaveBeenCalledWith(undefined, undefined, 'Cancel', 1,
                                      ['John', 'Doe']);
        });

    it('should properly translate an existing plural',
        ['core/js/translation', 'raintime/lib/jed'], function (ClientTranslation, Jed) {
            init(ClientTranslation, Jed);

            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Draga Domnilor John Doe,';
            });

            expect(translation.translate('Dear Mr %1$s %2$s,', null, 2, ['John', 'Doe']))
                .toEqual("Draga Domnilor John Doe,");

            expect(Jed.prototype.dcnpgettext)
                .toHaveBeenCalledWith(undefined, undefined, 'Dear Mr %1$s %2$s,', 2,
                                      ['John', 'Doe']);
        });

    it('should use the default language if it cannot find a plural',
        ['core/js/translation', 'raintime/lib/jed'], function (ClientTranslation, Jed) {
            init(ClientTranslation, Jed);

            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Pentru voi';
            });

            expect(translation.translate('For you', null, 2, ['John', 'Doe']))
                .toEqual("Pentru voi");

            expect(Jed.prototype.dcnpgettext)
                .toHaveBeenCalledWith(undefined, undefined, 'For you', 2, ['John', 'Doe']);
        });

    it('should return the key if trying to translate a plural form that doesn\'t exist',
        ['core/js/translation', 'raintime/lib/jed'], function (ClientTranslation, Jed) {
            init(ClientTranslation, Jed);

            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Send email';
            });

            expect(translation.translate('Send email', null, 3))
                .toEqual("Send email");

           expect(Jed.prototype.dcnpgettext)
                .toHaveBeenCalledWith(undefined, undefined, 'Send email', 3, undefined);
        });

    it('should return the custom id translation if valid',
        ['core/js/translation', 'raintime/lib/jed'], function (ClientTranslation, Jed) {
            init(ClientTranslation, Jed);

            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Text de buton';
            });
            expect(translation.translate('button.custom.id','Send email', null, 1))
                .toEqual("Text de buton");

            expect(Jed.prototype.dcnpgettext)
                .toHaveBeenCalledWith(undefined, undefined, 'button.custom.id', 'Send email', null);
        });

    it('should return the default id if custom id is invalid',
        ['core/js/translation', 'raintime/lib/jed'], function (ClientTranslation, Jed) {
            init(ClientTranslation, Jed);

            Jed.prototype.dcnpgettext.andCallFake(function () {
                console.log(arguments);
                return 'Trimite email';
            });

            expect(translation.translate('invalid.id','Send email', null, 1))
                .toEqual("Trimite email");

            expect(Jed.prototype.dcnpgettext)
                .toHaveBeenCalledWith(undefined, undefined, 'invalid.id', 'Send email', null);
        });

});
