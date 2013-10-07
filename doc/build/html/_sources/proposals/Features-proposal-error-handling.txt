==============
Error Handling
==============

Rain should support a front-end error handling mechanism in order to accomplish basic validation of the user input.  

-----------------------
Functional Requirements
-----------------------

1. Rain should provide some means of validating user input on the client-side against regular expressions defined on-the-fly or retrieved from other systems (constants, JSON calls).
2. Also, more complex validation should be supported on the client-side of Rain via JS functions (Eg: if the field A is empty, then at least field B should contain data...).
3. The validation (both regex and complex) should be triggered only when a submit button is pressed (no default calling when a <input type="button"> is pressed).
4. The components provided by the Rain framework should posses a mean of displaying i18n error messages. Each component should also have an "error state" that will be used for rendering that component when the error occurred (Eg: an input field should paint its border in red, an accordion component should expand its parts). 
5. The failure of the validation when the a submit button is pressed will result in stopping the navigation and re displaying the same page with error messages. 
6. The front-end validation mechanism should eliminate Cross-site scripting (XSS) and other vulnerabilities that could be caused by data input from the users.

--------------
Implementation
--------------

Rain framework should provide a function named  function displayError(compName, errorCode) that could be called explicitly from the "validate" functions or is called by the platform each time a regex validation fails.

.. code-block:: javascript
    :linenos:

    function displayError(compName, errorCode){
      $("#"+compName+"_err").html(gettext(errorCode)).css("display","inline");
    }

If a function called validate_[button_id] is defined on the client-side controller, the platform should call that function before executing the submit call for the specified button. Only if the returned result is "SUCCESS", the submit must be made. Inside this function the displayError function could be called for a component and with an error code.
Complex (non-regex) validation when a submit button is pressed

.. code-block:: javascript
    :linenos:

    function validate_save(sessionContext) {
      //this function will be automatically called by Rain when the button with id="save" is called
      return "SUCCESS"
    }