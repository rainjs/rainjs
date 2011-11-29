define(function () {
    function init() {
        var name = this.viewContext.storage.get('name', true);
        var age = this.viewContext.storage.get('age', true);

        $('body').html('<p>Welcome ' + name + '!</p><p>You are ' + age + ' years old</p>');

        this.viewContext.storage.remove('name', true);
        this.viewContext.storage.remove('age', true);
    }

    return {
        init: init
    };
});
