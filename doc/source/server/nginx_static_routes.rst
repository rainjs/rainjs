==========================
NginX static routes server
==========================

This document describes NginX and how to integrate it with RAIN so it can serve static
routes.

-----
NginX
-----

NginX is a fully mature web server very configurable that can handle and modify requests
depending on it's configuration. The preferred handling configuration
is by using regular expressions.

You can read more about nginx at: `http://nginx.org/en/docs/ <http://nginx.org/en/docs/>`_

---------------------
Integrating with RAIN
---------------------

We are using NginX to serve static files/routes through NginX and reduce the load on the
RAIN server. We have chosen to reconfigure the HaProxy to redirect static routes requests
to NginX server and the rest of the requests to the RAIN server. Also we added another command
to rain called ``generate-nginx-conf``. This command helps you to generate an NginX configuration
file so it knows how to serve the requests and mapping the components with different routes.


.......
HaProxy
.......

This is an example of a valid HaProxy configuration to work with RAIN and NginX by separating the
type of requests.

.. code-block:: javascript
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
        acl is_javascript path_reg ^\/[\w-]+\/((\d(\.\d)?(\.\d)?)\/)?js\/.+
        acl is_resource path_reg ^\/[\w-]+\/((\d\.)?\d\.\d\/)?resources\/.+
        use_backend static if is_javascript
        use_backend static if is_resource
        default_backend RAIN_server

    backend RAIN_server
        server s1 127.0.0.1:1337 check fall 1 inter 1000ms

    backend static
        server s1 127.0.0.1:8080 check fall 1 inter 1000ms


The only things added are the two acl containing regexps, these are needed to redirect the requests
depending on the url path. Also the use of another backend called ``static`` in which you specify
where your NginX server is located and on which port is it listening. In the regexp for
resources the paths like ``/en_US/resources/filename`` were excluded because additional
processing needs to be done by RAIN


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


Examples::

  $ rain generate-nginx-conf

Optional parameters can be provided in the build.json file.
If no option is specified in the build.json, it will use ``bin/conf/nginx.conf`` from RAIN to generate
a ``nginx.conf`` file in the project root.

The optional parameters are ``sourcePath``, ``destinationPath``, ``productionPath``
and ``additionalProjectsProductionPaths``.

An example of the build.json file would be:

.. code-block:: javascript
    :linenos:

    {
        "javascriptMinification": true,
        "cssMinification": false,
        "buildPath": "../min/sprint",
        "productionPath": "/opt/ui/opt/rainjs-ssa/",
        "additionalProjects": ["../rainjs"],
        "additionalProjectsProductionPaths": ["/opt/ui/lib/node_modules/rain/"],
        "nginxConfig": {
            "sourcePath": "./conf/nginx.conf",  //where the source nginx config file is located
            "destinationPath": "./nginx.conf"   //where the computed config will be generated
        }
    }

After running the command all you have to do is to move the generated configuration file in ``/etc/nginx/``.

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
            location ~* example/(js.*\.js)$ {
                alias /home/atrifan/my_space/rainjs/components/example_list/client/$1;
            }
            location ~* example/(resources.*)$ {
                alias /home/atrifan/my_space/rainjs/components/example_list/$1;
            }
            location ~* language_selector/(js.*\.js)$ {
                alias /home/atrifan/my_space/rainjs/components/language_selector/client/$1;
            }
            location ~* language_selector/(resources.*)$ {
                alias /home/atrifan/my_space/rainjs/components/language_selector/$1;
            }
            location ~* container_example/(js.*\.js)$ {
                alias /home/atrifan/my_space/rainjs/components/container_example_2_0/client/$1;
            }
            location ~* container_example/(resources.*)$ {
                alias /home/atrifan/my_space/rainjs/components/container_example_2_0/$1;
            }
            location ~* error/(js.*\.js)$ {
                alias /home/atrifan/my_space/rainjs/components/error/client/$1;
            }
            location ~* error/(resources.*)$ {
                alias /home/atrifan/my_space/rainjs/components/error/$1;
            }
            location ~* external_theming/(js.*\.js)$ {
                alias /home/atrifan/my_space/rainjs/components/external_theming/client/$1;
            }
            location ~* external_theming/(resources.*)$ {
                alias /home/atrifan/my_space/rainjs/components/external_theming/$1;
            }
            location ~* core/(js.*\.js)$ {
                alias /home/atrifan/my_space/rainjs/components/core/client/$1;
            }
            location ~* core/(resources.*)$ {
                alias /home/atrifan/my_space/rainjs/components/core/$1;
            }
            location ~* demo_container/(js.*\.js)$ {
                alias /home/atrifan/my_space/rainjs/components/demo_container/client/$1;
            }
            location ~* demo_container/(resources.*)$ {
                alias /home/atrifan/my_space/rainjs/components/demo_container/$1;
            }
            location ~* placeholder/(js.*\.js)$ {
                alias /home/atrifan/my_space/rainjs/components/placeholder/client/$1;
            }
            location ~* placeholder/(resources.*)$ {
                alias /home/atrifan/my_space/rainjs/components/placeholder/$1;
            }
            location ~* layout/(js.*\.js)$ {
                alias /home/atrifan/my_space/rainjs/components/layout/client/$1;
            }
            location ~* layout/(resources.*)$ {
                alias /home/atrifan/my_space/rainjs/components/layout/$1;
            }
            location ~* css-renderer/(js.*\.js)$ {
                alias /home/atrifan/my_space/rainjs/components/css_renderer/client/$1;
            }
            location ~* css-renderer/(resources.*)$ {
                alias /home/atrifan/my_space/rainjs/components/css_renderer/$1;
            }
    	}
    }

