(function() {
    var GDPComps = function(p) {
        // Variables
        var table = null;
        var dropdown = null;
        var countries = [];
        var dataMap = {};
        var canvas = null;
        var controlsSetup = false;
        var dataLoaded = false;

        // Helper function: Process data
        var processData = function(tbl) {
            console.log("hello")
            console.log("helpopppp")
            dataMap = {};
            countries = [];

            for (let r = 0; r < tbl.getRowCount(); r++) {
                let row = tbl.getRow(r);
                let country = row.getString("country_name");
                let year = Number(row.get("year"));

                if (isNaN(year) || (year !== 2022 && year !== 2024)) continue;

                if (!dataMap[country]) dataMap[country] = {};
                if (!dataMap[country][year]) {
                    dataMap[country][year] = {
                        gdp_usd: Number(row.get("gdp_usd")) || 0,
                        yoy_trade_balance: Number(row.get("yoy_trade_balance")) || 0,
                    };
                } else {
                    dataMap[country][year].gdp_usd += Number(row.get("gdp_usd")) || 0;
                    dataMap[country][year].yoy_trade_balance += Number(row.get("yoy_trade_balance")) || 0;
                }

                if (!countries.includes(country)) countries.push(country);
            }

            countries.sort();
            console.log("🌍 Countries after aggregation:", countries);
        };

        // Helper function: Setup controls
        var setupControls = function() {
            if (controlsSetup || !dataLoaded) return;

            canvas = p.createCanvas(900, 200);
            canvas.parent('viz-container-x');

            dropdown = p.createSelect();
            dropdown.parent('viz-container-x');
            dropdown.option("-- Select a Country --");
            countries.forEach((c) => dropdown.option(c));
            dropdown.changed(() => p.redraw());

            controlsSetup = true;
        };

        p.setup = function() {
            p.loadTable(
                "data/datasets/Improved_Dataset/trade_master_full.csv",
                "csv",
                "header",
                (tbl) => {
                    table = tbl;
                    console.log("✅ CSV loaded:", tbl.getRowCount(), "rows");
                    processData(tbl);
                    dataLoaded = true;

                    if (!controlsSetup) setupControls();
                    p.redraw();
                },
                () => console.error("❌ Failed to load CSV")
            );
        };

        p.draw = function() {
            if (!controlsSetup || !dataLoaded) return;

            p.background(255);
            p.fill(0);
            p.textSize(18);

            if (!dropdown || !countries.length) {
                p.text("Loading GDP data...", 20, 40);
                return;
            }

            let country = dropdown.value();
            if (!country || country === "-- Select a Country --") {
                p.text("Select a country to view data", 20, 40);
                return;
            }

            let before = dataMap[country]?.[2022] || { gdp_usd: 0, yoy_trade_balance: 0 };
            let after = dataMap[country]?.[2024] || { gdp_usd: 0, yoy_trade_balance: 0 };

            before.gdp_usd = Number(before.gdp_usd) || 0;
            before.yoy_trade_balance = Number(before.yoy_trade_balance) || 0;
            after.gdp_usd = Number(after.gdp_usd) || 0;
            after.yoy_trade_balance = Number(after.yoy_trade_balance) || 0;

            if (before.gdp_usd === 0 && after.gdp_usd === 0) {
                p.text("No GDP data available for this country", p.width / 2, p.height / 2);
                return;
            }

            p.textAlign(p.CENTER);
            p.text(`GDP of ${country} Before and After Tariff`, p.width / 2, 30);

            // Legend
            const legendX = 50;
            const legendY = 60;
            const spacing = 250;

            p.fill("#113EA7"); p.rect(legendX, legendY, 15, 15);
            p.fill(0); p.textAlign(p.LEFT, p.CENTER); p.text("GDP (USD)", legendX + 20, legendY + 7.5);

            p.fill("#5DD548"); p.rect(legendX + spacing, legendY, 15, 15);
            p.fill(0); p.text("Trade Balance ↑", legendX + spacing + 20, legendY + 7.5);

            p.fill("#FC3640"); p.rect(legendX + spacing*2, legendY, 15, 15);
            p.fill(0); p.text("Trade Balance ↓", legendX + spacing*2 + 20, legendY + 7.5);

            // Bars
            let maxVal = Math.max(before.gdp_usd, after.gdp_usd);
            let barWidth = 50;
            let minBarHeight = 10;
            let bars = [];

            // BEFORE 2022
            let xBefore = p.width / 3;
            let hGDPBefore = p.map(before.gdp_usd, 0, maxVal, 0, 250);
            if (hGDPBefore < minBarHeight && before.gdp_usd > 0) hGDPBefore = minBarHeight;

            p.fill("#113EA7");
            p.rect(xBefore - barWidth/2, p.height - 80 - hGDPBefore, barWidth, hGDPBefore);
            bars.push({ x: xBefore - barWidth/2, y: p.height - 80 - hGDPBefore, w: barWidth, h: hGDPBefore, label: `GDP: ${before.gdp_usd}` });

            // Trade balance above bar
            const roundedBeforeTB = Math.round(before.yoy_trade_balance * 10) / 10;
            p.fill(roundedBeforeTB >= 0 ? "#5DD548" : "#FC3640");
            p.textAlign(p.CENTER);
            p.text(`Trade Balance: ${roundedBeforeTB}`, xBefore, p.height - 80 - hGDPBefore - 15);
            p.fill(0);
            p.text("Before Tariff (2022)", xBefore, p.height - 40);

            // AFTER 2024
            let xAfter = (2 * p.width) / 3;
            let hGDPAftr = p.map(after.gdp_usd, 0, maxVal, 0, 250);
            if (hGDPAftr < minBarHeight && after.gdp_usd > 0) hGDPAftr = minBarHeight;

            p.fill("#113EA7");
            p.rect(xAfter - barWidth/2, p.height - 80 - hGDPAftr, barWidth, hGDPAftr);
            bars.push({ x: xAfter - barWidth/2, y: p.height - 80 - hGDPAftr, w: barWidth, h: hGDPAftr, label: `GDP: ${after.gdp_usd}` });

            const roundedAfterTB = Math.round(after.yoy_trade_balance * 10) / 10;
            p.fill(roundedAfterTB >= 0 ? "#5DD548" : "#FC3640");
            p.text(`Trade Balance: ${roundedAfterTB}`, xAfter, p.height - 80 - hGDPAftr - 15);
            p.fill(0);
            p.text("After Tariff (2024)", xAfter, p.height - 40);

            // Hover tooltips
            bars.forEach((b) => {
                if (p.mouseX > b.x && p.mouseX < b.x + b.w &&
                    p.mouseY > b.y && p.mouseY < b.y + b.h) {
                    p.fill(255, 255, 200);
                    p.stroke(0);
                    p.rect(p.mouseX + 10, p.mouseY - 20, p.textWidth(b.label) + 10, 20);
                    p.noStroke();
                    p.fill(0);
                    p.textAlign(p.LEFT, p.CENTER);
                    p.text(b.label, p.mouseX + 15, p.mouseY - 10);
                }
            });
        };
    };

    window.GDPComps = GDPComps;
})();