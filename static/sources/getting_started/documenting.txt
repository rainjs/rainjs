================
Documenting Rain
================

This document describes the recomanded way of writing code docblocks for rain using JSDoc Toolkit. All the common
annotations work but there are some special cases that need to be treated and they are explained below.

Document all the *var* statements inside the module giving them a description and marking them with
the *@private* anotation.

.. code-block:: javascript
        :linenos:

        /**
         * Stores the queue of events
         * @private
         */
        var queue = [];


Add the *@private* annotation to all the private methods in the module


.. code-block:: javascript
        :linenos:

        /**
         * This is a private method
         *
         * @param {Dictionary} data the input data
         * @param {Boolean} [isTrue] optional parameters should be enclosed in brackets
         * @return {Dictionary}
         * @private
         */
        function privateMethod(data) {
            return data;
        }

------------------------
Revealing module pattern
------------------------

Add a comment at the beginning of your module describing it and giving it an *@name*

.. code-block:: javascript
        :linenos:

        /**
         * My module that does some funky stuff
         *
         * @name MyModule
         */

Use the *@memberOf <module>* annotation to explicitly define a method as being a public member of your module


.. code-block:: javascript
        :linenos:

        /**
         * This is a public method
         *
         * @param {Dictionary} data
         * @return {Dictionary}
         * @memberOf MyModule
         */
        function publicMethod(data) {
            return data;
        }

*Please note that the revealing module pattern should only be used for server side code*

-----------------------
The constructor pattern
-----------------------

If you're going to be using a constructor, there's no need to add a *@name* annotation in the description of the module.
Instead we add that to the description of the constructor, also adding the *@constructor* annotation.

.. code-block:: javascript
        :linenos:

        /**
         * This is an example constructor
         *
         * @name MyClass
         * @class this is an instance of my class
         * @constructor
         */
        function MyClass() {
            // constructor code here
        }

There is no need for an @memberOf annotation here since the parser figures out that methods defined under the *prototype*
property of your function are public members with one exception, private methods for which we should add a *@memberOf
<Class_Name>#* (don't forget the **#** at the end because it specifies that it's an instance method).

.. code-block:: javascript
        :linenos:

        /**
         * This is a private method
         *
         * @param {MyClas} self the class instance
         * @param {Dictionary} data the input data
         * @param {Boolean} [isTrue] optional parameters should be enclosed in brackets
         * @return {Dictionary}
         * @private
         * @memberOf MyClass#
         */
        function privateMethod(self, data) {
            return data;
        }