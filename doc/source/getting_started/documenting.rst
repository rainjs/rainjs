================
Documenting Rain
================

This document describes the recommended way of writing code docblocks for rain using JSDoc
Toolkit. All the common annotations work but there are some special cases that need to be
treated and they are explained below.

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


-----------------------
The constructor pattern
-----------------------

If you're going to be using a constructor, there's no need to add a *@name* annotation in the
description of the module. Instead we add that to the description of the constructor, also
adding the *@constructor* annotation.

.. code-block:: javascript
        :linenos:

        /**
         * This is an example constructor
         *
         * @name MyClass
         * @class this is an instance of my class
         */
        function MyClass() {
            // constructor code here
        }

------------------
Document your code
------------------

Keep in mind that **you must always document your code**. You must document every method of your code.
Do not write your whole documentation at the beginning of the code, it is not recommended.

When you start documenting you must add a short description of the method.

.. code-block:: javascript
    :linenos:

    /**
     * This is the Person Class.
     *
     * @name Person
     * @constructor
     * @param {String} age - the age of the person
     */
     function Person(age) {
        this._age = age;
    }

    /**
     * This is the getter/setter of the age of the person.
     *
     * @param {String} [age] the age that you want to set for the person
     * @returns {Person|Number}
     */
     Person.prototype.age = function(age) {
        if (typeof age === 'undefined') {
            return this.age;
        }

        this.age = age;

        return this;
     }

----------------------
Documenting parameters
----------------------

When you have a method that receives parameters you must always document that parameters:

* Optional parameter :
    .. code-block:: javascript

        @param {type} [name] short description

* Required parameter :
    .. code-block:: javascript

        @param {type} name short description

* Multiple parameters :
    .. code-block:: javascript
        :linenos:

        /**
         * @param {type} param1 description
         * @param {type} param2 description
         * @param {type} param3 description
         */

* Array of parameters :
    .. code-block:: javascript

        @param {type[]} name short description

------------------
Documenting errors
------------------

When a method throws an error you must always document it, and you do it like this:

.. code-block:: javascript

    /**
     * @throws {ErrorType} describe when it is thrown
     */

----------------------
Document return values
----------------------

When your method returns a value you must document it like this:

.. code-block:: javascript

    /**
     * @returns {type} description of the returned value
     */

If your method returns multiple value types depending on the logic than you want to document
it like this:

.. code-block: javascript
 
    /**
     * @returns {type1|type2|type3} description of the returned values
     */

---------------------
Adding usage examples
---------------------

If your method is not that simple, and it's not that obvious how a developer should use your
API you should add an example:

.. code-block:: javascript

    /**
     * @example
     *      var person = new Person(12);
     *      //get the age of the Person
     *      var value = person.age();
     *
     *      //set the age of the Person 
     *      person.age(13);
     */
 