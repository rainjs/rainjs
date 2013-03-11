





..
    Classes and methods

Class Stylesheet
================================================================================

..
   class-title


A representation of the style tags inside the document which allow for the easy addition and
manipulation of the rules inside of them.








    


Constructor
-----------

.. js:class:: Stylesheet(id)



    
    :param Number id: 
        the style Id 
    







Methods
-------

..
   class-methods


add
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Stylesheet#add(rule)


    
    :param RuleSet rule: 
        the rule to be added 
    



    
    :returns Boolean:
        true if the addition was successful false otherwise 
    


Queue a rule to be added to the stylesheet.









    



getFreeSpace
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Stylesheet#getFreeSpace()




    
    :returns Integer:
        the free space left inside the stylesheet 
    


Calculate the free space left inside the stylesheet.









    



getRulesWithin
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Stylesheet#getRulesWithin(space)


    
    :param Number space: 
        the space to fit the rules inside of 
    



    
    :returns RuleSet[]:
        the identified rules 
    


Find the rules inside this stylesheet that fit in a designated amount of space









    



remove
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Stylesheet#remove(rules)


    
    :param RuleSet rules: 
        the rule to delete 
    




Queue a rule to be removed from the stylesheet.









    



write
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Stylesheet#write()





Write the queued modifications to the stylesheet object than to the html.









    




    

Attributes
----------

..
   class-attributes


id
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: id   


the id of the stylesheet








    



ruleCount
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:attribute:: ruleCount   


the number of rules in the stylesheet








    






