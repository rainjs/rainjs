define(['js/lib/jquery-ui-1.10.2.custom'], function () {
    "use strict";

    function Scrollable() {}

    /**
     * Configures the scrollable panel
     */
    Scrollable.prototype.start = function () {
        var self = this;
        this._root = this.context.getRoot();
        this._scrollPane = this._root.find('.scroll-pane');
        this._scrollContent = this._root.find('.scroll-content');
        this._scrollbar = this._root.find('.scroll-bar');

        this._scrollbar.slider({
            slide: function (event, ui) {
                if (self._scrollContent.width() > self._scrollPane.width()) {
                    var maxMargin = self._scrollPane.width() - self._scrollContent.width();
                    var marginLeft = Math.round((ui.value / 100) * maxMargin) + 'px';
                    self._scrollContent.css('margin-left', marginLeft);
                } else {
                    self._scrollContent.css('margin-left', 0);
                }
            }
        });

        this._sliderHandle = this._root.find('.ui-slider-handle');
        this._sliderHandle.append('<span class="ui-icon ui-icon-grip-dotted-vertical"></span>');
        this._sliderHandle.wrap('<div class="ui-handle-helper-parent"></div>');
        this._handleHelper = this._sliderHandle.parent();

        this._sliderHandle.mousedown(function () {
            self._scrollbar.width(self._handleHelper.width());
        });
        this._sliderHandle.mouseup(function () {
            self._scrollbar.width('100%');
        });

        this._computeScrollbarSize();

        $(window).resize(function () {
            self._resetValue();
            self._computeScrollbarSize();
            self._reflowContent();
        });
    };

    /**
     * Computes the scrollbar width proportionally to the scroll distance.
     */
    Scrollable.prototype._computeScrollbarSize = function () {
        var remainder = this._scrollContent.width() - this._scrollPane.width();
        var proportion = remainder / this._scrollContent.width();
        var handleSize = this._scrollPane.width() * (1 - proportion);
        this._sliderHandle.css({
            width: handleSize,
            'margin-left': -handleSize / 2
        });
        this._handleHelper.width(this._scrollPane.width() - handleSize);
    };

    /**
     * Reset slider value based on scroll content position
     */
    Scrollable.prototype._resetValue = function () {
        var remainder = this._scrollPane.width() - this._scrollContent.width();
        var leftVal = this._scrollContent.css('margin-left') === 'auto' ? 0 :
            parseInt(this._scrollContent.css('margin-left'), 10);
        var percentage = Math.round(leftVal / remainder * 100);
        this._scrollbar.slider('value', percentage);
    };

    /**
     * if the slider is 100% and window gets larger, reveal content
     */
    Scrollable.prototype._reflowContent = function () {
        var showing = this._scrollContent.width() +
            parseInt(this._scrollContent.css('margin-right'), 10);
        var gap = this._scrollPane.width() - showing;
        if (gap > 0) {
            this._scrollContent.css('margin-right',
                parseInt(this._scrollContent.css('margin-right'), 10) + gap);
        }
    };

    return Scrollable;

});
