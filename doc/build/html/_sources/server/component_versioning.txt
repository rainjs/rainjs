====================
Component Versioning
====================

------------
Introduction
------------

RAIN's *raison d'être* is to aggregate loosely coupled components. Supporting complete integration
scenarios demands from RAIN that it provides support for full component versioning. RAIN can
register the same component multiple times with different versions such that dependency
constraints are correctly fulfilled.

Understanding RAIN's versioning semantics is important because when interacting with RAIN's
interfaces and templates the issue plays a central role.

-------------------
Describing versions
-------------------

It all begins in the component's ``meta.json`` descriptor file. Consider the two following
components that register two versions for the same component id:

``/components/nasa-missions-apollo-11/meta.json``

.. code-block:: javascript

    {
        "id": "apollo",
        "version": "11.0",
        "views": {
            "eagle": {
                "view": "eagle.html",
                "controller": {
                    "client": "eagle.js"
                }
            }
        }
    }

``/components/nasa-missions-apollo-13/meta.json``

.. code-block:: javascript

    {
        "id": "apollo",
        "version": "13.0",
        "views": {
            "aquarius": {
                "view": "aquarius.html",
                "controller": {
                    "client": "aquarius.js"
                }
            }
        }
    }

.. note::
    RAIN uses a 3 part versioning scheme, composed of the triplet of (**major**, **minor**,
    **micro?**) numbers. The major and minor version numbers are **mandatory**, the micro version
    number is optional, but also more than 3 version parts is not valid.

----------------
Version matching
----------------

Referencing components in view templates and when using RAIN's interfaces requires specifying the
pair (``id``, ``version``) for the cases when it is not obvious what component is being referenced.
RAIN allows developers to use version **fragments** which are resolved to the closest match found in
the component registry. By definition, a fragment is part of a version, containing at least the major
version and at most the full version triplet, in which case the fragment is itself a full version.

Version matching is done by comparing a fragment against the registered versions for a component.
Considering every part present in the fragment as being a constraint, RAIN tries to match the latest
possible version. Some examples are presented next for clarification:

- Searching for the version fragment ``1.3`` in a component's list of [``1.2``, ``1.3.1``,
  ``1.3.5``, ``2.0``] version list, will match version ``1.3.5`` since that is the latest version
  that matches given the constraints for major version to be ``1`` and minor version to be ``3``.

- Searching for the version fragment ``2`` in a component's list of [``1.5.14``, ``2.0``, ``2.1``]
  version list will match version ``2.1``.

- Searching for the version fragment ``1.5.2`` in a component's list of [``1.5``, ``1.5.2``,
  ``1.5.3``] will match version ``1.5.2``, of course.

- Searching for the version format ``2.4`` in a component's list of [``1.3``, ``2.1``, ``3.5``]
  version list will **not** match any version.

.. seealso::

        :ref:`Component helper usage <handlebars-component-helper-usage>`
            How to specify versions when aggregating components in a view template

        :ref:`CSS helper usage <handlebars-css-helper-usage>`
            How to specify versions when aggregating CSS files in a view template

