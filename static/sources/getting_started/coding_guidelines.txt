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
- Use the *mod* prefix for modules.
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
- Always declare local variables using the *var* keyword at the beginning of the function scope.
- Use a comma at the end of the line when declaring multiple variables and also align equal signs e.g.:
    .. code-block:: javascript
        :linenos:

        var div      = document.createElement("div"),
            fragment = document.createDocumentFragment(),
            email    = "rain@cloud.net";
- Always provide a *default* case to switch statements.

--------
Comments
--------

- Use `jsdoc-toolkit <http://code.google.com/p/jsdoc-toolkit/>`_ for code comments.
- Avoid redundant or obvious comments.
