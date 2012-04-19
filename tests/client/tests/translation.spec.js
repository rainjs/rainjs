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
                "":{"domain":"messages"}
            }
        }
    }
}

describe('Translation module', function () {
    it('should properly translate an existing message id',
        ['core/js/translation', 'raintime/lib/jed'],
        function (ClientTranslation, Jed) {
            var translation = new ClientTranslation(locale);
            translation.translate.andCallThrough();
            Jed.sprintf.andCallThrough();
            Jed.prototype.translate.andCallThrough();
            Jed.prototype.textdomain.andCallFake(function () {
                return 'messages';
            });
            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Trimite email';
            });

            expect(translation.translate('Send email', null, 1))
                .toEqual("Trimite email");
        });

    it('should properly translate an existing message id with arguments',
        ['core/js/translation', 'raintime/lib/jed'],
        function (ClientTranslation, Jed) {
            var translation = new ClientTranslation(locale);
            translation.translate.andCallThrough();
            Jed.sprintf.andCallThrough();
            Jed.prototype.translate.andCallThrough();
            Jed.prototype.textdomain.andCallFake(function () {
                return 'messages';
            });
            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Draga Domnule John Doe,';
            });

            expect(translation.translate('Dear Mr %1$s %2$s,', null, 1, ['John', 'Doe']))
                .toEqual("Draga Domnule John Doe,");
        });

    it('should use the default language if it cannot find the translation',
        ['core/js/translation', 'raintime/lib/jed'],
        function (ClientTranslation, Jed) {
            var translation = new ClientTranslation(locale);
            translation.translate.andCallThrough();
            Jed.sprintf.andCallThrough();
            Jed.prototype.translate.andCallThrough();
            Jed.prototype.textdomain.andCallFake(function () {
                return 'messages';
            });
            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Salut Domnule John Doe,';
            });

            expect(translation.translate('Hello Mr %1$s %2$s,', null, 1, ['John', 'Doe']))
                .toEqual("Salut Domnule John Doe,");
        });

    it('should return the message id if it cannot find the translation',
        ['core/js/translation', 'raintime/lib/jed'],
        function (ClientTranslation, Jed) {
            var translation = new ClientTranslation(locale);
            translation.translate.andCallThrough();
            Jed.sprintf.andCallThrough();
            Jed.prototype.translate.andCallThrough();
            Jed.prototype.textdomain.andCallFake(function () {
                return 'messages';
            });
            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Cancel';
            });

            expect(translation.translate('Cancel', null, 1, ['John', 'Doe']))
                .toEqual("Cancel");
        });

    it('should properly translate an existing plural',
        ['core/js/translation', 'raintime/lib/jed'],
        function (ClientTranslation, Jed) {
            var translation = new ClientTranslation(locale);
            translation.translate.andCallThrough();
            Jed.sprintf.andCallThrough();
            Jed.prototype.translate.andCallThrough();
            Jed.prototype.textdomain.andCallFake(function () {
                return 'messages';
            });
            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Draga Domnilor John Doe,';
            });

            expect(translation.translate('Dear Mr %1$s %2$s,', null, 2, ['John', 'Doe']))
                .toEqual("Draga Domnilor John Doe,");
        });

    it('should use the default language if it cannot find a plural',
        ['core/js/translation', 'raintime/lib/jed'],
        function (ClientTranslation, Jed) {
            var translation = new ClientTranslation(locale);
            translation.translate.andCallThrough();
            Jed.sprintf.andCallThrough();
            Jed.prototype.translate.andCallThrough();
            Jed.prototype.textdomain.andCallFake(function () {
                return 'messages';
            });
            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Pentru voi';
            });

            expect(translation.translate('For you', null, 2, ['John', 'Doe']))
                .toEqual("Pentru voi");
        });

    it('should return the key if trying to translate a plural form that doesn\'t exist',
        ['core/js/translation', 'raintime/lib/jed'],
        function (ClientTranslation, Jed) {
            var translation = new ClientTranslation(locale);
            translation.translate.andCallThrough();
            Jed.sprintf.andCallThrough();
            Jed.prototype.translate.andCallThrough();
            Jed.prototype.textdomain.andCallFake(function () {
                return 'messages';
            });
            Jed.prototype.dcnpgettext.andCallFake(function () {
                return 'Send email';
            });

            expect(translation.translate('Send email', null, 3))
                .toEqual("Send email");
        });
});
