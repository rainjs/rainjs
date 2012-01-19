======================
Client Runtime Storage
======================

In this document client storage approach is described in detail.

-----------------------
Functional requirements
-----------------------

  1. Application developers must be able to store information on browser level.
  2. Application developers must be able to store sensitive data in a secure way.
  3. Application developers must be able to share data across multiple pages.
  4. Application developers must be able to clear the storage on demand.
  5. Application developers must be able to persist the storage on demand.
  6. Application developers must be able to intercept the storage events.
  7. ClientStorage must guarantee that private storage is isolated and can not be overriden by other components.

---------
Use cases
---------

------------
Linked pages
------------

Two or more pages might need to change data between them. Imagine a wizard or a checkout process. Many frameworks achieve this goal using a server side storage (usually session). Of course it's also possible to pass the parameters between pages using GET / POST requests. This becomes annoying when you manually change the url (in GET case) or you do a refresh (POST).

In RAIN we want to provide a lightweight solution to this problem (HTML5 storage / dojo storage). 

^^^^^^^^
Solution
^^^^^^^^

.. image:: ../images/proposals/client_storage_pages_shared_session.jpeg

One solution for this is that a set of pages to share a region of session. The reason for this is that in the end we expect the shared region to be cleared.

------
Wizard
------

Same problem as linked pages.

------------
Offline mode
------------

Imagine the "Compose email" page from gmail. You might spend a lot of time on that page. While you type and create a very nice email your internet connection fails. If the content was not previously saved in a storage and you get temporary unavailable you would have lost your work.

^^^^^^^^
Solution
^^^^^^^^

In RAIN we'll provide a local storage mechanism that allows you to save the state of your application. In addition we can provide helper methods that provide auto save mechanism for instance.

.. image:: ../images/proposals/client_page_persistence_storage.jpeg

--------------------------------
Multiple fragments communication
--------------------------------

^^^^^^^^^^^^^^^^^^^^
Within the same page
^^^^^^^^^^^^^^^^^^^^

Imagine you have a page in which you display user information (into a div). Next to it you display the shopping cart content (in another div with title attribute = to user name). In addition you also have another section in which you display ordering history (in a separate div where you also display user name). In this scenario in the first div you can change user name. 

We must be able to propagate user name change in all places where it appears in the page.

^^^^^^^^^^^^^^^^^^^^^
Across multiple pages
^^^^^^^^^^^^^^^^^^^^^

Imagine the scenario presented above except shopping cart is presented into a new window.

We want user name changed within a window to be propagated to other windows as well.
amplify.request

^^^^^^^^
Solution
^^^^^^^^

The storage that keep the user name value should provide a notification mechanism. It will use listeners for this goal.

------
Design
------

From the use cases presented above result two major storage mechanism:

   - a persistent storage
   - a transient storage

Each storage must provide the following partitions:

   - a private / dedicated partition - a shared scope for a limited number of pages / objects.
   - a global partition - a global scope accessible by everyone.

---
API
---

.. image:: ../images/proposals/client_storage_api.jpeg

As you can see in the above diagram the concepts described in this document are abstracted into an API. Our goal is that underline this API HTML 5 localStorage and sessionStorage objects are used transparently.

For having access to a private storage or to be able to create a new private storage a client side controller must provide the view context under which is running.

^^^^^^^^^^^^^^^^^^^^^^^
Private storage example
^^^^^^^^^^^^^^^^^^^^^^^

.. image:: ../images/proposals/client_storage_partitions_example.jpeg

As you can see in the above diagram the global storage from ClientRuntime is designed to be hierarchical. Most of the time applications will use dedicated storage on which they operate. Of course they can also use global storage if they want.

^^^^^^^
API doc
^^^^^^^
--------------------------
Code examples (Proposal 1)
--------------------------

^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Transient storage referencing
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: javascript
    :linenos:

    <script type="text/javascript">
    /** 
    Wizard create user - page1.html
    **/
    var clientRuntime = new ClientRuntime();

    var clientStorage = clientRuntime.storage.createPrivateStorage("wizardUser", true);
    clientStorage.setValue("username", "radu");
    clientStorage.setValue("password", "mydummypassword");

.. code-block:: javascript
    :linenos:

    <script type="text/javascript">
    /** 
    Wizard create user - page2.html
    **/
    var clientRuntime = new ClientRuntime();

    var clientStorage = clientRuntime.storage.getPrivateStorage("wizardUser", true);
    alert(clientStorage.getValue("username"));

This code will work perfectly also for persistent storage.

^^^^^^^^^^^^^^^^^
Storage listeners
^^^^^^^^^^^^^^^^^

.. code-block:: javascript
    :linenos:

    <script type="text/javascript">
    /** 
    Page view user info - user_view.html
    **/
    var clientRuntime = new ClientRuntime();
    var clientStorage = clientRuntime.storage.getPrivateStorage("userinfo", false);
    clientStorage.addListener(function(evt) {
      if(evt.key == "username") {
        $("#username") = evt.newvalue;
      }
    });

.. code-block:: javascript
    :linenos:

    <script type="text/javascript">
    /** 
    Page customize user info - user_edit.html
    **/
    var clientRuntime = new ClientRuntime();
    var clientStorage = clientRuntime.storage.getPrivateStorage("userinfo", false);
    clientStorage.setValue("username", "Radu Cosnita"); // this triggers listener registered in user_view.html page.  

-----------
Limitations
-----------

1. You must be aware on the fact that storage marked transparently can be referenced across multiple pages only if pages are displayed within the same tab or window. This is really important to take in consideration when using storages.

  1. The above mentioned limitation applies also to listeners.

-----------------
Technical details
-----------------

The intention is to provide a proof of concept for this feature as soon as possible. Before we decide on this there are some frameworks that guarantee graceful degrade in case storage is not supported by browsers. Below you can find a list of such frameworks:

   - Amplifyjs - http://amplifyjs.com/api/store/
   - Dojo storage - http://google-opensource.blogspot.com/2008/03/dojo-storage.html - I think this will bring an overhead (we already use jQuery).

An alternative to the frameworks mentioned about would be to simply assume all browsers that access RAIN specific applications have HTML 5 support and we do not provide gracefully degrading support.