define(["require", "core-components/client_util"],
        function (require, ClientUtil) {

    function SubsequentViewHandler(viewContext) {
        this.viewContext = viewContext;
        this.root = viewContext.getRoot();

        this.root.on("click", "a", ClientUtil.bind(this._handleViewRequest, this));
    }

    SubsequentViewHandler.prototype._handleViewRequest = function (event) {
        var url = $(event.target).attr("href"),
            localRequest = /^\.{0,2}\//;

        if (localRequest.test(url)) {
            $.ajax({
                headers:    {
                    Accept: "text/json"
                },
                dataType:   "json",
                url:        url
            }).done(ClientUtil.bind(this._onLocalRequestDone, this));
        } else {
            window.open(url, "_blank");
        }

        event.preventDefault();
    }

    SubsequentViewHandler.prototype._onLocalRequestDone = function (component) {
        var Registry = require("core-components/raintime/raintime").ComponentRegistry,
            domId = this.viewContext.moduleId,
            componentParts,
            componentRoot,
            componentParent,
            controllerScripts,
            dependencies,
            head = $("head"),
            domIdOffset = 0,
            reDomIds;

        Registry.deregister(domId);

        componentParts = component.content.match(/<body>\s*(<div[^>]*>[\s\S]*<\/div>)\s*<\/body>/);
        if (componentParts && componentParts.length === 2) {
            componentRoot = $(componentParts[1]);
            this.root.replaceWith(componentRoot.not("script"));

            for (var registeredComponent in Registry.components) {
                domIdOffset++;
            }

            // Update the data-instanceid attributes of subcomponents
            componentRoot.first().find("[data-instanceid]").andSelf().each(function () {
                $(this).attr("data-instanceid",
                             domIdOffset + parseInt($(this).attr("data-instanceid"), 10));
            });

            // Update dom ids inside controller scripts and evaluate them
            componentRoot.filter("script").each(function () {
                var scriptText = $(this).text();

                scriptText = scriptText.replace(/\((\d+)\)/g,
                    function(matchString, domId) {
                        return "(" + (parseInt(domId, 10) + domIdOffset) + ")";
                    }
                );

                scriptText = scriptText.replace(/pre-component-(\d+)/,
                    function (matchString, domId) {
                        return "pre-component-" + (parseInt(domId, 10) + domIdOffset);
                    }
                );
                
                scriptText = scriptText.replace(/post-component-(\d+)/,
                    function (matchString, domId) {
                        return "post-component-" + (parseInt(domId, 10) + domIdOffset);
                    }
                );

                scriptText = scriptText.replace(/"domId":(\d+)/,
                    function (matchString, domId) {
                        return '"domId":' + (parseInt(domId, 10) + domIdOffset);
                    }
                );

                $(this).text(scriptText);

                new Function(scriptText)();
            });
        }

        dependencies = component.dependencies.css;
        if (dependencies.length) {
            head.append('<link rel="stylesheet" type="text/css" href="/resources?files='
                    + encodeURIComponent(dependencies.join(";")) + '">');
        }
    }

    return SubsequentViewHandler;
});
