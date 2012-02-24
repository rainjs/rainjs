define(["authorization_example/jquery-ui-1.8.16.custom.min"], function() {
    /**
     * Creates a AuthorizationExample component instance.
     *
     * @name AuthorizationExample
     * @class AuthorizationExample controller class
     * @constructor
     */
    function AuthorizationExample() {
        // constructor logic here
    }

    /**
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     *
     * @function
     */
    AuthorizationExample.prototype.init = $.noop;

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * Find user links and simulate login behavior.
     */
    AuthorizationExample.prototype.start = function () {
        var root = this.viewContext.getRoot();
        root.find('#nouser').button().click(function (event) {
            simulateUserLogin('nouser');
        });
        root.find('#user1').button().click(function (event) {
            simulateUserLogin('user1');
        });
        root.find('#user2').button().click(function (event) {
            simulateUserLogin('user2');
        });
    };

    /**
     * Simulates a login action by making a post to a server-side controller that stores
     * mocked information about a logged user.
     *
     * @param {String} userId the user id
     * @memberOf AuthorizationExample#
     */
    function simulateUserLogin(userId) {
        var data = {user: userId};
        $.ajax({
            url: '/components/authorization_example/controller/serverside.js',
            type: 'POST',
            dataType: 'json',
            data: data,
            async: false,
            success: function (result) {
                // Redirect to the page where we can see the authorization state for the current
                // logged user.
                window.location = window.location.href.replace('index.html', 'buttons.html');
            }
        });
        return false;
    }

    return AuthorizationExample;
});
