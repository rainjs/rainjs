==================
RAIN authorization
==================

Authorization process is a major security concern of each web framework. Currently on the web there are more approaches to this topic. Some web frameworks provide RBAC implementations some offer custom solutions. In RAIN we intend to support mainly RBAC approach.

-----------------------
Functional requirements
-----------------------

   1. RAIN must support components authorization.
   2. RAIN must support pluggable authorization.

------
Design
------

.. image:: ../images/proposals/rain_authorization.png

In the above diagram you can see how authorization will be implemented in RAIN. Rain components security is mainly achieved through permissions. In RAIN, the developer must provide an implementation of AuthorizationProvider interface based on the security system implemented.

In the API only check... methods are mandatory. load methods are optional and can throw an UnsupportedException for instance.

----------------------
Authorization sequence
----------------------

.. image:: ../images/proposals/rain_authorization_sequence.png

In the above diagram you can see how RAIN will authorize requests to components. For improving the performance an AuthorizationProvider implementation can have cache mechanism included. Also, above diagram does not show authorization provider dependencies (for instance a rest / soap call).

-------------------------------
Defining authorization provider
-------------------------------

Authorization providers are pluggable pieces into RAIN and there is no constraint on the number of providers that a RAIN server can run. 

.. code-block:: javascript
    :linenos:

    # server.conf
    {
       ....
       "security" : {
          "authorization_providers" : {
              "saml_provider" : "/lib/providers/authorization_saml.js",
              "cust_provider" : "/lib/providers/authorization_custom.js"
          }
       }
    }

An alternative to explicit defining providers in server.conf is to auto discover the providers. All implemented providers should be placed under /lib/providers. They will be identified using the file name without js extension.