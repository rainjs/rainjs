=============
Messaging API
=============

Client messaging layer is part of client runtime. In RAIN you have two types of messaging on
the client side: 

   - Intents messaging
   - Publish / subscriber
   
-------
Intents
-------

Intents concept is inspired from android operating system. Basically they allow developer to
express an action that should be executed without being "aware" of the provider. The only 
this developer must know is what data can be passed to that action.

For instance imagine an action called LOG_EVENT. To be able to execute this action you must 
know that an event is described by a message, a timestamp and an optional description.

Using intents is really easy to create a product in which each fragment of functionality can
be easily changed without affecting existing code. Moreover, there might be situations when
multiple action providers exists. The platform will allow user to select what provider to use.

Intents lifecycle
-----------------

It is really important to know that when expressing an intent developer will be able 
to send a json object that holds specific information. For instance, when sending an email 
you already know where you want to send it. The expected behavior is to receive back the send 
mail application with all fields completed.

.. image:: ../images/messaging/messaging_intent_request.png

Intents Usage
-------------

Messaging layer is bind to client runtime. Each client side controller has access to client 
runtime in all its methods. Below you can find an usage example:

.. code-block:: javascript
    :linenos:

    var messaging = this.clientRuntime.messaging;

    var request = {
        viewContext: self.viewContext,
        category: "local_test_intent",
        action: "local_action",
        intentContext: {"message": "This will not work."}
    };

    var intent = messaging.sendIntent(request);

    var fnSuccess = function(data) { alert(JSON.stringify(data)); };
    var fnError = function(ex) { alert(ex.message); };

    intent.then(fnSuccess, fnError);

The above example is extracted from the samples provided by RAIN (intents_example). The 
method used to accessing intents mechanism is sendIntent method. This method accept a 
Dictionary as a parameter. Each intent request must contain the following information:

   + viewContext - This is the requester viewContext object.
   + category - This is the intent category as defined in meta.json file.
   + action - This is the action of the intent.
   + intentContext - This is a dictionary where data specific to the intent are passed.

The sendIntent method returns a promise that can be used to react onsuccess and onerror. If 
you do not specify a callback for error case then the error is automatically thrown. 

Please search for more examples into components/intents_example folder.

--------------------
Publish / Subscriber
--------------------

The publish/subscribe mechanism is an implementation of the observer pattern, and it can be found 
in the messaging object. The way pub/sub works is that you can subscribe to an event, without 
needing to know if the publisher exists or is even initialised, and this gives you a very loosly 
coupled approach. Lets see a usage example:

.. code-block:: javascript
    :linenos:

    var messaging = this.clientRuntime.messaging;

    // subscribe to an event
    messaging.subscribe('sliderReady', function (data) {
            console.log(data);
    }, this.viewContext);

    // publish an event
    messaging.subscribe('sliderReady', {success: true}, this.viewContext);

Now, what this does it that it subscribes to the sliderReady event, and then publishes it. 
The arguments are pretty obvious, the first one is the event name, the second one is the callback 
(for the subscriber) or the data (for the publisher) and the viewContext (used internally for scoping). 
We also provided some aliases to these methods on the viewContext object which do not require the last argument.

We also provide the possibility of namespacing your events, by separating them with the _::_ operator. 
This allows you to scope your events, or if you want to, to subscribe to global events by prefixing your 
event with the :: operator. But enough talk, lets see some code:

.. code-block:: javascript
 	:linenos:

	// subscribe to a local event
	this.viewContext.subscribe('localEvent', function (data) {
		console.log('local event triggered');
	});
	
	// subscribe to a global event
	this.viewContext.subscribe('::globalEvent', function (data) {
		console.log('global event triggered');
	});
	
	// publish the global event
	this.viewContext.publish('::globalEvent');


