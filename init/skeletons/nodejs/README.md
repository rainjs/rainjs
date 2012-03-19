=====================
Component description
=====================

This section should be used to give a short description about the component. Say what it does
and which are the constraints when using this component.

Please keep the folder structure as described below in order to avoid unexpected behavior.

--------------------------
Component folder structure
--------------------------

This is the folder structure for a RAIN component.

- client/ - this folder contains files that are used on the client-side

        - css/ - Put here the css files for the component.
        - js/ - Put here the client-side controllers that are requirejs compatible.
        - templates/ - Put here the views / templates of your component.
- server/

        - controller/ - Put here the server-side controllers (used for RESTfull services).
        - websockets/ - Put here the websockets modules.
        - authorization.js - Here you can define functions for dynamic conditions.
        - data.js - Add here an optional method for each view. This method will be called to
                    collect data needed to render the template.
- resources/ - This folder should contain static resources like images, documents, videos, etc.
- meta.json - This file contains the component's configuration.
