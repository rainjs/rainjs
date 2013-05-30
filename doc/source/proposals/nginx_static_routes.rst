==========================
NginX static routes server
==========================

This document describes NginX and how to integrate it with RAIN so it can server static
routes.

-----
NginX
-----

NginX is a fully mature web server very configurable that can handle and modify requests
depending on it's configuration. The preffered handling configuration
is by using regular expressions.

You can read more about nginx at: .. _a link: http://nginx.org/en/docs/

---------------------
Integrating with RAIN
---------------------

We are using NginX to serve static files/routes through NginX and reduce the load on the
RAIN server. We have chosen to reconfigure the HaProxy to redirect static routes requests
to NginX server and the rest of the requests to the RAIN server. Also we added another command
to rain called ``generate-nginx-conf``. These command helpes you to generate an NginX configuration
file so it knows how to serve the requests and mapping the components with different routes.


.......
HaProxy
.......

This is an example of a valid HaProxy configuration to work with RAIN and NginX by separating the
type of requests.

.. code-block::
    :linenos:

    global
            maxconn 40
            daemon
            #debug
            user nobody

        defaults
                mode http
                option http-server-close
                timeout connect 500000s
                timeout client 500000s
                timeout server 50000s
                timeout http-keep-alive 5000s
                timeout http-request 5000s
                timeout queue 5000s
                timeout tarpit 5000s
                option forwardfor

        listen RAIN_http *:80
                mode http
                stats uri /haproxy
                acl is_javascript path_reg ^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:js)\/(.+)
                acl is_resource path_reg ^\/([\w-]+)\/(?:((?:\d\.)?\d\.\d)\/)?(?:([a-z]{2}_[A-Z]{2})\/)?resources\/(.+)
                use_backend static if is_javascript
                use_backend static if is_resource
                default_backend RAIN_server

        backend RAIN_server
            server s1 127.0.0.1:1337 check fall 1 inter 1000ms

        backend static
        	server s1 127.0.0.1:8080 check fall 1 inter 1000ms


The only things added are the two acl containing regexps, these are needed to redirect the requests
depending on the url path. Also the use of another backend called ``static`` in which you specify where
your NginX server is located and on which port is it listening.


.....
NginX
.....

The only thing that you need here is to install the NginX server on your machine. This is done by
using the following command::
    sudo apt-get install nginx


..........................
RAIN & NginX configuration
..........................

In our current prototype we provide a way to generate the configuration automatically depending on your
components, take into account the version and id.

All you have to do is run the following command::

    rain generate-nginx-conf

In the root path of your rain project you will find a ``nginx.conf`` file. All you have to do is just move
the generated configuration file in to ``/etc/nginx/``.

An example of the output configuration would be:

.. code-block:: javascript
    :linenos:

    user root;
    events {
    	worker_connections 1024;
    }
    http {
    	include mime.types;
    	default_type application/octet-stream;
    	sendfile on;
    	gzip on;
    	upstream backend {
    		server 127.0.0.1:1337;
    	}
    	server {
    		listen 8080;
    		server_name localhost;
    		charset UTF-8;
                location / {
    			}
    			location ~* example/.*(js.*\.js)$ {
    				alias /home/atrifan/my_space/rainjs/components/example_list/client/$1;
    			}
    			location ~* example/.*(resources.*)$ {
    				alias /home/atrifan/my_space/rainjs/components/example_list/$1;
    			}
    			location ~* language_selector/.*(js.*\.js)$ {
    				alias /home/atrifan/my_space/rainjs/components/language_selector/client/$1;
    			}
    			location ~* language_selector/.*(resources.*)$ {
    				alias /home/atrifan/my_space/rainjs/components/language_selector/$1;
    			}
    			location ~* container_example/.*(js.*\.js)$ {
    				alias /home/atrifan/my_space/rainjs/components/container_example_2_0/client/$1;
    			}
    			location ~* container_example/.*(resources.*)$ {
    				alias /home/atrifan/my_space/rainjs/components/container_example_2_0/$1;
    			}
    			location ~* error/.*(js.*\.js)$ {
    				alias /home/atrifan/my_space/rainjs/components/error/client/$1;
    			}
    			location ~* error/.*(resources.*)$ {
    				alias /home/atrifan/my_space/rainjs/components/error/$1;
    			}
    			location ~* external_theming/.*(js.*\.js)$ {
    				alias /home/atrifan/my_space/rainjs/components/external_theming/client/$1;
    			}
    			location ~* external_theming/.*(resources.*)$ {
    				alias /home/atrifan/my_space/rainjs/components/external_theming/$1;
    			}
    			location ~* core/.*(js.*\.js)$ {
    				alias /home/atrifan/my_space/rainjs/components/core/client/$1;
    			}
    			location ~* core/.*(resources.*)$ {
    				alias /home/atrifan/my_space/rainjs/components/core/$1;
    			}
    			location ~* demo_container/.*(js.*\.js)$ {
    				alias /home/atrifan/my_space/rainjs/components/demo_container/client/$1;
    			}
    			location ~* demo_container/.*(resources.*)$ {
    				alias /home/atrifan/my_space/rainjs/components/demo_container/$1;
    			}
    			location ~* placeholder/.*(js.*\.js)$ {
    				alias /home/atrifan/my_space/rainjs/components/placeholder/client/$1;
    			}
    			location ~* placeholder/.*(resources.*)$ {
    				alias /home/atrifan/my_space/rainjs/components/placeholder/$1;
    			}
    			location ~* layout/.*(js.*\.js)$ {
    				alias /home/atrifan/my_space/rainjs/components/layout/client/$1;
    			}
    			location ~* layout/.*(resources.*)$ {
    				alias /home/atrifan/my_space/rainjs/components/layout/$1;
    			}
    			location ~* css-renderer/.*(js.*\.js)$ {
    				alias /home/atrifan/my_space/rainjs/components/css_renderer/client/$1;
    			}
    			location ~* css-renderer/.*(resources.*)$ {
    				alias /home/atrifan/my_space/rainjs/components/css_renderer/$1;
    			}
    	}
    }

You can also change default values in the configuration by editing the ``bin/init/conf/nginx.conf`` file in your
rain folder.
