define(["require", "core-components/client_util"],
        function (require, ClientUtil) {

    function ViewManager(viewContext) {
        this.viewContext = viewContext;
        this.root = viewContext.getRoot();

        this.root.on("click", "a", ClientUtil.bind(this._handleViewRequest, this));
    }

    ViewManager.prototype._handleViewRequest = function (event) {
        var url = $(event.target).attr("href"),
            localRequest = /^\.{0,2}\//;

        if (localRequest.test(url)) {
            $.ajax({
                headers:    {
                    Accept: "text/json"
                },
                dataType:   "json",
                url:        url
            }).done(ClientUtil.bind(this.displayView, this));
        } else {
            window.open(url, "_blank");
        }

        event.preventDefault();
    }

    ViewManager.prototype.displayView = function (component) {
        var Registry = require("core-components/raintime/raintime").ComponentRegistry,
            domId = this.viewContext.moduleId,
            componentParts,
            componentRoot,
            dependencies,
            head = $("head"),
            domIdOffset = 0;

        // De-register current component
        Registry.deregister(domId);

        // Extract the content of the incoming component
        componentParts = component.content.match(/<body>\s*(<div[^>]*>[\s\S]*<\/div>)\s*<\/body>/);
        if (componentParts && componentParts.length === 2) {
            /*
                We have controller initialization scripts in the body.
                JQuery strips these out of the normal DOM structure and appends
                them one by one at the end of the JQuery object set.
                
                We ignore them when inserting the incoming component's content
                in the DOM and evaluate them later.
            */
            componentRoot = $(componentParts[1]);
            this.root.replaceWith(componentRoot.not("script"));

            /*
                DomIds from the incoming component need to be rewritten since they
                have no knowledge of the existing domIds in the current page.

                They need to be offset by a number equal to the biggest domId
                in the page.
            */
            for (var registeredComponent in Registry.components) {
                domIdOffset++;
            }

            /*
                Step 1 of domId update: update the data-instanceid attributes of
                the incoming component and of all it's subcomponents.
            */
            componentRoot.first().find("[data-instanceid]").andSelf().each(function () {
                $(this).attr("data-instanceid",
                             domIdOffset + parseInt($(this).attr("data-instanceid"), 10));
            });

            /*
                Step 2 of domId update: update domIds inside controller scripts
                and finally evaluate these.
            */
            componentRoot.filter("script").each(function () {
                var scriptText = $(this).text();

                scriptText = scriptText.replace(/^var domId = (\d+);$/m,
                    function (matchString, domId) {
                        return 'var domId = ' + (parseInt(domId, 10) + domIdOffset) + ';';
                    }
                );

                scriptText = scriptText.replace(/^var parentDomId = (\d+);$/m,
                    function (matchString, domId) {
                        return 'var parentDomId = ' + (parseInt(domId, 10) + domIdOffset) + ';';
                    }
                );

                // Evaluate
                new Function(scriptText)();
            });
        }

        // Bring to the page the eventual CSS dependencies the component has
        dependencies = component.dependencies.css;
        if (dependencies.length) {
            head.append('<link rel="stylesheet" type="text/css" href="/resources?files='
                    + encodeURIComponent(dependencies.join(";")) + '">');
        }
    }

    return ViewManager;
});
