====================
Elastic architecture
====================

In this document you can find the overview of elastic RAIN architecture. Each component of the architecture is described in great detail.

---------
Revisions
---------

+--------------+--------------+--------------------------------------------+
| Author       | Version      | Changes                                    |
+==============+==============+============================================+
| Radu Cosnita | 1.0-SNAPSHOT | Initial proposal for elastic architecture. |
+--------------+--------------+--------------------------------------------+

-----
Scope
-----

RAIN must be a framework that provides a compatible web 2.0 way of developing application. RAIN takes into consideration deployment details and provides a rich API for interacting with every piece of the architecture.

----------------------
Stakeholders interests
----------------------

+------------------------+---------------------------------------+-------------------------------------------------------+
| Stakeholder            |   Interests                           |   Acceptance scenario                                 |
+========================+=======================================+=======================================================+
| Network administrators | - RAIN deployment control             | - Stress tests - more detailed description will come. |
|                        | - RAIN monitoring                     | - Failover tests.                                     |
|                        | - RAIN deployment performance         | - Monitoring tests.                                   |
|                        |                                       | - Dynamic configuration tests.                        |
+------------------------+---------------------------------------+-------------------------------------------------------+
| Developers             | - Create new control center for RAIN. | - Stable api.                                         |
+------------------------+---------------------------------------+-------------------------------------------------------+

----------------------------
Functional requirements (FR)
----------------------------

Here you can find all the functional requirements for this architecture.

   1. RAIN must support small units of code acting as a single application.
   2. RAIN must provide an infrastructure map.

---------------------------------
Non functional requirements (NFR)
---------------------------------

   1. RAIN must reuse already tested load balancers.

---------
Use cases
---------

^^^^^^^^^^^^^^^^^^^^
RAIN Cloud in action
^^^^^^^^^^^^^^^^^^^^

Please read :doc:`/proposals/Features-proposal-rain-cloud-action` for a simple example of RAIN cloud.

------
Design
------

.. image:: ../images/proposals/elastic_overview.png

In the above diagram you can see a small cloud rain deployment. The idea behind this architecture is that we have an cloud orchestrator (hypervisor) that can at any time provide information about the cloud. The communication is done through web sockets and is event based. The purpose is to obtain an incomplete connected graph that is used based on some criterias: the components that can be handled by a cloud unit, cpu usage, bandwidth usage, ram usage and so on. The hypervisor should _orchestrate_ this interaction. 

From a technical perspective communication between rain servers and hypervisor and motherships and hypervisor can be done through web sockets.

Also the hypervisor should allow through it's public API to dynamically change the cloud structure:

   1. Deploy a new webcomponent.
   2. Instantiate a new webcomponent.
   3. Destroy an instance of a webcomponent.
   4. Undeploy an instance of a webcomponent.

^^^^^^^^^^^
RAIN Server
^^^^^^^^^^^

A rain server is a node that is responsible for doing aggregation and applying cross cutting concerns provided by RAIN framework. A rain server can be connected to one or more motherships simultaneously. On long run new mothership connection will be probably opened.

^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
RAIN Hypervisor - Component mothership map
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

This is a mechanism for holding information about each mother web components instances. This is really useful if you are interested in finding out which are the motherships who can provide information about certain webcomponents instances.

Same web component instance might be run on one or more motherships.

^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
RAIN Hypervisor - Servers map
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

This is a mechanism for holding information about the rain servers that can correctly render specific urls. This comes handy when you need to select a rain server to handle a request. After the first request a sticky session behavior is desired for improving performance.

^^^^^^^^^^^^^^
RAIN Cloud API
^^^^^^^^^^^^^^

RAIN Cloud API is intended to become the only interface that provides information about RAIN Cloud and orchestrate the wiring process. In this context wiring define the link between a RAIN Server and a subset of running motherships.

Below you can find all operations defined in REST manner that must be provided by RAIN Cloud API:

