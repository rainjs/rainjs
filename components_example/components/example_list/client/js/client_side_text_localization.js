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

define(['t', 'nt'], function (t, nt) {

    /**
     * Client-side text localization example controller.
     *
     * @name ClientTextLocalization
     * @class
     * @constructor
     */
    function ClientTextLocalization() {}

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    ClientTextLocalization.prototype.start = function () {
        var root = this.context.getRoot(),
            boss = {
                title: 'Mr.',
                lastName: 'Doe'
            },
            company = 'ABC Company',
            months = 5,
            firstName = 'John',
            lastName = 'Smith',
            email = 'jsmith@abcd.com',
            phone = '(111) 111-1111';

        root.find('.dear').html(t('letter.content.dear', 'Hello %1$s %2$s,', [boss.title, boss.lastName]));

        root.find('.possible').html(t('letter.content.scope', 'I am writing to ask whether it would be possible for you to provide a reference for me.'));
        root.find('.attest').html(nt('letter.content.positive.reference', 'If you were able to attest to my qualifications for employment, and the skills I attained during my <b>one month</b> tenure at <b>%2$s</b>, I would sincerely appreciate it.',
                                     'If you were able to attest to my qualifications for employment, and the skills I attained during my <b>%1$d months</b> tenure at <b>%2$s</b>, I would sincerely appreciate it.',
                                     months, [months, company]));
        root.find('.process').html(t('letter.content.process', 'I am in the process of seeking employment and a positive reference from you would enhance my prospects of achieving my career goals.'));
        root.find('.let').html(t('Please let me know if there is any information I can provide regarding my experience to assist you in giving me a reference. I can be reached at %1$s or %2$s.',
                                 [email, phone]));
        root.find('.thank').html(t('letter.content.thank.you', 'Thank you for your consideration.'));

        root.find('.sincerely').html(t('letter.ending.sincerely', 'Sincerely'));

        root.find('.name').html(t('%1$s %2$s', [firstName, lastName]));

        var emailResponse = root.find('.email-response');
        this._getChild('sendEmail').then(function (sendEmail) {
            $(sendEmail.context.getRoot().children()[0]).button( "option", "label", t('send.email.button.label', 'Send Email'));
            $(sendEmail.context.getRoot().children()[0]).click(function () {
                $.get("/example/controller/text_localization", function (data) {
                    emailResponse.html(data);
                });
            });
        });
    };

    return ClientTextLocalization;
});
