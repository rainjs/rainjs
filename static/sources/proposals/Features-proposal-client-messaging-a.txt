==========================================
Client Runtime: Messaging API (Proposal A)
==========================================

This layer can be accessed in the client side controllers and allows interaction with all messaging mechanism provided by RAIN.

--------
Overview
--------

.. image:: ../images/proposals/messaging_overview.png

-----------------------
Functional requirements
-----------------------

   1. Messaging layer must provide communication between fragments on client side.
   2. Messaging layer must provide communication between fragments on server side.
   3. Messaging layer must provide pluggable error handling mechanism for server side messaging.
   4. Messaging layer must provide a default behavior in case of server side messaging error.
   5. Messaging layer default error handling behavior must be internationalized.

-------------
Messaging api
-------------

.. image:: ../images/proposals/messaging_api.png

---------------------
Client side messaging
---------------------

Client side messaging is already available in RAIN. It's a simple publish subscriber mechanism. No error handling is required at this level.

^^^^^^^
Example
^^^^^^^

TBD

---------------------
Server side messaging
---------------------

Server side messaging it's similar to intents from Android operating system.

^^^^^^^^^^^^^^^^
Intent lifecycle
^^^^^^^^^^^^^^^^

Intents express "intention" to do something. For instance, an application developer might want to configure a mail server. This should be not his concern but probably an external application concern.

For implementing this mechanism we want to take into consideration authorization process (if a user is allowed to do the requested action) and error handling (as intents will involve asynchronous requests). Moreover intents need to be defined in the application descriptor and must be centralized by RAIN platform.

^^^^^^^^^^^^^^^^
Intent lifecycle
^^^^^^^^^^^^^^^^

.. image:: ../images/proposals/messaging_intent_request.png

It is really important to know that when expressing an intent developer will be able to send a json object that holds specific information. For instance, when sending an email you already know were you want to send it. The expected behavior is to receive back the send mail application with all fields completed.

^^^^^^^^^^^^^^^^^^^^^^
Application descriptor
^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript
    :linenos:

    {
      "id" : "my-app;1.0"
      "url" : "/modules/my-app",
      "views" : [
          {"viewId" : "send-mail-view",
           "view" : "/htdocs/send-mail.html"},
          {"viewId" : "send-mail-google-view",
           "view" : "/htdocs/send-mail-google.html"}
      ],
      "intents" : [
          {"intentId" : "com.1and1.intents.general.microsoft.SEND_MAIL",
           "action" : "com.1and1.intents.general.SEND_MAIL",
           "categoryId" : "com.1and1.controlpanel.mail",
           "viewId" : "send-mail-view"},
          {"intentId" : "com.1and1.intents.general.google.SEND_MAIL",
           "action" : "com.1and1.intents.general.SEND_MAIL",
           "categoryId" : "com.1and1.controlpanel.mail",
           "viewId" : "send-mail-view"}
      ]
    }

^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Client side view controller - source view
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript
    :linenos:

    <script type="text/javascript">
      define(function() {
        function init(viewContext, clientRuntime) {
          var intent = {};

          // add attributes to the intent from the current fragment.
          clientRuntime.messaging.serverMessaging.sendIntent(viewContext, "com.1and1.controlpanel.mail", "com.1and1.intents.general.SEND_MAIL", intent);
        }

        return {init : init};
      });

^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Client side view controller - destination view
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

This is a proposal of how to change the init signature to also reflect the intent object. It is useful to know in the intent view if it was accessed using the intent mechanism or by direct url.

.. code-block:: javascript
    :linenos:

    <script type="text/javascript">
      define(function() {
        function init(viewContext, clientRuntime, intentContext) {
          // you can access intentContext as any other map.
        }

        return {init : init};
      });

IntentContext is nothing else than a map. Following the send mail example it might contain the following information:

.. code-block:: javascript
    :linenos:

    {"to" : "customer@email.com",
     "cc" : ["admin@email.com", ...],
     "bcc" : ["...", ...],
     "subject" : "",
     "body" : "........................."
    }

------------------------------------
Multiple Intents for the same action
------------------------------------

Rain aims to allow replacement / extension of a specific feature. For instance, in the above example we imagined two providers for send mail action. The intent mechanism will decide which one to use (if the user already chose the default one he will not be prompted to choose between available implementations). Also, the security mechanism will be used for showing the possible candidates for a specified action.

------------------------
Messaging Error handling
------------------------

Rain must provide a pluggable mechanism for handling errors in case of server side messaging. Even if error handling is pluggable it must provide a default behavior.