define(function () {
    function init() {
        var root = this.viewContext.getRoot();
        
        var name = this.viewContext.storage.get('name', true);
        var age = this.viewContext.storage.get('age', true);

        root.find('.name').text(name);
        root.find('.age').text(age);

        this.viewContext.storage.remove('name', true);
        this.viewContext.storage.remove('age', true);
    }

    return {
        init: init
    };
});