You can also change default values in the configuration by editing the ``bin/conf/nginx.conf``
file in your rain folder.

............
Short Review
............

 1. install nginx
 2. generate a configuration and copy it to ``/etc/nginx/nginx.conf``
 3. change haproxy configuration to look like the valid one from above
 4. restart nginx
 5. restart haproxy

-------------------------
Using NginX in production
-------------------------

If the production path parameters are used, all the paths in the nginx configuration file will be
calculated according to the specified production paths.
It is mandatory for the production parameters to be absolute paths.

It is also mandatory for the ``productionPath`` paramameter to be present for
the ``additionalProjectsProductionPaths`` array be taken into consideration.

.. note::

    The paths from ``additionalProjectsProductionPaths`` have to be in the same order as the ones
    from the ``additionalProjects`` array.


1. Add the production path for your project in the build.json file:

.. code-block:: javascript
    :linenos:

    {
            "javascriptMinification": true,
            "cssMinification": false,
            "buildPath": "../min/sprint",
            "productionPath": "/opt/ui/opt/rainjs-ssa/",   //the production path of your project
            "additionalProjects": ["../rainjs"],           //local paths of additional projects
            "additionalProjectsProductionPaths": ["/opt/ui/lib/node_modules/rain/"],
            "nginxConfig": {
                //relative or absolute path of the nginx configuration source file:
                "sourcePath": "./conf/nginx.conf",
                //relative or absolute path for the generated configuration:
                "destinationPath": "./nginx.conf"
            }
    }

2. Make sure the additional projects are specified in the ``build.json``
file along with their production paths like in the above example.


3. If you want NginX to respond with specific http error messages in the resulted configuration
add a rule similar to the one from below::

       error_page  404  /404.html;
       location = /404.html {
            root /home/fdobre/rainjs/components/error/client/templates;
       }

