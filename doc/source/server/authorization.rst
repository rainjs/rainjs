=============
Authorization
=============

Rain handles authorization in two ways. First it uses a permission based authorization system that
checks if the user has the required permissions for viewing a component and it's views, and
secondly there is a dynamic condition module that allows for defining custom conditions that are
not covered by the permissions (for example checking the user's country).

-----------------
Permissions based
-----------------

The permission based model allows for defining of permissions at both component and view level
which will be checked against the permissions the user has. The permissions should be defined in
the ``meta.json`` file located in the component root under the ``permissions`` key of both the
component and it's views, e.g.:

.. code-block:: javascript

    {
        "id": "example_app",
        "version": "1.0",
        "permissions": ["example"],
        "views": {
            "index": {
                "view": "index.html",
                "controller": {
                    "client": "index.js"
                },
                "permissions": ["example-index"]
            }
        }
    }

The permissions are evaluated in the following order:

When a view is requested, authorization is done by the system in the following order:

#. If permissions are defined at component level, it checks that the user has those permissions.
#. If permissions are defined at view level, it checks that the user has those permissions.
#. If a dynamic condition is defined at module level, it tests if the condition passes.
#. If a dynamic condition is defined at view level, it tests if the condition passes.

In case any of these conditions fail a *401* view will be rendered instead of the requested view.
This works independently of the context (so you don't have to worry if you're in an aggregated
context or you component is supposed to be accessed directly.

-----------------
Intents
-----------------

There are 2 types of intents ( view intent and server intent ).
View intents have the same workflow excepting dynamic conditions.
For server intents you define it under the ``permissions`` key in the meta.json on it's intent.
Here is an example of defining intents permissions, e.g.:

.. code-block:: javascript

    {
        "id": "example_app",
        "version": "1.0",
        "permissions": ["example"],
        "views": {
            "index": {
                "view": "index.html",
                "controller": {
                    "client": "index.js"
                },
                "permissions": ["example-index"]
            }
        },
        intents: [
            {
                "category": "com.rain.test",
                "action": "SHOW_EMAIL",
                "view": "index",
                "type": "view"
            },
            {
                "category": "com.rain.test",
                "action": "SEND_EMAIL",
                "type": "server",
                "controller": "emails.js",
                "method": "post",
                "permissions": ["send_email"]
            }
        ]
    }

The permissions are evaluated in the following order:

When a view intent is requested, authorization is done by the system in the following order:

#. If permissions are defined at component level, it checks that the user has those permissions.
#. If permissions are defined at view level, it checks that the user has those permissions.

In case any of these conditions fail a *401* view will be rendered instead of the requested view.
This works independently of the context (so you don't have to worry if you're in an aggregated
context or you component is supposed to be accessed directly.

When a server intent is requested, authorization is done by the system in the following order:

#. If permissions are defined at component level, it checks that the user has those permissions.
#. If permissions are defined at intent level, it checks that the user has those permissions.

In case any of these conditions fail a *401* message will be received as an promise error.


------------------
Dynamic Conditions
------------------

Dynamic conditions provide a way to register complex security conditions that will be run
in order to determine if an user is allowed to access a view. Dynamic conditions are evaluated only
after the role authorization step is performed.

Dynamic conditions can be specified at component and/or view level.

If any of these conditions aren't met, it stops without executing the remaining conditions and
it doesn't allow the user to access the view.

.. warning::

    This should be used only if the standard authorization mechanism can't handle the scenario
    that needs to be implemented. Writing dynamic conditions will make the process of
    changing which users can access components very time consuming, especially if this is used in
    many components (because the code for the components needs to be changed).
    Also, in some situations, it can make the application slower because the rendering of a
    component starts only after all the authorization conditions are executed.

.....
Usage
.....

Dynamic conditions are placed in the ``/server/authorization.js`` file and are auto-discovered
(convention over configuration). In order to define a dynamic condition for a view a function
with the same name as the *view id* should be created in this file and exported as part of the
public API of this module. For the component level dynamic conditions, the name of this function is
``_component``. If any of these functions is missing, the dynamic condition is simply ignored.

The dynamic condition function will receive ``securityContext`` as its argument. It contains an
``user`` property, which is an object that contains information about the current user.
The ``securityContext`` parameter is read-only. This object is populated when the user is
authenticated and it is kept in session.

.. note::

    We don't use data received from the client in the HTTP request because it's unreliable
    and can be easily modified by the user.

The dynamic condition should return ``true`` if the user is allowed to access the view,
and ``false`` otherwise. Any other value is treated as ``false``.

.. note::

    Async code isn't allowed in dynamic conditions. This is done for performance reasons,
    because if we allow this RAIN will be forced to wait until the async call finishes before
    starting to render the view.

The following example demonstrates how dynamic conditions can be used (the content of the
*meta.json* file is shown in order to make it clear how dynamic conditions are mapped to views).

``/meta.json``:

.. code-block:: javascript

    {
        "id": "button",
        "version": "1.0",
        "views": {
            "index": {
                "view": "index.html",
                "controller": {
                    "client": "index.js"
                }
            },
            "buttons": {
                "view": "buttons.html",
                "controller": {
                    "client": "buttons.js"
                }
            }
        }
    }

``/server/authorization.js``:

.. code-block:: javascript

    function _component(securityContext) {
        var products = securityContext.user.products;

        for (var i = 0, length = products.length; i < length; i++) {
            if (products[i].name === 'Control Panel') {
                return true;
            }
        }

        return false;
    }

    function index(securityContext) {
        return securityContext.user.country === 'US';
    }

    function buttons(securityContext) {
        return securityContext.user.language === 'de_DE';
    }

    module.exports = {
        _component: _component,
        index: index,
        buttons: buttons
    };

.. seealso::

    :js:class:`Authorization`
        Authorization API
