define(["core/js/client_util"],
        function (ClientUtil) {

    /**
     * Handles subsequent view requests.
     * 
     * @constructor
     * @param {ViewContext} viewContext The view context associated with the manager
     */
    function ViewManager(viewContext, messaging) {
        this.viewContext = viewContext;
        this.messaging = messaging;
        this.root = viewContext.getRoot();

        /*
            Delegate all click events on A tags through the view manager's handler.
            Requests for other components take special care of correctly initializing
            the incoming component and it's dependecies.
        */
        this.root.on("click", "a", this, _handleViewRequest);
    }

    /**
     * Handles view requests.
     * 
     * @param event jQuery event object
     */
    function _handleViewRequest(event) {
        var url = $(event.currentTarget).attr("href"),
            localRequest = /^\.{0,2}\//,
            self = event.data,
            belongsToSubcomponent;

        event.preventDefault();

        // Do not handle clicks on A tags that belong to subcomponents
        belongsToSubcomponent = !!$(event.currentTarget).parentsUntil(self.root, "[data-instanceid]").length;
        if (belongsToSubcomponent) {
            return false;
        }
		
        if (localRequest.test(url)) {
			function navigateToDest() {
	            /*
	                For local requests, fetch the component and pass it
	                to {@link ViewManager#displayView}.
	            */
	            $.ajax({
	                headers:    {
	                    Accept: "text/json"
	                },
	                dataType:   "json",
	                url:        url
	            }).done(function (data) { self.displayView(data); });				
			}
			
			/**
			 * Method used to navigate to the requested page only
			 * when all intents associated with the current view context
			 * are successfully executed. 
			 * 
			 * TODO: in the future we need a discriminator passed by the developer
			 * called sync. By default this should be true.
			 */
			function moveNow(viewContext) {
				if(intents.isReady(self.viewContext)) {
					intents.removeOn("intents_context_ready", moveNow);					
										
					navigateToDest();					
				}				
			}			
			
			var intents = self.messaging._intents; 
						
			moveNow();
			
			intents.on("intents_context_ready", moveNow);
        } else {
            window.open(url, "_blank");
        }
    }

    /**
     * Displays a component's view received as a JSON descriptor.
     * 
     * @param component The incoming component's JSON description
     * @param component.id
     * @param component.dependencies
     * @param component.dependencies.css
     * @param component.dependencies.scripts
     * @param component.content The complete HTML rendered view
     * @param {Boolean} detach Whether to display the component in a modeless 
     * draggable dialog
     */
    ViewManager.prototype.displayView = function (component, detach) {
        var Registry = require("core/raintime/raintime").ComponentRegistry,
            domId = this.viewContext.instanceId,
            componentParts,
            componentContent,
            componentRoot,
            dependencies,
            head = $("head"),
            domIdOffset = 0;

        // Extract the content of the incoming component
        componentParts = component.content.match(/<body>\s*(<div[^>]*>[\s\S]*<\/div>)\s*<\/body>/);
        if (!componentParts || componentParts.length !== 2) {
            return;
        }

        /*
            We have controller initialization scripts in the body.
            jQuery strips these out of the normal DOM structure and appends
            them one by one at the end of the JQuery object set.
            
            We ignore them when inserting the incoming component's content
            in the DOM and evaluate them later.
        */
        componentContent = $(componentParts[1]);
        componentRoot = componentContent.not("script");

        if (!detach) {
            // De-register current component
            Registry.deregister(domId);
        }

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

        // Bring to the page the eventual CSS dependencies the component has
        dependencies = component.dependencies.css;
        if (dependencies.length) {
            head.append('<link rel="stylesheet" type="text/css" href="/resources?files='
                    + encodeURIComponent(dependencies.join(";")) + '">');
        }

        /*
            Insert the component into the DOM.
            We do this before evaluating the scripts so we have a ready DOM.
        */
        if (detach) {
            componentRoot.dialog({ closeOnEscape: false, width: 500, height: 400 });
        } else {
            this.root.replaceWith(componentRoot);
        }

        // Add the component's htdocs/js path to the require config paths
        requireConfig.paths[component.id] = component.id + "/htdocs/js";
        require(requireConfig);

        /*
            Step 2 of domId update: update domIds inside controller scripts
            and finally evaluate these.
        */
        componentContent.filter("script").each(function () {
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
    };

    return ViewManager;
});
