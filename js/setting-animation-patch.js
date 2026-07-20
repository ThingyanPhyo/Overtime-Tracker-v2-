/**
 * setting-animation-patch.js
 *
 * Adds slide-in / slide-out animation to sub-layouts
 * without modifying original setting.js or style.css.
 *
 * Usage: load this file after setting.js in index.html
 *   <script src="setting.js"></script>
 *   <script src="setting-animation-patch.js"></script>
 */

(function () {
    'use strict';

    // Wait until window.openSubLayout is available, then patch
    function applyPatch() {
        var original = window.openSubLayout;

        if (typeof original !== 'function') {
            // openSubLayout not ready yet - retry in 50ms
            setTimeout(applyPatch, 50);
            return;
        }

        /**
         * Patched openSubLayout
         * Calls original function first, then applies slide-in animation
         * to the .sub-layout element after render.
         */
        window.openSubLayout = function (title, contentFn, options) {
            // 1) Call original function first
            original.call(this, title, contentFn, options);

            // 2) After render, find sub-layout and attach animation
            requestAnimationFrame(function () {
                var subLayout = document.querySelector('.sub-layout');
                if (!subLayout) return;

                // Remove slide-out class if present
                subLayout.classList.remove('slide-out');

                // Force reflow to restart .sub-body animation
                var subBody = subLayout.querySelector('.sub-body');
                if (subBody) {
                    void subBody.offsetWidth;
                }

                // Attach slide-out on back button click
                attachSlideOutOnBack(subLayout);
            });
        };

        console.log('[AnimPatch] openSubLayout patched with slide animation OK');
    }

    /**
     * Adds slide-out class when back button is clicked,
     * allowing the exit animation to play before cleanup.
     */
    function attachSlideOutOnBack(subLayout) {
        // Match the 3 back button selector patterns used in setting.js
        var backBtn =
            document.getElementById('sub-back-btn') ||
            subLayout.querySelector('.back-btn') ||
            document.querySelector('.head-nav .back-btn');

        if (!backBtn) return;

        // once: true - fires only once per open
        backBtn.addEventListener('click', function () {
            var currentSub = document.querySelector('.sub-layout');
            if (!currentSub) return;
            currentSub.classList.add('slide-out');
        }, { once: true });
    }

    // Apply patch when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPatch);
    } else {
        applyPatch();
    }

})();
