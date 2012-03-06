define(['core/js/promised-io/promise'], function (Promise) {

    function ClientRenderer() {
        this.placeholderComponent = null;
        this.placeholderTimeout = 500;
    }

    ClientRenderer.prototype.setPlaceholder = function (component) {
        this.placeholderComponent = component;
    };

    ClientRenderer.prototype.setPlaceholderTimeout = function (milliseconds) {
        this.placeholderTimeout = milliseconds;
    };

    ClientRenderer.prototype.renderComponent = function(component) {
        if(typeof component == 'string'){
            this.placeholderComponent.instanceId = component;
            component = this.placeholderComponent;
        }
        insertComponent(this, component);
    };

    function insertComponent(self, component) {
        var domElement = $('#' + component.instanceId);
        domElement.attr('id', component.instanceId);
        domElement.attr('class', 'app-container '+component.componentId+'_'+component.version.replace(/[\.]/g, '_'));
        loadCSS(this, component.css, function(){
            domElement.html(component.html);
            for(var len = component.children.length, i = 0; i < len; i++){
                self.renderComponent(component.children[i]);
            }
        });
    }
    
    /**
     * Load css files and insert html after the css files are completely loaded
     * 
     * Maybe there is a better way
     * This works on IE8+, Chrome, FF, Safari
     */
    function loadCSS(self, css, callback){
        var head = $('head');
        var loadedFiles = 0;
        for ( var i = 0, l = css.length; i < l; i++) {
            if(head.find("link[href='"+css[i]+"']").length > 0){
                if(++loadedFiles == css.length){
                    callback();
                }
            } else {
                var link = document.createElement('link');
                link.type = 'text/css';
                link.rel = 'stylesheet';
                link.href = css[i];
                
                var loader = document.createElement('img');
                loader.onerror = function(e){
                    if(++loadedFiles == css.length){
                        callback();
                    }
                };
                head.append(link);
                loader.src = css[i];
            }
        }        
    }

    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
