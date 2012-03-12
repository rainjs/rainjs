define([], function(ClientRenderer) {
    /**
     * Example controller class.
     *
     * @name Controller
     * @class a controller instance
     * @constructor
     */
    function Controller() {
        // constructor logic here
    }

    /**
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     *
     * @function
     */
    Controller.prototype.init = function () {
        console.log('example component (view index) was initialized.');
    };

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * @function
     */
    Controller.prototype.start = function () {
        console.log('example component (view index) was started.');

        var context = this.context;
        var dom = $('<div></div>');
        context.getRoot().append(dom);
        context.getRoot().find('.button').click(function(){
            context.replace({
                id: "hello_world",
                view: "index",
                placeholder: false
            });
        });
        context.getRoot().find('.button2').click(function(){
            context.insert({
                id: "hello_world",
                view: "index",
                placeholder: true
            }, dom);
        });
    };
    
    /**
     * Destroy lifecycle step that happens before a component gets deregistered
     * 
     * @function
     */
    Controller.prototype.destroy = function () {
        console.log('example component (view index) destroyed!');
    };

    return Controller;
});
