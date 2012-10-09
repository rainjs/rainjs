=============
CSS Rendering
=============

This document describes how RAIN should handle the rendering of CSS files.

--------------------
Server side handling
--------------------

When a component registers a CSS file for rendering it should be sent to the client as part of the
``css`` key of the ``render`` packet. The server should also send along the number of rules inside
of the CSS file, which should be precomputed at startup.

--------------------
Client side handling
--------------------

.............
Adding styles
.............

Upon receiving a CSS file path the client rendering engine requests that file through an AJAX
request and then places the content inside of a ``<style>`` tag in the ``<head>`` section of the
page.

A style tag must never have more than **4095** CSS rules inside of it. In case of a total number
greater than **4095** the render should look for a ``<style>`` tag with enough room to add the
content, and if there isn't any then create a new one.

When creating stylesheets the client renderer should also make sure not to add more than **31**
styles to the page and in case that happens it should log an error and in case the browser is IE9
or less discard the content of the file.

...............
Removing styles
...............

When a component is destroyed it should trigger a remove operation on all the stylesheets attached
to it that notifies the client renderer that it has been destroyed. The client renderer then
proceeds to identify the rules belonging to that specific component and removes them from the
``<style>`` tag.

If the removal would result in the style having **0** rules in it, the whole style should be
removed as opposed to only the content.
