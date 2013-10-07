
=====================
Distributed Rendering
=====================

The actual rendering engine needs all the components to be on a single server in order to work.
This proposal describes the changes needed to make RAIN work in a distributed context where
components are located on different servers. The main advantage of this architecture is that
a client request can be processed in parallel on multiple servers. ``Mothership`` is a central
piece of this architecture, it knows where all components are located and resolves the requests
for components located on different servers.

    .. figure:: ../images/proposals/distributed_rendering.png

-----------------
Rendering Process
-----------------

At startup, a RAIN server connects to the ``Mothership`` and sends a message with what components
it can handle and the intents associated with each component. Also, the ``Mothership`` assigns a
server id to this server. This server id should be unique and the same id should be assigned
after a server is restarted (this is useful for tracking log messages that are coming from the
same server).

When a client does a HTTP request for a component, the reverse proxy sends the request to a RAIN
server that can handle requests for that component. The server associates a connection id with this
connection and stores it in an object from where it can retrieve this connection by using the
connection id.

The server starts rendering the requested component and for each child component it finds sends
a render message to the ``Mothership``. This message contains: server id, connection id, session id,
component id, component version (version is optional and it can also be a version fragment),
view id, instance id and the data context for the component.

The ``Mothership`` sends the message to a server that can render the specified component. The
server renders the component and sends a message to the ``Mothership`` containing: server id (this
is the same id as the one from the render message and not the id of the server that rendered the
component), connection id and the rendered component JSON. Additionally, for each new component it
encounters the RAIN server sends a render message to the ``Mothership`` (the server id included in
this message is the id for the initial server, the one that established the connection with the
client). The ``Mothership`` sends the response to the server associated with the server id
specified in the message and this server sends the rendered component to the client on the
connection having the id specified in the message.

Server id is used to identify the server that has the client connection (the only one that can
communicate with this client) when a render response is sent back to the ``Mothership``. The
render response is always sent to this server even if the render request was triggered by another
server (let's imagine the following scenario: server1 holds component1, server2 holds component2
and server3 holds component3. Component1 includes component2 and component2 includes component3.
A request is made for component1. Server1 renders component1 and sends a render message to the
``Mothership`` for the component2 which sends the message to server2. Server2 renders component2
and sends a render message for component3 which is sent to server3. The rendered response from
server3 is not sent back to server2, it is sent directly to server1 which sends the response to the
client).

Connection id is used to identify the client to which the rendered component should be sent.

The process for rendering on websockets is similar, the only differences being that communication
is done on websockets and the connection id identifies an websocket connection instead a HTTP
connection.

----------
Mothership
----------

The ``Mothership`` holds the component id and version for all the components and the servers on
which these components are located. It also holds category and action for all the intents and the
components that can handle these intents.

The latest version for a component can only be determined in the ``Mothership``. This functionality
will be moved from the component registry and the component registry will store the component
metadata for the components located on that server (like views, controllers, permissions etc.).

The ``Mothership`` is able to handle render, websocket and intent messages and resolves them to the
appropriate servers. Websocket channels also contain the component id and version so it doesn't
need to know all the channels. It just sends the message to a server that holds the specified
component.

-----------------------
Ending HTTP Connections
-----------------------

The rendering engine holds a counter with the number of components that still needs to be sent
to the client. When this counter reaches 0 the HTTP connection with the client is closed. This
is done by holding a variable that is incremented when a new component is found and decremented
when the component is sent to the client.

In order to keep this counter in a distributed context, when the render response is sent each
server should also send the number of children for the component that was rendered. The counter
is kept by the server that holds the connection with the client.

---------------------
Error and Placeholder
---------------------

The configuration for the error and placeholder components should be kept by the ``Mothership``
because these should be the same for the whole platform. Also, only the ``Mothership`` can
determine that a component doesn't exist. When a request for an inexistent component is encountered
the ``Mothership`` sends a message to a server that holds the error component to render the 404
view.

When a server encounters an error while rendering a component or the user isn't authorized to
access that component, it sends a message to the ``Mothership`` containing the reason why the
component can't be rendered, which sends a render request for the error component (it also
specifies the appropriate error view).

-----------------------
Mothership Architecture
-----------------------

.. figure:: ../images/proposals/mothership/Use_Case_Diagram__MotherShip__MotherShip_Use_Case.png
    :scale: 70%
    :align: center

    Use Case Diagram



.. figure:: ../images/proposals/mothership/Class_Diagram__MotherShip__Mothership.png
    :scale: 70%
    :align: center

    Class Diagram



.. figure:: ../images/proposals/mothership/Sequence_Diagram__Overview__Overview.png
    :scale: 70%
    :align: center

    Overview Sequence Diagram



.. figure:: ../images/proposals/mothership/Sequence_Diagram__Start_Mothership__Start_Mothership.png
    :scale: 70%
    :align: center

    Start Mothership Sequence Diagram

.. figure:: ../images/proposals/mothership/Sequence_Diagram__Register__Register.png
    :scale: 70%
    :align: center

    Register Server Sequence Diagram



.. figure:: ../images/proposals/mothership/Sequence_Diagram__Unregister__Unregister.png
    :scale: 70%
    :align: center

    Unregister Server Sequence Diagram



.. figure:: ../images/proposals/mothership/Sequence_Diagram__View_Request__View_Request.png
    :scale: 70%
    :align: center

    View Request Sequence Diagram

.. figure:: ../images/proposals/mothership/Sequence_Diagram__WebSocket_Connect__WebSocket_Connect.png
    :scale: 70%
    :align: center

    WebSocket Connect Sequence Diagram



.. figure:: ../images/proposals/mothership/Sequence_Diagram__Intent_Request__Intent_Request.png
    :scale: 70%
    :align: center

    Intent Request Sequence Diagram



.. figure:: ../images/proposals/mothership/Deployment_Diagram__MotherShip__Mothership.png
    :scale: 70%
    :align: center

    Deployment Diagram



.. seealso::

        :doc:`./distributed_websockets`
            Distributed websockets proposal
