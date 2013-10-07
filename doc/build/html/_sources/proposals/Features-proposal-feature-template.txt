==========================
Features proposal template
==========================

In this document you can find all the sections that a proposal must contain. All proposals from this project will follow this template.

---------
Revisions
---------

+---------------+---------+-------------------------------------+
| Author        | Version | Changes                             |
+===============+=========+=====================================+
| Radu Cosnita  | 1.0     | Initial draft of feature . . . .    |
+---------------+---------+-------------------------------------+
| Claus Augusti | 1.0.1   | Added a new functional requirement. |
+---------------+---------+-------------------------------------+

-----
Scope
-----

*Here comes a short description of what we want to achieve*

----------------------
Stakeholders interests
----------------------

+----------------------+--------------------------+----------------------------------------------------------------------------------------------------+
| Stakeholder          | Interests                | Acceptance scenario                                                                                |
+======================+==========================+====================================================================================================+
| Javascript developer | - Uniform api.           | *Here comes a detailed description of what this stakeholder will do before accepting the feature.* |
|                      | - AJAX enabled behavior. |                                                                                                    |
|                      | - . . .                  |                                                                                                    |
+----------------------+--------------------------+----------------------------------------------------------------------------------------------------+

----------------------------
Functional requirements (FR)
----------------------------

*Here come all functional requirements for the feature we want to implement. Each functional requirement should be uniquely identified. Use requirement number. Whenever you want to address a functional requirement you should use FR.[requirement number]*

*Ex*:

  1. . . .
  2. . . .

    1.  . . .

---------
Use cases
---------

*Here comes all use cases that apply to this feature.*

------
Design
------

*Here come uml diagrams and technical details.*

------------
Code samples
------------

*Here come code samples meant to show how developers will use this feature.*

--------
Timeline
--------

*Here the estimated work of the feature must be split into packages of work that are correlated with the milestones.*

*For instance we want to support Aspect Oriented Programming*

+----------------+--------------------------------------------+----------+
| Milestone      | Usable parts                               | Comments |
+================+============================================+==========+
| v0.6 / 10.2011 | Initial support for pre / post processors. |    \-    |
+----------------+--------------------------------------------+----------+
| v1.0 / 03.2012 | Support for aspectj syntax.                |    \-    |
+----------------+--------------------------------------------+----------+
| v1.5 / 09.2012 | Eclipse plugin for RAIN AOP.               |    \-    |
+----------------+--------------------------------------------+----------+
