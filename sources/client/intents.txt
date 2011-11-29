==================
Intents Client API
==================

On client side intents are really easy to use. Before explaining the details please read 
the following example (extracted from intents_example sample)::

   function start() {
      ....
      
      var messaging = this.clientRuntime.messaging;
      
      btnMissing.click(function() {
            var request = {
                "viewContext": self.viewContext,
                "category": "local_test_intent",
                "action": "local_action"
            };
            
            var intent = messaging.sendIntent(request);
            
            intent.then(function(data) {
                console.log("Cool stuff: " + data);
            },
            function(data) {
                alert("ERROR: " + data);
            });
        });
      
      ....
   }
   
As you can see in the above example there is one single method to use for intents::

   Raintime.messaging.sendIntent(request);
   
Request argument is a dictionary that must contain at least:

   + viewContext
   + category
   + action
   
Optionally you might send an intent context where additional parameters are passed to
the intent handler.

The sendIntent method returns a promise that you can use to register callback methods for
success and error scenarios. For this you can use::

   then(successHandler, errorHandler);
   
Intents technical details
-------------------------

Intents Client API is implemented using web sockets. This mean that we have a special
handler on the server side that receives intents request. This is an optimization done
from communication perspective because no handshake needs to be done for each request.
Moreover, on the server side intents automatically get access to the user session even if
the request is not http based.