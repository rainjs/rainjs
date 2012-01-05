==============================
Client Language Inline Editing
==============================

In this section you can find the proposal for translations inline editing. This is meant for developer / administrators / web masters / technical editors to easily change the translations using a WYSIWYG approach. This must be offered by RAIN platform.

Before continuing to following sections please read :doc:`/proposals/Features-proposal-view-modes`.

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

A problem appears when we want to support inline editing for remote fragments. We have this difficulty because we can not edit file on remote sites (at least not easy and not independent of technology). Because of this RAIN imposes one constraint: translation must be done using Translation API and some specific RAIN markup.

------
Design
------

.. image:: ../images/proposals/language_inline_sequence.png

This is the sequence diagram for activating and persisting the translations for a specified view.

---------
Prototype
---------

.. image:: ../images/proposals/language_inline_editing.png

When the components are in edit mode we can provide one of the following mechanisms for accessing and updating the translations:

1. Provide a link for opening a popup dialog that shows all the available components in the page. For each component you can see the list of translation keys and for each key the translations in all languages. The user can update and save the changes. This can easily be achieved by adding the link to the header / footer region of the page (when in edit mode).
2. Provide a link / icon / right-click menu action for each component that will open a popup dialog similar to the one mentioned above, but containing information only about the current component. This can be achieved by adding automatically a section when rendering each component (when in edit mode).
3. Render each translation text as a link that when clicked opens a popup that shows the available translations for that key (when in edit mode). This way we can access faster a specific translation.