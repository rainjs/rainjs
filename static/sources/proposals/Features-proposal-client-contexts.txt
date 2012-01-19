====================
Client Side Contexts
====================

In this document you can find information about various context objects and the place where they should be used. This contexts object become extremely useful in client side controllers because they provide information about the view and some important informations.

--------
Overview
--------

.. image:: ../images/proposals/client_contexts.jpeg

------------
View context
------------

View context is used to hold information about the environment in which a client side controller is running for the associated view. All attributes from viewContext are read only.

-------
Example
-------

Imagine the following module definition:

.. code-block:: javascript
    :linenos:

    {
      "id" : "mymodule;1.0",
      "url" : "/modules/mymodule",
      "views" : [
          {"viewId"  : "view-customer-info",
            "view"   : "/htdocs/customer-info.html",
            "controller" : "/htdocs/script/customer-info.js"},
          {"viewId"  : "view-customer-preferences",
            "view"   : "/htdocs/customer-preferences.html",
            "controller" : "/htdocs/script/customer-preferences.js"},
          {"viewId"  : "view-customer-account",
            "view"   : "/htdocs/customer-account.html"}
      ],
      "taglib": [
          {"namespace"  : "",
            "selector"  : "customer-info",
            "viewId"    : "view-customer-info"},
          {"namespace"  : "",
            "selector"  : "customer-prefs",
            "viewId"    : "view-customer-preferences"}
      ]
    }

The markup for view-customer-account is listed below:

.. code-block:: html
    :linenos:

    <body>
    <customer-info id="x" />
    <customer-prefs id="y" />
    </body>


For each view included in the aggregated view listed above the client side controller will get executed.

.. code-block:: javascript
    :linenos:

    <script type="text/javascript">
      // /htdocs/script/customer-info.js
      define(function() {
        function init(viewContext) {
          // you can extract information from view context.
        }

        return {init : init};
      });

      // /htdocs/script/customer-preferences.js
      define(function() {
        function init(viewContext) {
          // you can extract information from view context.
        }

        return {init : init};
      });

The first parameter injected into client side controller must is the viewContext. In this case, viewContext holds the following values:

  - getClientModuleId() ====> mymodule;1.0
  - getInstanceId() =====> x for customer-info and y for customer-preferences.
  - getSettings() =====> {}