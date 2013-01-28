---------------
RAIN Clustering
---------------

The proposed strategy for the clustering of a RAIN server to take advantage of all the CPU cores
on the host machine is using HAProxy as a load balancer for multiple RAIN Workers hosted on different
ports. This strategy has multiple advantages over node's builtin cluster module:

    * the posibility to leverage an already existing load balancing infrastructure
    * no need to have a dedicated memory queue for the syncronization of socket.io connections across
      multiple servers by using keep-alive and sticky sessions on the reverse proxy
    * no need to add another load balancing step in the infrastructure (if it already has a load balancer)

...........................
Cluster module deficeincies
...........................

After reasearching the viability of using the builtin node cluster module the following problems were identified

    * problems with socket.io due to no synchronization of handshakes across all workers which causes
      socket.io not to recognize the user if the socket ends up connecting to a different node than the
      one which executed the handshake
    * an extra load balancing step added to the infrastructure, with no way of controlling the algorithm
