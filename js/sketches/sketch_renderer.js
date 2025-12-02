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
            if (ai === 2 && window.sketch_trademap) {
                if (typeof window.sketch_trademap.setupControls === "function" && !window.sketch_trademap._controlsSetup) {
                    window.sketch_trademap.setupControls(p);
                    window.sketch_trademap._controlsSetup = true;
                }
                if (typeof window.sketch_trademap.draw === "function") {
                    window.sketch_trademap.draw(p, manager, ai, progress);
                    return;
                }
            }
            if (ai === 3 && window.sketch_stackedbar) {
                if (typeof window.sketch_stackedbar.setupControls === "function" && !window.sketch_stackedbar._controlsSetup) {
                    window.sketch_stackedbar.setupControls(p);
                    window.sketch_stackedbar._controlsSetup = true;
                }
                if (typeof window.sketch_stackedbar.draw === "function") {
                    window.sketch_stackedbar.draw(p, manager, ai, progress);
                    return;
                }
            }
            if (ai === 4) {
                if (window.sketch_tariff) {
        // Initialize data if not yet loaded
                    if (!window.sketch_tariff._dataInitialized) {
                        if (typeof window.sketch_tariff.initData === "function") {
                            window.sketch_tariff.initData(p);
                            window.sketch_tariff._dataInitialized = true; // flag to prevent multiple loads
                         }
                     }

        // Setup controls (dropdown + canvas) if not done yet
                     if (typeof window.sketch_tariff.setupControls === "function" && !window.sketch_tariff._controlsSetup) {
                         window.sketch_tariff.setupControls(p);
                     }

        // Only draw if draw function exists
                    if (typeof window.sketch_tariff.draw === "function") {
                        window.sketch_tariff.draw(p);
                        return;
                    }
                }
            }
            if (ai === 5 && window.sketch_gdp) {
    // Ensure data is loaded first
                if (typeof window.sketch_gdp.initData === "function" && !window.sketch_gdp._dataLoaded) {
                    window.sketch_gdp.initData(p);
                    return; // stop here, wait for data to load
                 }

    // Ensure controls are set up
                if (typeof window.sketch_gdp.setupControls === "function" && !window.sketch_gdp._controlsSetup) {
                    window.sketch_gdp.setupControls(p);
                    return; // stop here, wait for next draw
                }

    // Only draw if both data and controls are ready
                if (typeof window.sketch_gdp.draw === "function") {
                    window.sketch_gdp.draw(p, manager, ai, progress);
                    return;
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
                    if (typeof window.sketch_global_trade_forecast.setupControls === "function" && !window.sketch_global_trade_forecast._controlsSetup) {
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
