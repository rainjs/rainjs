





..
    Classes and methods

Class TranslationHelper
================================================================================

..
   class-title


This Handlebars helper is used to translate singular text.

Syntax::

     {{t msgId [[arg1] [arg2] [argN]]}}








    

Examples
--------


.. code-block:: javascript

    1:

     <span>
         {{t "How are you?"}}
         {{t "How are you %s?" "Batman" id="custom.id.hello"}}
     </span>


If a "var" parameter is used the helper returns an empty string
and stores the translation on the context for future use:

.. code-block:: javascript

    2:

     {{t "Thank you for your consideration" var="thankYou"}}
     <span>
         {{thankYou}}
     </span>



Constructor
-----------

.. js:class:: TranslationHelper()









Methods
-------

..
   class-methods


helper
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: TranslationHelper#helper(msgId)


    
    :param String msgId: 
        the message id for the translation 
    
    :param String|Number arg1..N: 
        the arguments for the translation text 
    



    
    :returns String:
        the translated text 
    


Translates a message to the language specified in the platform configuration. First it checks if
the message exists for the platform language. If this is not found it tries the default language.
The last fallback is to return the message passed as parameter.









    




    



