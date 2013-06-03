





..
    Classes and methods

Class ParsedObject
================================================================================

..
   class-title


The constructor of the ParsedObject








    


Constructor
-----------

.. js:class:: ParsedObject(values)



    
    :param [String] values: 
        - the values resulting from the parsed header 
    







Methods
-------

..
   class-methods


getBestLanguageMatch
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ParsedObject#getBestLanguageMatch(candidates)


    
    :param [String] candidates: 
        - the array of predefined languages 
    



    
    :returns String | undefined:
        - the best language match from the candidates 
    


Get the best language match from an array of candidates.









    


.. code-block:: javascript

    var parsedHeader = new ParsedObject(['en', 'en_US']);
     var result = getBestLanguage(['ar_AR', 'en_UK']);
     console.log(results);




getValues
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ParsedObject#getValues()




    
    :returns [String]:
        - the values of the ParsedObject. 
    


Returns the values of the ParsedObject.









    




    



