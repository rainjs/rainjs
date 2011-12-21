==============================
Client Language Inline Editing
==============================

In this section you can find the proposal for translations inline editing. This is meant for developer / administrators / web masters / technical editors to easily change the translations using a WYSIWYG approach. This must be offered by RAIN platform.

Before continuing to following sections please read :doc:`/proposals/Features-proposal-view-modes`

-----------------------
Functional requirements
-----------------------

   1. RAIN must support edit translations mode for each fragment.
   2. RAIN must support reset to default translations.
   3. RAIN must apply security concerns for edit translations mode.
   4. RAIN must provide a Translation service that allows the management of resources.

---------------
Problem context
---------------

A problem appears when we want to support inline editing for remote fragments. We have this difficulty because we can not edit file on remote sites (at least not easy and not independent of technology). Because of this RAIN impose one constraint: translation must be done using Translation API and some specific RAIN markup.

------
Design
------

.. image:: ../images/proposals/language_inline_sequence.png

This is the sequence diagram for activating and persisting the translations for a specified view.

---------
Prototype
---------

.. image:: ../images/proposals/language_inline_editing.png

Frames are opened starting from top widget till the bottom one. Each widget will be displayed only when an action is triggered from the previous widget.