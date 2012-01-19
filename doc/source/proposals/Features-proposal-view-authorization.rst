==================
View authorization
==================

Rain should support a view authorization mechanism in order not to display pages or fragments to users if they do not have the proper access rights or some runtime conditions are not true.

The RBAC model will be used to define the permissions. Each Rain user will have a set of roles and each role will grant a set of permissions to access certain resources. In our case, the resources are the modules and the views inside the modules.

Permissions should be defined at module level and at view level. The module permission is inherited also by all views of that module. So in order to access a view, an user should have the permission to access the module(if defined) and also the permission to access the view (if defined).

Besides the RBAC  permissions, Rain should support a dynamic way to check if an user is allowed to access a view.

-----------------------
Functional requirements
-----------------------

1. Rain should support the definition of access permissions at module level and at view level. A view can be accessed only if only the user has the permission to access the module of that view and the permission to access that particular view (in case both the permissions are defined).
2. Rain should support the registration of a dynamic condition to access a view.
3. Rain should not display a view to an user if the user does not have the permission to access that view or the dynamic runtime access condition does not hold;
4. Rain should not include a view fragment into the aggregated parent page if the user does not have the permission to access that fragment or the dynamic runtime access condition does not hold;
5. In all other cases, the view should be displayed to the user.

--------------
Implementation
--------------

Module and view access permissions are expressed directly in the **meta.json** file in the **access_permission** property:

.. code-block:: javascript
    :linenos:

    meta.json:
    {
      "id" : "my-app;1.0"
      "url" : "/modules/my-app",
      "access_permission"    : "access-my-app",
      "views" : [
         {
           "viewid"           : "main",
           "view"             : "/htdocs/main.html",
           "controller"       : "/htdocs/controller/main.js"
           "access_permission"    : "access-my-page",
           "access_condition"    : "/authorization/main.js"
         }
      ]
    }

For each view that requires dynamic authorization, there should be a script called <view_id>.js that is placed in the authorization folder in the application module root path. Rain should support auto-discovery of the authorization script although it can be also defined in the module descriptor in the **access_condition** property.

One function defined in this script will be invoked by Rain:

  - **canAccessPage(sessionContext)**: returns a boolean that says if the user can access or not this view; a reference to the current user sessionContext is passed as an argument and it is used to dynamically determine if the user can access this view.

Example:

.. code-block:: javascript
    :linenos:

    function canAccessPage(sessionContext) {
      //display the view only if user is from US
      return sessionContext.currentUser.country == 'US';
    }

Before rendering a view, Rain:

1. Determines the module of that view
2. Checks if there is a permission defined needed to access that module
3. If so, Rain checks if the user has that permission
4. Checks if there is a permission defined needed to access that view
5. If so, Rain checks if the user has that permission
6. Checks if there is a script defined to do the dynamic authorisation
7. If there is one, it invokes the canAccessPage with the current sessionContext and it decides to display or not that view

There are 2 types of requesting a view:

 -  direct request of view from browser
 -  Rain indirectly requests a view as a fragment of other view (composition)

If an user is not authorised to access a view:

 -  Rain will return 403 Forbidden in the first case
 -  Rain will not include the fragment into the parent view in the second case


-----------
Assumptions
-----------

It is assumed that it is application's responsibility to retrieve and to store the set of permissions into the **sessionContext.permissions** field after the user has logged in.
