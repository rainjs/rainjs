=========================
Dashboard Component Model
=========================

This document describes how a *dashboard* component should be defined and implemented in order to use it for dynamic aggregation of *widgets*.

A *widget* is a component that may supply, if needed, methods for publishing and accepting configuration parameters. Each widget should supply a *refresh* method that is called by the dashboard when the widget is moved or its parent size is manually changed.

The dashboard uses layouts and widgets that are dynamically obtained and allows the creation of a *master component*. The master component must be able to save its configuration.

-----------------------
Functional requirements
-----------------------

1. The dashboard should be able to accept configuration parameters (e.g. country, widget filters).
2. The dashboard should use server-side messaging to obtain the list of available widgets.
3. The dashboard should use server-side messaging to obtain the list of available layouts.
4. The dashboard layouts must provide html markup that contains placeholder information. The placeholders are used to identify where a widget can be inserted. Each placeholder element can contain one or more widgets.
5. A widget must export a list of parameters needed for its configuration.
6. If a widget has at least one parameter that needs to be configured, when adding it, the dashboard must render a configuration view for the widget. The configuration view must display the configuration parameters and supply a *save* method. When saved, the dashboard will display the rendered view.
7. When changing the layout the widgets should be moved automatically to the new possible placeholders, with their configuration.


-------
Layouts
-------

A *layout* is an html file that should be automatically detected. It supplies placeholders to inform where the widgets can be placed. The layouts should behave the same way independent of the screen size.

.. code-block:: html
    :linenos:

    <div class="layout yui-skin-sam">
        <div id="doc3" class="yui-t7">
            <div id="bd">
                <div class="yui-gc">
                    <div class="yui-u first">
                       <div id="p1" class="widgetplaceholder">Row 1 Column 1</div>
                    </div>
                    <div class="yui-u">
                       <div id="p2" class="widgetplaceholder">Row 1 Column 2</div>
                    </div>
                </div>
                <div class="yui-g">
                    <div id="p3" class="widgetplaceholder">Row 2 Column 1</div>
                </div>
                <div class="yui-gb">
                    <div class="yui-u first">
                        <div id="p4" class="widgetplaceholder">Row 3 Column 1</div>
                    </div>
                    <div class="yui-u">
                        <div id="p5" class="widgetplaceholder">Row 3 Column 2</div>
                    </div>
                    <div class="yui-u">
                        <div id="p6" class="widgetplaceholder">Row 3 Column 3</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

In the previous example we have a custom layout that has 3 rows: the first row has 2 columns, the second has 1 column and the third has 3 columns. The placeholders are identified by the *widgetplaceholder* class. Each placeholder has an id that is used when remembering where a widget is located. When the user adds two widgets to the same placeholder they should be place one above the other.

The user should be able to switch between available layouts. The widgets already added will be moved automatically to the placeholder with the same id. If the old placeholder is not present in the new layout, the first available layout will be used.

----
APIs
----

Each widget should supply the following methods:

1. configuration() - returns a JSON object with information about its configuration parameters.
    .. code-block:: html
        :linenos:

        [
          {
            "name": "min",
            "type": "number",
            "text": "Min value",
            "defaultValue": 10
          },
          {
            "name": "max",
            "type": "number",
            "text": "Max value",
            "defaultValue": 100
          }
        ]

    This JSON defines two parameters: *min* and *max*, that are numbers and have different default values. The *text* field is used when generating the configuration view.
2. configure(options) - configures the widget. The *options* parameter is a JSON object. e.g.: {"min": 10, "max": 100}.
3. refresh() - refreshes the widget.


