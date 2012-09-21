
Distributed Websockets
======================

Currently a RAIN server holds all the components and can decide how to render components or how to
handle websocket messages. However, in a distributed architecture with multiple servers holding
different components this is no longer true. The servers need to collaborate in order to serve
requests. The main problem that appears is how to coordinate the interactions between multiple
RAIN servers.

In the websockets case, a persistent connection needs to be maintained between the client and the
server and the messages have to be dispatched to the appropriate servers.

Proposed Architecture
---------------------

    .. figure:: ../images/proposals/websockets.png

In order to resolve the coordination problem the ``Mothership`` was added to the architecture. It
knows about all the RAIN servers and the components deployed on them. At startup, each RAIN server
connects to the ``Mothership`` and registers all the components, websocket channels and intents (a
persistent TCP connection is used to communicate between the RAIN server and the ``Mothership``).

Each RAIN server starts a Socket.IO server to listen for websocket connections. When a client
initiates a websocket connection, it reaches the load balancer which picks a server and the
connection is established with the server. The RAIN server sends a message to the ``Mothership``
specifying that the client is connected to it (the client is identified by session id). This is
done in order to be able to send messages back to the client.

When the client sends a message, the server sends a message to ``Mothership`` that contains the
session id of the client, the channel on which the message was sent and the actual message.
The ``Mothership`` picks a server that can handle messages on the specified channel and sends the
message to it.

A special case are the events arriving on the core channel (render, log, send_intent, ...). These
events are handled by the ``Mothership``. This is done in order to avoid redundant communication
between the ``Mothership`` and the server. For example in the render case, if the core events
were handled by RAIN servers, it is possible to send the message to a server that can handle
core events, but doesn't have the component that needs to be rendered. To resolve this the
``Mothership`` reads the message and asks a server having the component to render that component.

Another special case is the log event because the message should be rendered on the same server
that rendered the component. To resolve this, a server identifier is added to the instance id and
when a message is logged from the client the instance id is also sent.

When a RAIN server wants to send a message to a client, it sends a request to the ``Mothership``
specifying the session id of the client. The ``Mothership`` sends the message to the server
to which that client is connected instructing it to notify the client.

Load Balancing Strategy
-----------------------

The balancing for websocket connections and HTTP requests is done by the load balancer (HAProxy).
Some issues might appear for browsers that doesn't support the websocket protocol and xhr polling
is used for the transport. The load balancer should be instructed to send all the requests that
belongs to the same client to the same server.

The ``Mothership`` will also do load balancing when a component is located on multiple servers.
For each component, it will construct buckets with the servers on which the component is
deployed. Then it will apply the round robin algorithm for each bucket (to do this it will
store the last server that handled a request for a specific component).
