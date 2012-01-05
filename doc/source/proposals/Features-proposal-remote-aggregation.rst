==================
Remote aggregation
==================

Remote aggregation is one major goal of RAIN. The simplified explanation is we want to allow users to write and hold applications / pages without software constraints. For instance we want to avoid cases were we tell developers: use wicket because RAIN can not use something else.

------
Vision
------

Following RAIN guidelines, we want to be able to render remote markup fragments.

------------
Architecture
------------

^^^^^^^^
Overview
^^^^^^^^

.. image:: ../images/proposals/remoting_architecture.jpeg

In the above diagram you can see how remote fragments will be aggregated by RAIN.

^^^^^^^^^^^^^^^^^^^^^^^
Functional requirements
^^^^^^^^^^^^^^^^^^^^^^^

1. RAIN must keep track of remote fragments session.
2. RAIN must send aggregated page parameters to each remote fragment.
3. RAIN must provide components that generates compatible markup.

^^^^^^^^^^^
Assumptions
^^^^^^^^^^^

1. RAIN will support remote fragments session for: JSP, Wicket, Spring MVC and PHP. (It might be possible to support some other technologies / frameworks in the future).
2. RAIN remote fragments session are not shared. It means that a remote fragment session will not be able to access another remote fragment session.

^^^^^^^^^^^^^^^^^^^^^^^
Aggregation case sample
^^^^^^^^^^^^^^^^^^^^^^^

.. image:: ../images/proposals/case_sample_remote_aggregation.jpeg

^^^^^^^^^^^^^^^^^^^^
Aggregation sequence
^^^^^^^^^^^^^^^^^^^^

.. image:: ../images/proposals/sd_remote_fragments.jpeg

In the above diagram you can see how a requests to a page that contains remote fragments is solved by RAIN. For the first request remote server holding the fragment will create a new session. The session id will be pushed back to the RAIN server along with the fragment generated markup.

For ulterior requests, the session id for the same remote fragment will be sent to the remote server.

On the RAIN server there will be an association between RAIN remote module and session id. This information will live within RAIN session. Fragments sessions are hidden from client side code executed within client browser.

----------------
Special cautions
----------------

Because RAIN is intended to support remote fragments there are several points in which things go wrong. Below you can find a list of common exceptions we want to handle:

^^^^^^^^^^
Exceptions
^^^^^^^^^^

1. A remote fragment can not be rendered at all.

   1. Remote server is not available.
   2. Remote server responds really slow.
2. Remote server responds with 401 error code.
3. Remote server responds with 403 error code.
4. Remote server responds with some other HTTP error code.
5. Fragments might define the same css classes in markup thus resulting a name clash.
6. Fragments might define the same javascript functions in global space thus resulting a name clash.

^^^^^^^^^^^^^
Special cases
^^^^^^^^^^^^^

1. Fragments provide their own urls within markup.
2. Fragments use form submit mechanism provided by html.

^^^^^^^^^^^^^^^^^^
Possible solutions
^^^^^^^^^^^^^^^^^^

+----------------------------------------------------------------+---------------------------------------------------------------------------+
| Exception                                                      | Possible solution                                                         |
+================================================================+===========================================================================+
| Remote server is not available.                                | A default image will be displayed to indicate something is not available. |
+----------------------------------------------------------------+---------------------------------------------------------------------------+
| Remote server responds really slow.                            | RAIN is processing each fragment in parallel. If the processing of a      |
|                                                                | fragment will not end in a timely manner (&lt; 300ms for instance) RAIN   |
|                                                                | will automatically stop the process and it will display a predefined      |
|                                                                | image instead.                                                            |
+----------------------------------------------------------------+---------------------------------------------------------------------------+
| Remote server responds with 401 / 403 / other HTTP error code. | RAIN might display a predefined image for this instead of the fragment.   |
+----------------------------------------------------------------+---------------------------------------------------------------------------+
| Fragments might define the same css classes in markup thus     | This is solved automatically by RAIN.                                     |
| resulting a name clash.                                        |                                                                           |
+----------------------------------------------------------------+---------------------------------------------------------------------------+
| Fragments might define the same javascript functions in        | This should not be the case because all fragments should write            |
| global space thus resulting a name clash.                      | javascript using requirejs.                                               |
+----------------------------------------------------------------+---------------------------------------------------------------------------+