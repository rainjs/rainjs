define([], function (t, nt) {

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

        root.find('.dear').html(t('Dear %1$s %2$s,', [boss.title, boss.lastName]));
        root.find('.possible').html(t('I am writing to ask whether it would be possible for you to provide a reference for me.'));
        root.find('.attest').html(nt('If you were able to attest to my qualifications for employment, and the skills I attained during my <b>one month</b> tenure at <b>%2$s</b>, I would sincerely appreciate it.',
                                     'If you were able to attest to my qualifications for employment, and the skills I attained during my <b>%1$d months</b> tenure at <b>%2$s</b>, I would sincerely appreciate it.',
                                     months, [months, company]));
        root.find('.process').html(t('I am in the process of seeking employment and a positive reference from you would enhance my prospects of achieving my career goals.'));
        root.find('.let').html(t('Please let me know if there is any information I can provide regarding my experience to assist you in giving me a reference. I can be reached at %1$s or %2$s.',
                                 [email, phone]));
        root.find('.thank').html(t('Thank you for your consideration.'));
        root.find('.sincerely').html(t('Sincerely,'));
        root.find('.name').html(t('%1$s %2$s', [firstName, lastName]));

        var emailResponse = root.find('.email-response');
        this.context.find('sendEmail', function () {
            this.on('start', function () {
                $(this.context.getRoot().children()[0]).button( "option", "label", t('Send email'));
                $(this.context.getRoot().children()[0]).click(function () {
                    $.get("/example/controller/text_localization", function (data) {
                        emailResponse.html(data);
                    });
                });
            });
        });
    };

    return ClientTextLocalization;
});
