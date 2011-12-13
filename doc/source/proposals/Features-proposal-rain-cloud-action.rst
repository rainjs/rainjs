====================
RAIN Cloud In Action
====================

In this document you can find a simple example of RAIN Cloud deployment sequence. The scenario presented in here applies only for production (not for development mode).

-------------------
RAIN Cloud off mode
-------------------

When RAIN Cloud is not booted each piece is isolated. 

.. image:: ../images/proposals/rain_cloud_off_mode.png

-----------------
RAIN Cloud booted
-----------------

In this state each piece is wired (but without any running components instances).

.. image:: ../images/proposals/rain_cloud_startup.png

At the end of this phase the infrastructure is ready.

-------------------------------------
RAIN Cloud instantiate web components
-------------------------------------

Now imagine that we already have built two web components in development mode and now we want to publish them to production. RAIN Cloud is already active and the hypervisor has all required information. After we request the deploy / instantiate operations from cloud api the infrastructure is updated:

.. image:: ../images/proposals/rain_cloud_webcomp_inst.png

Now the above diagram shows a possible result. Basically the hypervisor decide how to instantiate the requested web component and how to wire rain servers to motherships for efficiently use of resources. Later on if more pieces become available, hypervisor can decide to clone the instances and use more resources. 

----------
Conclusion
----------

RAIN hypervisor is controlling and adjusting the infrastructure usage for providing best performance based on the requests nature and the number of available resources. This is really important because developer is protected from all this overhead.