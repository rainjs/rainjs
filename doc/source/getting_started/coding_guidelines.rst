=================
Coding Guidelines
=================

This document describes the coding conventions used in the source code.

-----------
Identifiers
-----------

- Identifiers are in camel case
- Constructor functions start with a capital letter
- Variable and normal function names start with a lower case letter
- Function names always start with a verb, e.g.: ``lock``, ``openFile``,
  ``parseUsersList``
- Variable names never start with a verb, except for booleans: ``isLocked``,
  ``hasFeature``
- File names use only lower case letters and underscores for spaces, e.g.:
  ``view_manager.js``

-----
Style
-----

- Indentation is 4 spaces
- Lines have a maximum of 80 characters
- Always use spaces between operators
- Object properties have no space between the property name and colon,
  but have a space between the colon and the value, e.g.::

    var o = {sort: "name", direction: "ascending"};

- Function declarations and expressions have no space between function name
  and opening parantheses::

    function ajax(options) { /* ... */ }
    ajax({success: function (response) { /* ... */ });

- Always use braces to surround the body of flow control statements, even when
  the body consists of a single statement
- Put a semicolon after every statement, except for ``for``, ``function``,
  ``if``, ``try``, ``switch``, but including after a function expression, e.g.::

    return function {
        /* ... */
    };

--------------
Best Practices
--------------

- Always use identity operator instead of the equality operator
- Always cache the length of an array when iterating through it's elements, e.g.::

    for (var i = 0, l = a.length; i < l; i++) { /* ... */ }

- Use the optimized version of backward loops when possible::

    for (var i = a.length; i--;) { /* ... */ }

- Use arrays for long string concatenations instead of the + operator, e.g.::

    var nucleotides = ["A", "G", "T", "C"];
    var dnaSequence = [];
    for (var i = 1001; i--;) {
        dnaSequence.push(nucleotides[Math.random() * 3]);
    }
    console.log(dnaSequence.join(""));

- Use the bitwise negation operator to optimize string ``indexOf`` calls
  when checking for the existence of a substring, e.g.::

    if (~dnaSequence.indexOf("GATTACA")) {
        /* Same as: dnaSequence.indexOf("GATTACA") !== -1 */
    }

- Usually try to accept an object as a single input argument for a function
  instead of a long list of arguments
- Always provide a ``default`` case to switch statements

-------
Classes
-------

- Always use the prototype pattern for classes

- We use a naming convention for private functions of putting an underscore as
  the first character of the function name. We also make these functions public
  on the prototype. Avoid declaring private functions hidden in closures or on
  the top level of node.js modules as these cannot be mocked in unit tests
  (code coverage is the main criteria behind choosing this naming convention
  and having only public functions)::

    // WRONG
    function privateMethod(self) {}

    // CORRECT
    myClass.prototype._privateMethod = function () {};

    // Example of calling the private method ...
    myClass.prototype.publicMethod = function () {

        // ... from the object instance context
        this._privateMethod(val);

        // ... and from an asynchronous context, by using a reference
        // to this
        var self = this;
        setTimeout(function (val) {
            self._privateMethod(val);
        }, 1000);
    };

- Caution: if you declare a property that is scoped to the node / requirejs
  module, it will be a static property, and all instances of the class will
  have access to the same value
- Private properties follow the same naming convention::

    // private properties are made public but with a leading underscore
    // in their names
    function MyClass() {
        this._root = this.context.getRoot();
        this._element = this._root.find('.element');
    }

--------
Patterns
--------

Several patterns are used often in the code base, so they are described here.

^^^^^^^^
Promises
^^^^^^^^

Having to write asynchronous code can lead quickly to a code structure that is
hard to read, maintain and that is prone to bugs.



^^^^^^^^^
Singleton
^^^^^^^^^

- When defining singletons, we use the following simple pattern::

    function A() {}

    A.get = function () {
        if (!A._instance) {
            A._instance = new A();
        }

        return A._instance;
    }

    module.exports = A;

- This avoids running code at require time
- This means that we always use singletons by calling the ``get()`` method,
  e.g.: ``A.get().doSomething()``

--------------
Error Handling
--------------

- Errors should be thrown only using the globaly available ``RainError`` class
- If a function needs to accept a **callback**, the callback must also accept
  as the first argument an
  error object, which might be null or undefined in case the call was successful.
- In node, classes may inherit from **``EventEmitter``** and emit an ``error``
  event when an error condition occurs, passing it the error object described
  above. [#node-error-event]_

.. rubric:: Footnotes

.. [#node-error-event] http://nodejs.org/docs/latest/api/events.html#events.EventEmitter
