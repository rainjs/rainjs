





..
    Classes and methods

Class TranslationPluralHelper
================================================================================

..
   class-title


This Handlebars helper is used to translate plural text.

Syntax::

     {{nt msgId msgIdPlural count [[arg1] [arg2] [argN]]}}








    

Examples
--------


.. code-block:: javascript

    1:

     <span>
         {{nt "%1$s %2$s, you won one car." "%1$s %2$s, you won %3$d cars." 4 "Mr." "Wayne" 4}}
     </span>


If a "var" parameter is used the helper returns an empty string
and stores the translation on the context for future use:

.. code-block:: javascript

    2:

     {{nt "%1$s %2$s, you won one car." "%1$s %2$s, you won %3$d cars." 4 "Mr." "Wayne" 4 var="winningAnnouncement"}}
     <span>
         {{winningAnnouncement}}
     </span>



Constructor
-----------

.. js:class:: TranslationPluralHelper()









Methods
-------

..
   class-methods


helper
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: TranslationPluralHelper#helper(msgId, msgIdPlural, count)


    
    :param String msgId: 
        the message id for the translation 
    
    :param String msgIdPlural: 
        the message id for the plural translation 
    
    :param String count: 
        the count for the plural decision 
    
    :param String|Number arg1..N: 
        the arguments for the translation text 
    



    
    :returns String:
        translated text 
    


Translates a message to the language specified in the platform configuration. First it checks if
the message exists for the platform language. If this is not found it tries the default language.
The last fallback is to return the message passed as parameter. It also decides if the
singular or plural form should be used based on the count parameter.









    




    