4. The NginX Configuration production example:

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

            error_page  404  /404.html;
            location = /404.html {
                root /opt/ui/opt/http_errors;
            }

            location / {
            }
            location ~* accordion/2.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/accordion/client/$1;
            }
            location ~* accordion/2.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/accordion/$1;
            }
            location ~* carousel/1.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/carousel/client/$1;
            }
            location ~* carousel/1.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/carousel/$1;
            }
            location ~* contract_selector/4.1/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/contract_selector/client/$1;
            }
            location ~* contract_selector/4.1/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/contract_selector/$1;
            }
            location ~* datagrid/1.1/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/datagrid/client/$1;
            }
            location ~* datagrid/1.1/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/datagrid/$1;
            }
            location ~* error_1and1/1.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/error/client/$1;
            }
            location ~* error_1and1/1.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/error/$1;
            }
            location ~* sprint_example_list/1.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/example_list/client/$1;
            }
            location ~* sprint_example_list/1.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/example_list/$1;
            }
            location ~* form/2.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/form/client/$1;
            }
            location ~* form/2.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/form/$1;
            }
            location ~* modal/1.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/modal/client/$1;
            }
            location ~* modal/1.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/modal/$1;
            }
            location ~* placeholder_1and1/1.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/placeholder/client/$1;
            }
            location ~* placeholder_1and1/1.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/placeholder/$1;
            }
            location ~* quicksearch/1.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/quicksearch/client/$1;
            }
            location ~* quicksearch/1.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/quicksearch/$1;
            }
            location ~* quota-indicator/1.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/quota_indicator/client/$1;
            }
            location ~* quota-indicator/1.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/quota_indicator/$1;
            }
            location ~* slider/1.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/slider/client/$1;
            }
            location ~* slider/1.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/slider/$1;
            }
            location ~* system/1.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/system/client/$1;
            }
            location ~* system/1.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/system/$1;
            }
            location ~* ToDo/1.0/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/todo/client/$1;
            }
            location ~* ToDo/1.0/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/todo/$1;
            }
            location ~* user/1.1/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/user/client/$1;
            }
            location ~* user/1.1/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/user/$1;
            }
            location ~* container_example/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/container_example/client/$1;
            }
            location ~* container_example/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/container_example/$1;
            }
            location ~* container_example/2.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/container_example_2_0/client/$1;
            }
            location ~* container_example/2.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/container_example_2_0/$1;
            }
            location ~* core/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/core/client/$1;
            }
            location ~* core/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/core/$1;
            }
            location ~* css31/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/css31/client/$1;
            }
            location ~* css31/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/css31/$1;
            }
            location ~* css_min_app1/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_min_app1/client/$1;
            }
            location ~* css_min_app1/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_min_app1/$1;
            }
            location ~* css_min_app2/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_min_app2/client/$1;
            }
            location ~* css_min_app2/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_min_app2/$1;
            }
            location ~* css-renderer/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_renderer/client/$1;
            }
            location ~* css-renderer/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_renderer/$1;
            }
            location ~* demo_container/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/demo_container/client/$1;
            }
            location ~* demo_container/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/demo_container/$1;
            }
            location ~* error/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/error/client/$1;
            }
            location ~* error/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/error/$1;
            }
            location ~* example/3.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/example_list/client/$1;
            }
            location ~* example/3.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/example_list/$1;
            }
            location ~* external_theming/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/external_theming/client/$1;
            }
            location ~* external_theming/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/external_theming/$1;
            }
            location ~* language_selector/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/language_selector/client/$1;
            }
            location ~* language_selector/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/language_selector/$1;
            }
            location ~* layout/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/layout/client/$1;
            }
            location ~* layout/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/layout/$1;
            }
            location ~* placeholder/1.0/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/placeholder/client/$1;
            }
            location ~* placeholder/1.0/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/placeholder/$1;
            }
            location ~* accordion/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/accordion/client/$1;
            }
            location ~* accordion/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/accordion/$1;
            }
            location ~* carousel/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/carousel/client/$1;
            }
            location ~* carousel/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/carousel/$1;
            }
            location ~* contract_selector/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/contract_selector/client/$1;
            }
            location ~* contract_selector/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/contract_selector/$1;
            }
            location ~* datagrid/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/datagrid/client/$1;
            }
            location ~* datagrid/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/datagrid/$1;
            }
            location ~* error_1and1/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/error/client/$1;
            }
            location ~* error_1and1/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/error/$1;
            }
            location ~* sprint_example_list/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/example_list/client/$1;
            }
            location ~* sprint_example_list/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/example_list/$1;
            }
            location ~* form/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/form/client/$1;
            }
            location ~* form/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/form/$1;
            }
            location ~* modal/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/modal/client/$1;
            }
            location ~* modal/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/modal/$1;
            }
            location ~* placeholder_1and1/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/placeholder/client/$1;
            }
            location ~* placeholder_1and1/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/placeholder/$1;
            }
            location ~* quicksearch/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/quicksearch/client/$1;
            }
            location ~* quicksearch/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/quicksearch/$1;
            }
            location ~* quota-indicator/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/quota_indicator/client/$1;
            }
            location ~* quota-indicator/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/quota_indicator/$1;
            }
            location ~* slider/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/slider/client/$1;
            }
            location ~* slider/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/slider/$1;
            }
            location ~* system/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/system/client/$1;
            }
            location ~* system/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/system/$1;
            }
            location ~* ToDo/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/todo/client/$1;
            }
            location ~* ToDo/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/todo/$1;
            }
            location ~* user/(js.*\.js)$ {
                alias /opt/ui/opt/rainjs-ssa/components/user/client/$1;
            }
            location ~* user/(resources.*)$ {
                alias /opt/ui/opt/rainjs-ssa/components/user/$1;
            }
            location ~* container_example/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/container_example_2_0/client/$1;
            }
            location ~* container_example/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/container_example_2_0/$1;
            }
            location ~* core/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/core/client/$1;
            }
            location ~* core/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/core/$1;
            }
            location ~* css31/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/css31/client/$1;
            }
            location ~* css31/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/css31/$1;
            }
            location ~* css_min_app1/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_min_app1/client/$1;
            }
            location ~* css_min_app1/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_min_app1/$1;
            }
            location ~* css_min_app2/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_min_app2/client/$1;
            }
            location ~* css_min_app2/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_min_app2/$1;
            }
            location ~* css-renderer/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_renderer/client/$1;
            }
            location ~* css-renderer/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/css_renderer/$1;
            }
            location ~* demo_container/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/demo_container/client/$1;
            }
            location ~* demo_container/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/demo_container/$1;
            }
            location ~* error/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/error/client/$1;
            }
            location ~* error/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/error/$1;
            }
            location ~* example/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/example_list/client/$1;
            }
            location ~* example/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/example_list/$1;
            }
            location ~* external_theming/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/external_theming/client/$1;
            }
            location ~* external_theming/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/external_theming/$1;
            }
            location ~* language_selector/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/language_selector/client/$1;
            }
            location ~* language_selector/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/language_selector/$1;
            }
            location ~* layout/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/layout/client/$1;
            }
            location ~* layout/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/layout/$1;
            }
            location ~* placeholder/(js.*\.js)$ {
                alias /opt/ui/lib/node_modules/rain/components/placeholder/client/$1;
            }
            location ~* placeholder/(resources.*)$ {
                alias /opt/ui/lib/node_modules/rain/components/placeholder/$1;
            }
        }
    }
