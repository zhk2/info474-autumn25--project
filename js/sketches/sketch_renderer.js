// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
(function () {
    window.Renderer = {

        setData: function (manager) {
            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            function computeLayout(data) {
                manager.data = data;
            }

            computeLayout([]);
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {
            try { 
                console.log('Renderer: delegating draw, ai=', ai); 
            } catch (e) { }

            if (ai === 0 || ai === 1) {
                window.VizTitle.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 4) {
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

            if (ai === 5) {
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
            
            if (ai === 6) {
                if (window.sketch_tariffs_consumers) {
                    if (typeof window.sketch_tariffs_consumers.setupControls === "function" && !window.sketch_tariffs_consumers._controlsSetup) {
                        window.sketch_tariffs_consumers.setupControls(p);
                        window.sketch_tariffs_consumers._controlsSetup = true;
                    }
                    if (typeof window.sketch_tariffs_consumers.draw === "function") {
                        window.sketch_tariffs_consumers.draw(p, manager, ai, progress);
                        return;
                    }
                }
            }


            if (ai === 7) {
                if (window.sketch_global_trade_forecast) {
                    if (typeof window.sketch_global_trade_forecast === "function" && !window.sketch_global_trade_forecast) {
                        window.sketch_global_trade_forecast.setupControls(p);
                        window.sketch_global_trade_forecast._controlsSetup = true;
                    }
                    if (typeof window.sketch_global_trade_forecast.draw === "function") {
                        window.sketch_global_trade_forecast.draw(p, manager, ai, progress);
                        return;
                    }
                }
            }


            if (ai >= 5 && ai < 7) {
                window.VizScatter.draw(p, manager, ai, progress);
                return;
            }

        }
    };
})();