+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
| Group        | Operation                       | HTTP method                                    | HTTP Headers                     | HTTP | Description                                                                                                     |
|              |                                 |                                                |                                  | body |                                                                                                                 |
+==============+=================================+================================================+==================================+======+=================================================================================================================+
|                                                                                                                                                                                                                                                             |
| We assume that cloud api is deployed within the intranet and has an url assigned to it. Of course the environment can be load balanced.                                                                                                                     |
| The accessible url might be: https://cloud.rain.1and1.com/. All operation urls are relative to this address.                                                                                                                                                |
|                                                                                                                                                                                                                                                             |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
| RAIN Servers | Load registered rain servers.   | GET - /rainservers/all                         | - Content-Type: application/json |      | Obtain a list of all registered rain servers.                                                                   |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Load rain servers handled urls. | GET - /rainservers/{serverid}/urls             | - Content-Type: application/json |      | Obtain a list of url that can be handled by a specified rain server.                                            |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Register a new rain server.     | POST - /rainservers/                           | - Content-Type: application/json |      | Register a new RAIN server.                                                                                     |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
|              |                                 |                                                | - [rain server data]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Reset a rain server wiring.     | PUT - /rainservers/{rainserverid}              | - Content-Type: application/json |      | Reset a RAIN server. This mean that connection with mothership is closed and each cached information of this    |
|              |                                 |                                                | - accept: application/json       |      | rain server is flushed away. The hypervisor will reconfigure this rain server when necessary.                   |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Unregister a rain server.       | DELETE - /rainservers/{rainserverid}           | - Content-Type: application/json |      | Unregister a RAIN server.                                                                                       |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
| Mothership   | Load all motherships.           | GET - /mothership/all                          | - Content-Type: application/json |      | Obtain a list of all registered motherships.                                                                    |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Load mothership summary.        | GET - /mothership/{mothershipid}               |                                  |      | Obtain a summary of the specified mothership.                                                                   |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Load mothership components      | GET - /mothership/{mothershipid}/webcomponents | - Content-Type: application/json |      | Obtain all webcomponents instances currently deployed in the specified mothership.                              |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Register mothership             | POST - /mothership/                            | - Content-Type: application/json |      | Register a new mothership to the hypervisor.                                                                    |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
| Webcomponent | Load all deployed components    | GET - /webcomponent/all?start=[start_record]   | - Content-Type: application/json |      | Operation used to obtain a list of all deployed web components within the cloud.                                |
|              |                                 | &range=[num_of_records]                        | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Load detailed information about | GET - /webcomponent/{id}/{version}             | - Content-Type: application/json |      | Operation used to obtain information about an available webcomponent within the cloud: motherships on which is  |
|              | an available webcomponent.      |                                                | - accept: application/json       |      | deployed, description, and other things.                                                                        |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Load webcomponent descriptor.   | GET - /webcomponent/{id}/{version}/descriptor  | - Content-Type: application/json |      | Operation used to obtain the configuration descriptor of a webcomponent (meta.json content).                    |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Load web component statistics.  | GET - /webcomponent/{id}/{version}/statistics  | - Content-Type: application/json |      | Operation used to obtain monitoring information about an available webcomponent.                                |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Load webcomponent instance      | GET - /webcomponent/{instanceid}               | - Content-Type: application/json |      | Operation used to obtain information about a specific web component instance.                                   |
|              | information.                    |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Instantiate a specified         | POST - /webcomponent/{id}/{version}            | - Content-Type: application/json |      | Operation used to instantiate a specified webcomponent. Within this operation a complex processing will take    |
|              | webcomponent.                   |                                                | - accept: application/json       |      | place. A suitable mothership will be selected. All rain servers that require information about the new instance |
|              |                                 |                                                | - user: [user token]             |      | will open a connection to the chosen mothership (if no previous connection is available). Probably monitoring   |
|              |                                 |                                                |                                  |      | will also be enabled here. An instance identifier will be returned to client.                                   |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Cluster a webcomponent instance.| POST - /webcomponent/{instanceId}              | - Content-Type: application/json |      | Operation used to clone a web component instance to another mothership. Each change of the instance will be     |
|              |                                 |                                                | - accept: application/json       |      | replicated to both motherships.                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Load detailed information about | PUT - /webcomponent/{id}/{version}             | - Content-Type: application/json |      | Operation used to refresh all instances of the specified webcomponent.                                          |
|              | an available webcomponent.      |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Undeploy a specified            | DELETE - /webcomponent/{id}/{version}          | - Content-Type: application/json |      | Operation used to undeploy all instances of a specified webcomponent.                                           |
|              | webcomponent.                   |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Stop instance.                  | DELETE - /webcomponent/{instanceid}            | - Content-Type: application/json |      | Operation used to stop a specific instance.                                                                     |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+
|              | Refresh instance.               | PUT - /webcomponent/{instanceid}               | - Content-Type: application/json |      | Operation used to refresh a specific instance.                                                                  |
|              |                                 |                                                | - accept: application/json       |      |                                                                                                                 |
|              |                                 |                                                | - user: [user token]             |      |                                                                                                                 |
+--------------+---------------------------------+------------------------------------------------+----------------------------------+------+-----------------------------------------------------------------------------------------------------------------+

-----------------------------
RAIN Hypervisor Communication
-----------------------------

RAIN Hypervisor node is the most complex one from RAIN. It holds information about each running piece (RAIN specific) from the infrastructure. For this to be achievable each running piece must communicate with the hypervisor. The question is how do we want to implement this:

   1. Use web sockets. (this will definitely provide faster feedback but might generate network issues).
   2. Use a REST api and communicate over http. (This will be slower and does not provide real time feedback - not without pooling anyway).

^^^^^^^^^^^^^^
Tehnology used
^^^^^^^^^^^^^^

   1. For websockets we consider using socketio library. This is already used in RAIN core implementation. Please read carefully https://github.com/LearnBoost/socket.io/wiki/Socket.IO-and-firewall-software.
   2. For REST api we can simply use nodejs http library.

^^^^^^^^
Upcoming
^^^^^^^^
  
   1. Web sockets to do

     1. Create a protocol within RAIN Cloud that allows efficient communication between RAIN pieces.
     2. Create test scenarios that take into consideration possible firewall issues.

   2. REST api

     1. Create the REST operations.
     2. Deployment must be taken into consideration.
     3. Security concerns are also important for this approach.

------------
Code samples
------------

*Here come code samples meant to show how developers will use this feature.*

--------
Timeline
--------

*Here the estimated work of the feature must be split into packages of work that are correlated with the milestones.*

+-----------+--------------+----------+
| Milestone | Usable parts | Comments |
+===========+==============+==========+
|           |              |          |
+-----------+--------------+----------+
