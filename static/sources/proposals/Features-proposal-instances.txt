==============
View Instances
==============

(A view instance is the term for defining the instance of a view **only**, it is not related to Webcomponent Instances, that actually describe a Webcomponent that a) belongs to a certain user, b) has an instance identifier that identifies this instance across sessions)

Currently RAIN generates random identifiers (using auto increment way) when rendering a page. This mean that a fragment might get different identifiers each time the page is rendered. The goal of this proposal is to describe a possible solution in which fragments identifiers are generated uniformly and idempotency is ensured.

-----------------------
Functional requirements
-----------------------

  1. RAIN page must support a fragment to be displayed multiple times.
  2. RAIN fragment must receive an unique identifier.
  3. RAIN must persist page configuration after the first render process.
  4. RAIN must merge page configuration with latest changes.

----------------
Problem examples
----------------

---------------------------
Same view changed over time
---------------------------

Imagine we have an html page with the following structure:

.. code-block:: html
    :linenos:

    <body>
      <module1/>
      <module2/>
    </body>

After several weeks because of some new requirements for the page html structure changes to:

.. code-block:: html
    :linenos:

    <body>
      <module1/>
      <module2/>

      <br/><br/>
      <module3/>
    </body>

Current requirements dictate another change to this page structure:

.. code-block:: html
    :linenos:

    <body>
      <module1/>

      <br/><br/>
      <module3/>
    </body>

Now there is no apparent problem if we don't hold any information about these fragments. But it is 100% sure that RAIN must provide support for configuring the fragments. For instance module1 = weather fragment. If we put that fragment twice in the page we want to be able to display weather for two different locations. This is why we need to save page configuration overtime and to update it when necessary.

.. image:: ../images/proposals/view_evolution.png

-----------------
Possible solution
-----------------

It is pretty clear that RAIN needs to provide a storage where page configuration is saved: (fragments identifiers included within a page). Starting from this idea the markup should be something like:

.. code-block:: html
    :linenos:

    <body>
      <module1 id="1" />
      <module2 id="2" />
    </body>

.. code-block:: html
    :linenos:

    <body>
      <module1 id="1"/>
      <module2 id="2"/>

      <br/><br/>
      <module3 id="3"/>

    </body>

.. code-block:: html
    :linenos:

    <body>
      <module1 id="1"/>

      <br/><br/>
      <module3 id="3"/>
    </body>

Now there is no apparent problem if we don't hold any information about these fragments. But it is 100% sure that RAIN must provide support for fragments customization. The idea behind this solution is pretty simple. Force the creator of the page to provide a unique and consistent identifier for each included fragment. Even if a fragment is removed the identifiers should remain unchanged for all other fragments. The information should be associated with the moduleId + viewId currently accessed.

------
Design
------

.. image:: ../images/proposals/view_instance_overview.png

.. image:: ../images/proposals/view_request_response.png

In the above diagrams it is shown how management of instances is done in RAIN. The main idea is to keep pages configuration into a persistent storage after the first parsing of the page.

-----------
Stored data
-----------

In this section you can find the proposed data that will go into the persistent storage. We have two main use cases: 

   - An user is authenticated to RAIN application.
   - No user is authenticated to RAIN application.

---------------------
No authenticated user
---------------------

When no user information is available (anonymous) RAIN will save page configuration into a global page storage. Below you can find the data that will be written:

.. code-block:: javascript
    :linenos:

    {"pages" : {
       "[page url]" : {
         "[tag]" : {
           "[instanceid]" : {[settings loaded from meta.json file]}},
             ......
        }
    }}

For each accessible url we keep tag configuration into page storage. The instanceid is extracted from markup first time the page is parsed and afterwards it is loaded all the time from page configuration storage. "[tag]" points to a dictionary of instances because we might have the same fragment displayed twice on the page. We want to differentiate between the instances of the same fragment.

-------
Example
-------

.. code-block:: html
    :linenos:

    <body>
      <module1 id="1"/>
      <module2 id="2"/>

      <br/><br/>
      <br/><module3 id="5" />
      <module3 id="3"/>
    </body>

.. code-block:: javascript
    :linenos:

    {"pages" : {
       "application-example;1.0" : {
         "module1" : {
           1 : {[settings loaded from meta.json file]}
         },
         "module2" : {
           2 : {[settings loaded from meta.json file]}
         },
         "module3" : {
           5 : {[settings loaded from meta.json file]},
           3 : {[settings loaded from meta.json file]}
         }
       }
    }

------------------
Authenticated user
------------------

For authenticated users the data structure used for storing page configuration is pretty similar as the global scope. You can see the general format below:

.. code-block:: javascript
    :linenos:

    {"users" :
       "[userId]" : {
         "pages" : {
           "application-example;1.0" : {
             "module1" : {
               1 : {[settings loaded from meta.json file or from user profile]}
             },
             "module2" : {
               2 : {[settings loaded from meta.json file or from user profile]}
             },
             "module3" : {
               5 : {[settings loaded from meta.json file or from user profile]},
               3 : {[settings loaded from meta.json file or from user profile]}
             }
           }
         }
       }
    }

Initially, for an authenticated user the default values apply. These values are saved into user page storage
and loaded for subsequent requests.

-----------
Client side
-----------

All the settings mentioned above will be availabe on client side controller.

.. code-block:: javascript
    :linenos:

    define(function() {
      // module 3 - id 5 client side controller
      function init(viewContext) {
        var settings = viewContext.getSettings(); // this is a map so you can access whatever setting you want.
        var location = settings.location;
      }

      return {init : init};
    });