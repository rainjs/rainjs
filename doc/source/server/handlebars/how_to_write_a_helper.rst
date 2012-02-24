==========================================
Guidelines for writing a Handlebars helper
==========================================

This document describes the guidelines that a developer must follow when writing a Handlebars
helper in order to be auto-discovered and properly documented.

----------------
Helper structure
----------------

Each helper must be a module that exports two attributes:

1. **name** - the helper name. E.g. *css*.
2. **helper** - the helper function. It is run when the template engine detects the helper
   statement in the HTML file.

---------------
Helper location
---------------

The helper files must be located in the ``<RAIN_SDK>/lib/handlebars/`` folder. Each helper file
should be named ``<helper_name>.js``. E.g.: ``css.js``.

-------------
Documentation
-------------

1. Each module must have a class function where a basic description of the module is found. E.g.:

    .. code-block:: javascript

        /**
         * This Handlebars helper transforms a set of component parameters into a link tag that
         * references a css file location from a specific component.
         *
         * @name CssHelper
         * @constructor
         */
        function CssHelper() {}

2. Each module must have the helper function that has documentation in the JSDoc format. E.g.:

    .. code-block:: javascript

        CssHelper.prototype.helper = function (options) {
            // Helper implementation
        };

3. The module must export the helper name and the helper function. E.g.:

    .. code-block:: javascript

        module.exports = {
            name: 'css',
            helper: new CssHelper().helper
        };
