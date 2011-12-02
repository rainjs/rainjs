define(function () {
   function init() {
       var controller = this;

       $('a').bind('click', function (event) {
           var name = $('#name').val();
           var age = $('#age').val();

           controller.viewContext.storage.set('name', name, true);
           controller.viewContext.storage.set('age', age, true);
       });

   }

   return {
       init: init
   };
});
