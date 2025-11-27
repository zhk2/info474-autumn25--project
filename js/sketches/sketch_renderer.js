// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
(function () {
    window.Renderer = {

        setData: function (manager) {
            var self = this;

            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            function computeLayout(data) {
                manager.data = data;
            }

            computeLayout([]);
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {
            try { console.log('Renderer: delegating draw, ai=', ai); } catch (e) { }

            if (ai === 0 || ai === 1) {
                window.VizTitle.draw(p, manager, ai, progress);
                return;
            }
            // bar chart on data-active-index="4" — prefer VizBarGraph, fallback to VizBar
            if (ai === 4) {
                if (window.VizBarGraph && typeof window.VizBarGraph.draw === 'function') {
                    window.VizBarGraph.draw(p, manager, ai, progress);
                    return;
                }
                if (window.VizBar && typeof window.VizBar.draw === 'function') {
                    window.VizBar.draw(p, manager, ai, progress);
                    return;
                }
            }

            if (ai === 3) {
                if (window.sketch_tariff) {
                    if (typeof window.sketch_tariff.setupControls === 'function' && !window.sketch_tariff._controlsSetup) {
                        window.sketch_tariff.setupControls(p);
                        window.sketch_tariff._controlsSetup = true; // flag so it doesn’t recreate every frame
                    }
                 if (typeof window.sketch_tariff.draw === 'function') {
                     window.sketch_tariff.draw(p, manager, ai, progress);
                     return;
                    }
                    
                }
            }
            if (ai === 4) {
                if (window.sketch_gdp) {
                    if (typeof window.sketch_gdp.setupControls === "function" && !window.sketch_gdp._controlsSetup) {
                        window.sketch_gdp.setupControls(p);
                        window.sketch_gdp._controlsSetup = true;
                     }
                    if (typeof window.sketch_gdp.draw === "function") {
                        window.sketch_gdp.draw(p, manager, ai, progress);
                        return;
                    }
                }
            }



            if (ai >= 5 && ai < 7) {
                window.VizScatter.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 7) {
                // for index 7 prefer the simple VizBar (months example), fallback to VizBarGraph
                if (window.VizBar && typeof window.VizBar.draw === 'function') {
                    window.VizBar.draw(p, manager, ai, progress);
                    return;
                }
                if (window.VizBarGraph && typeof window.VizBarGraph.draw === 'function') {
                    window.VizBarGraph.draw(p, manager, ai, progress);
                    return;
                }
            }
        }
    };
})();
