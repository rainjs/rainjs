=================
Coding Guidelines
=================

This document describes the coding conventions used in the source code.

-----------
Identifiers
-----------

- Identifiers are in camel case.
- Constructor functions start with a capital letter.
- Variable and normal function names start with a lower case letter.
- Function names always start with a verb, e.g.: *lock*, *openFile*, *parseUsersList* etc.
- Variable names never start with a verb, except for booleans: *isLocked*, *hasFeature* etc.
- File names use only lower case letters and underscores for spaces, e.g.: view_manager.js.

-----
Style
-----

- Indentation is 4 spaces.
- Lines have a maximum of 100 characters.
- Always use spaces between operators.
- Object properties have no space between the property name and colon, but have a space between the colon and the value, e.g.:
    .. code-block:: javascript
        :linenos:

        var o = {sort: "name", direction: "ascending"}
- Function declarations and expressions have no space between function name and opening parantheses:
    .. code-block:: javascript
        :linenos:

        function ajax(options) { /* ... */ }
        ajax({success: function (response) { /* ... */ });
- Always use braces to surround the body of flow control statements, even when the body consists of a single statement
- Put a semicolon after every statement, except for *for*, *function*, *if*, *try*, *switch*, but including after a function expression, e.g.:
    .. code-block:: javascript
        :linenos:

        return function {
            /* ... */
        };

--------------
Best Practices
--------------

- Always use identity operator instead of the equality operator.
- Always cache the length of an array when iterating through it's elements, e.g.:
    .. code-block:: javascript
        :linenos:

        for (var i = 0, l = a.length; i < l; i++) { /* ... */ }
- Use the optimized version of backward loops when possible:
    .. code-block:: javascript
        :linenos:

        for (var i = a.length; i--;) { /* ... */ }
- Use arrays for long string concatenations instead of the + operator, e.g.:
    .. code-block:: javascript
        :linenos:

        var nucleotides = ["A", "G", "T", "C"];
        var dnaSequence = [];
        for (var i = 1001; i--;) {
            dnaSequence.push(nucleotides[Math.random() * 3]);
        }
        console.log(dnaSequence.join(""));
- Use the bitwise negation operator to optimize string *indexOf* calls when checking for the existence of a substring, e.g.:
    .. code-block:: javascript
        :linenos:

        if (~dnaSequence.indexOf("GATTACA")) {
            /* Same as: dnaSequence.indexOf("GATTACA") !== -1 */
        }
- Usually try to accept an object as a single input argument for a function instead of a long list of arguments.
- Use a comma at the end of the line when declaring multiple variables and also align equal signs e.g.:
    .. code-block:: javascript
        :linenos:

        var div      = document.createElement("div"),
            fragment = document.createDocumentFragment(),
            email    = "rain@cloud.net";
- Always provide a *default* case to switch statements.

-------
Classes
-------

- Always use the prototype pattern for classes

- Private functions are scoped to the node/requirejs module and always receive as the first argument
  a *self* object, which is the object instance the function is called on:

    .. code-block:: javascript
        :linenos:

        function privateMethod(self, val) {
            // self is the object instance, other arguments follow afterwards
        }

        // Example of calling the private method ...
        myClass.prototype.publicMethod = function () {

            // ... from the object instance context
            privateMethod(this, val);

            // ... and from an asynchronous context, by using a reference to this
            var self = this;
            setTimeout(function (val) {
                privateMethod(self, val);
            }, 1000);
        };

- Caution: if you declare a property that is scoped to the node/requirejs module, it will be a
  static property, and all instances of the class will have access to the same value.

--------
Patterns
--------

^^^^^^^^^
Singleton
^^^^^^^^^

- When defining singletons, we use the following simple pattern

    .. code-block:: javascript
        :linenos:

        function A() {}

        var instance;

        A.get = function () {
            return instance || (instance = new A());
        }

        module.exports = A;

- This avoids running code at require time
- This means that we always use singletons by calling the ``get()`` method, e.g.: ``A.get().doSomething()``

------
Errors
------

- All **error objects** that are to be returned have the following structure:

    .. code-block:: javascript
        :linenos:

        {
            type: {String | undefined},
            message: {String},
            code: {String | Number | undefined}
            ...
        }

  Only the ``message`` property is mandatory. The meaning of the error object properties is:

  ``type`` (String | undefined)
    The type of the error, e.g.: io, net etc.

  ``message`` (String)
    The detailed message of the error.

  ``code`` (String | Number | undefined)
    The optional code of the error.

  Any other properties may be added to the error object if they are of concern to the respective
  error.

- *Errors should never be thrown* since all code needs to be asynchronous.
- Usually, **promises** should be used that are rejected with the error object described above.
- If a function needs to accept a **callback**, the callback must also accept as the first argument an
  error object, which might be null or undefined in case the call was successful.
- In node, classes may inherit from **``EventEmitter``** and emit an ``error`` event when an error
  condition occurs, passing it the error object described above. [#node-error-event]_

--------
Comments
--------

- Use `jsdoc-toolkit <http://code.google.com/p/jsdoc-toolkit/>`_ for code comments.
- Avoid redundant or obvious comments.

.. rubric:: Footnotes

.. [#node-error-event] http://nodejs.org/docs/latest/api/events.html#events.EventEmitter
