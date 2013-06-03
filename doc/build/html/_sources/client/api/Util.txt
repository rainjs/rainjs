





..
    Classes and methods

Class Util
================================================================================

..
   class-title


A singleton utility class.








    


Constructor
-----------

.. js:class:: Util()









Methods
-------

..
   class-methods


bind
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Util#bind(f, scope)


    
    :param Function f: 
        the function to which scope and/or arguments are bound 
    
    :param Object scope: 
        the scope to bind to the function 
    


    
    :throws Error:
        : illegal argument exception if f is not a function
    


    
    :returns Function:
        the bound function 
    


Binds scope and arguments to a function.
All arguments passed after scope are considered bound.
Arguments passed to the binder function at call-time are also passed through at the
end of the parameter list, after the original bound parameters.









    



bindPrivate
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Util#bindPrivate(f, scope)


    
    :param Function f: 
        the function to which scope and/or arguments are bound 
    
    :param Object scope: 
        the scope to bind as the first parameter of the function 
    



    
    :returns Function:
        the bound function 
    


Helper bind function for working with private methods.
Automatically binds the first parameter to be the scope too.







.. seealso::

    #bind



    



decorate
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Util#decorate(f, advice)


    
    :param Function f: 
        the function to be decorated 
    
    :param Object advice: 
        holds advice functions 
    
    :param Function advice.before: 
        An advice (function) to insert before the actual call 
    
    :param Function advice.after: 
        An advice (function) to insert after the actual call 
    
    :param Function advice.exception: 
        An advice (function) to call in case of an
exception being thrown from the original function 
    


    
    :throws Error:
        : illegal argument exception if f is not a function
    
    :throws Error:
        : illegal argument exception if any of the possible advices is not a function
    



Decorate a function with advice.
Use {@link #bind} to bind the advice functions to the desired scope.







.. seealso::

    #bind



    



defer
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Util#defer(f)


    
    :param Function f: 
        the function to defer 
    




Defers the execution of a function until the first possible moment to run it.
Use {@link #bind} to bind scope and arguments to the function.









    



format
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Util#format(msg)


    
    :param  msg: 
         
    




(Too) simple sprintf implementation.









    



getSession
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Util#getSession()




    
    :returns String:
        the rain session id 
    


Returns the rain session id.









    



inherits
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Util#inherits(ctor, superCtor)


    
    :param Object ctor: 
        the derived constructor function 
    
    :param Object superCtor: 
        the base constructor function 
    




Makes a function inherit from another's prototype.

In order to make it compatible with node's implementation,
it also makes ``superCtor`` accessible through ``ctor.super_``.









    



inject
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: Util#inject(on, from)


    
    :param Object on: 
        the object which borrows the properties 
    
    :param Object from: 
        the object which lends the properties 
    




Inject the properties from one object into another.
Useful for borrowing methods.









    




    



