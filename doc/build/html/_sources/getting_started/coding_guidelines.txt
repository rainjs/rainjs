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
- Function names always start with a verb, e.g.: ``lock``, ``openFile``,
  ``parseUsersList``.
- Variable names never start with a verb, except for booleans: ``isLocked``,
  ``hasFeature``.
- File names use only lower case letters and underscores for spaces, e.g.:
  ``view_manager.js``.

-----
Style
-----

- Indentation is 4 spaces.
- Lines have a maximum of 100 characters.
- Always use spaces between operators.
- Object properties have no space between the property name and colon,
  but have a space between the colon and the value, e.g.::

    var o = {sort: 'name', direction: 'ascending'};

- Function declarations and expressions have no space between function name
  and opening parentheses, but a space is always required when the function name is missing::

    function ajax(options) { /* ... */ }
    ajax({success: function (response) { /* ... */ });

- Always use braces to surround the body of flow control statements, even when
  the body consists of a single statement::

    if (x) {
        i++;
    } else {
        i--;
    }

- Put a semicolon after every statement, except for ``for``, ``function``,
  ``if``, ``try``, ``switch``, but including after a function expression, e.g.::

    return function () {
        /* ... */
    };

- Put a space between the ``if``, ``for``, ``while`` keywords and the opening parentheses. Also
  put a space before the opening braces of the associated block statement, e.g.::

    if (i > 0) {
        /* ... */
    } else {
        /* ... */
    }

- Put the ``"use strict";`` statement at the beginning of any JavaScript source file.
- Put an empty line at the end of any file.

--------------
Best Practices
--------------

- Always use identity operator instead of the equality operator.
- Always cache the length of an array when iterating through it's elements, e.g.::

    for (var i = 0, l = a.length; i < l; i++) { /* ... */ }

- Use the optimized version of backward loops when possible::

    for (var i = a.length; i--;) { /* ... */ }

- Use arrays for long string concatenations instead of the + operator, e.g.::

    var nucleotides = ['A', 'G', 'T', 'C'];
    var dnaSequence = [];
    for (var i = 1001; i--;) {
        dnaSequence.push(nucleotides[Math.random() * 3]);
    }
    console.log(dnaSequence.join(''));

- Usually try to accept an object as a single input argument for a function
  instead of a long list of arguments.
- Always provide a ``default`` case to switch statements.
- Always specify the ``radix`` parameter when using the ``parseInt`` function, e.g.::

    parseInt('23', 10);

- Use constants instead of embedding literals in source code. Constant identifiers are using
  all caps style in order to distinguish them from other variables, e.g.::

    var MAX_VALUE = 23;
    var CONTENT_TYPE = 'application/json';

- Do not use function declarations within blocks. While most script engines support function
  declarations within blocks it is not part of ECMAScript. Worse implementations are inconsistent
  with each other and with future EcmaScript proposals. ECMAScript only allows for function
  declarations in the root statement list of a script or function. Instead use a variable
  initialized with a function expression to define a function within a block::

    // WRONG
    if (x) {
        function foo() {}
    }

    // CORRECT
    if (x) {
        var foo = function () {}
    }

- Do not use ``with`` statements.
- Use the ``for-in`` loop only for iterating over the keys of an object. Don't use it for iterating over
  the elements of an array::

    // CORRECT
    for (var key in obj) {
        console.log(key, obj[key]);
    }

    // WRONG
    var arr = [3, 5, 8],
        sum = 0;

    for (var key in arr) {
        sum += arr[key];
    }

    // CORRECT
    for (var i = 0, l = arr.length; i < l; i++) {
        sum += arr[i];
    }

- Don't modify the prototypes of built-in objects, like ``Object``, ``Array``, ``Function`` etc.
- In server side code, whenever possible, place all the ``require`` calls at the beginning of the
  file. Remove the ``require`` calls that are no longer needed.
- Do not put sensitive information inside your code, you can put this type of information inside
  a .conf file.


-------
Classes
-------

- Always use the prototype pattern for classes.

- We use a naming convention for private functions of putting an underscore as
  the first character of the function name. We also make these functions public
  on the prototype::

    // WRONG
    function privateMethod(self) {}

    // CORRECT
    MyClass.prototype._privateMethod = function () {};

    // Example of calling the private method ...
    MyClass.prototype.publicMethod = function () {

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
  have access to the same value.
- Private properties follow the same naming convention::

    // private properties are made public but with a leading underscore
    // in their names
    function MyClass() {
        this._root = this.context.getRoot();
        this._element = this._root.find('.element');
    }

- Static methods and fields are declared as properties of the constructor, e.g.::

    MyClass.staticMethod = function () {
        /* ... */ 
    };

    MyClass._privateStaticMethod = function () {
        /* ... */
    };

    MyClass._instanceCount = 0;

- Avoid exposing fields as part of the public API of a class. Use getters and setters instead.
- Getters must never produce side-effects.

--------
Patterns
--------

Several patterns are used often in the code base, so they are described here.

^^^^^^^^
Promises
^^^^^^^^

- Always specify the error callback. Otherwise, an error would be thrown::

    promise.then(function (result) {
        /* ... */
    }, function (error) {
        /* ... */
    });

- Use ``all`` when you want to wait for multiple promises to be resolved::

    all(promise1, promise2, promise3).then(successCallback, errorCallback);

- Use ``seq`` when you want to execute multiple asynchronous functions in a specified order, each
  function being called with the result of the previous function::

    seq([
        function () {
            var deferred = defer();

            process.nextTick(function () {
                deferred.resolve({foo: 'bar'});
            });

            return deferred.promise;
        },
        function (result) {
            /* ... */
        }
    ]).then(successCallback, errorCallback);

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

- This avoids running code at require time.
- This means that we always use singletons by calling the ``get()`` method,
  e.g.: ``A.get().doSomething()``.

--------------
Error Handling
--------------

- Errors should be thrown only using the globally available ``RainError`` class.
- If a function needs to accept a **callback**, the callback must also accept
  as the first argument an error object, which might be null or undefined in case
  the call was successful.
- In node, classes may inherit from **``EventEmitter``** and emit an ``error``
  event when an error condition occurs, passing it the error object described
  above. [#node-error-event]_

.. rubric:: Footnotes

.. [#node-error-event] http://nodejs.org/docs/latest/api/events.html#events.EventEmitter
