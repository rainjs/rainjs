(function( $ ) {
    /**
     * The "destroyed" event is called when the element is removed as a result of jQuery DOM
     * manipulators like remove, html, replaceWith, etc. Destroyed events do not bubble, so make
     * sure you don't use live or delegate with destroyed events.
     *
     * @example
     *      $('.foo').bind('destroyed', function () {
     *          // Clean up code.
     *      });
     */

    var oldClean = jQuery.cleanData;

    $.cleanData = function( elems ) {
        for (var i = 0, elem; (elem = elems[i]) !== undefined; i++) {
            $(elem).triggerHandler('destroyed');
        }
        oldClean(elems);
    };

})(jQuery);
