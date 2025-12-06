(function() {
    var GDPComps = function(p) {
      // ------------------------------
      // Variables
      // ------------------------------
      p.table = null;
      p.dropdown = null;
      p.countries = [];
      p.dataMap = {};
      p._controlsSetup = false;
      p._dataLoaded = false;
  
      // ------------------------------
      // Helper Functions
      // ------------------------------
      p.initData = function() {
        p.loadTable(
          "data/datasets/Improved_Dataset/trade_master_full.csv",
          "csv",
          "header",
          (tbl) => {
            p.table = tbl;
            console.log("CSV loaded:", tbl.getRowCount(), "rows");
            p.processData(tbl);
            p._dataLoaded = true;
  
            if (!p._controlsSetup) p.setupControls();
            p.redraw();
          },
          () => console.error("Error: Failed to load CSV")
        );
      };
  
      p.processData = function(tbl) {
        p.dataMap = {};
        p.countries = [];
  
        for (let r = 0; r < tbl.getRowCount(); r++) {
          let row = tbl.getRow(r);
          let country = row.getString("country_name");
          let year = Number(row.get("year"));
  
          if (isNaN(year) || (year !== 2022 && year !== 2024)) continue;
  
          if (!p.dataMap[country]) p.dataMap[country] = {};
          if (!p.dataMap[country][year]) {
            p.dataMap[country][year] = {
              gdp_usd: Number(row.get("gdp_usd")) || 0,
              yoy_trade_balance: Number(row.get("yoy_trade_balance")) || 0,
            };
          } else {
            p.dataMap[country][year].gdp_usd += Number(row.get("gdp_usd")) || 0;
            p.dataMap[country][year].yoy_trade_balance += Number(row.get("yoy_trade_balance")) || 0;
          }
  
          if (!p.countries.includes(country)) p.countries.push(country);
        }
  
        // Sort with China first
        p.countries.sort((a, b) => {
          if (a === "China") return -1;
          if (b === "China") return 1;
          return a.localeCompare(b);
        });
        console.log("Countries after aggregation:", p.countries);
      };
  
      p.setupControls = function() {
        if (p._controlsSetup || !p._dataLoaded) return;
  
        const container = document.getElementById("viz-container-5");
        if (!container) {
          console.error("viz-container-5 not found");
          return;
        }
  
        // Create wrapper div for dropdown AFTER canvas
        const dropdownWrapper = document.createElement("div");
        dropdownWrapper.style.textAlign = "center";
        dropdownWrapper.style.marginTop = "16px";
        container.appendChild(dropdownWrapper);
  
        // Dropdown
        p.dropdown = p.createSelect();
        p.countries.forEach((c) => p.dropdown.option(c));
        p.dropdown.parent(dropdownWrapper);
        p.dropdown.addClass("form-select");
        p.dropdown.style("width", "260px");
        
        // Set China as default
        p.dropdown.selected("China");
        
        p.dropdown.changed(() => p.redraw());
  
        p._controlsSetup = true;
      };
  
      p.drawBackground = function() {
        p.background("#fafafa");
      };
  
      p.drawLegend = function() {
        const legendX = 50;
        const legendY = 60;
        const spacing = 250;
  
        p.textFont('Georgia, serif');
        p.textSize(16);
        p.textStyle(p.NORMAL);
  
        p.fill("#540c85ff"); 
        p.rect(legendX, legendY, 15, 15);
        p.fill(0); 
        p.textAlign(p.LEFT, p.CENTER); 
        p.text("GDP (USD)", legendX + 20, legendY + 7.5);
  
        p.fill("#5DD548"); 
        p.rect(legendX + spacing, legendY, 15, 15);
        p.fill(0); 
        p.text("Trade Balance ↑", legendX + spacing + 20, legendY + 7.5);
  
        p.fill("#FC3640"); 
        p.rect(legendX + spacing * 2, legendY, 15, 15);
        p.fill(0); 
        p.text("Trade Balance ↓", legendX + spacing * 2 + 20, legendY + 7.5);
      };
  
      p.drawBars = function(before, after, country) {
        let maxVal = Math.max(before.gdp_usd, after.gdp_usd);
        let barWidth = 50;
        let minBarHeight = 10;
        let bars = [];
  
        // BEFORE 2022
        let xBefore = p.width / 3;
        let hGDPBefore = p.map(before.gdp_usd, 0, maxVal, 0, 250);
        if (hGDPBefore < minBarHeight && before.gdp_usd > 0) hGDPBefore = minBarHeight;
  
        p.fill("#113EA7");
        p.noStroke();
        p.rect(xBefore - barWidth/2, p.height - 80 - hGDPBefore, barWidth, hGDPBefore);
        bars.push({ 
          x: xBefore - barWidth/2, 
          y: p.height - 80 - hGDPBefore, 
          w: barWidth, 
          h: hGDPBefore, 
          label: `GDP: ${before.gdp_usd}` 
        });
  
        // Trade balance above bar
        const roundedBeforeTB = Math.round(before.yoy_trade_balance * 10) / 10;
        p.fill(roundedBeforeTB >= 0 ? "#5DD548" : "#FC3640");
        p.textAlign(p.CENTER);
        p.textFont('Georgia, serif');
        p.text(`Trade Balance: ${roundedBeforeTB}`, xBefore, p.height - 80 - hGDPBefore - 15);
        p.fill(0);
        p.text("Before Tariff (2022)", xBefore, p.height - 40);
  
        // AFTER 2024
        let xAfter = (2 * p.width) / 3;
        let hGDPAfter = p.map(after.gdp_usd, 0, maxVal, 0, 250);
        if (hGDPAfter < minBarHeight && after.gdp_usd > 0) hGDPAfter = minBarHeight;
  
        p.fill("#540c85ff");
        p.rect(xAfter - barWidth/2, p.height - 80 - hGDPAfter, barWidth, hGDPAfter);
        bars.push({ 
          x: xAfter - barWidth/2, 
          y: p.height - 80 - hGDPAfter, 
          w: barWidth, 
          h: hGDPAfter, 
          label: `GDP: ${after.gdp_usd}` 
        });
  
        const roundedAfterTB = Math.round(after.yoy_trade_balance * 10) / 10;
        p.fill(roundedAfterTB >= 0 ? "#5DD548" : "#FC3640");
        p.text(`Trade Balance: ${roundedAfterTB}`, xAfter, p.height - 80 - hGDPAfter - 15);
        p.fill(0);
        p.text("After Tariff (2024)", xAfter, p.height - 40);
  
        return bars;
      };
  
      p.drawTooltips = function(bars) {
        bars.forEach((b) => {
          if (p.mouseX > b.x && p.mouseX < b.x + b.w &&
              p.mouseY > b.y && p.mouseY < b.y + b.h) {
            p.fill(255, 255, 200);
            p.stroke(0);
            p.rect(p.mouseX + 10, p.mouseY - 20, p.textWidth(b.label) + 10, 20);
            p.noStroke();
            p.fill(0);
            p.textAlign(p.LEFT, p.CENTER);
            p.textFont('Georgia, serif');
            p.text(b.label, p.mouseX + 15, p.mouseY - 10);
          }
        });
      };
  
      // ------------------------------
      // p5 Setup & Draw
      // ------------------------------
      p.setup = function() {
        let canvas = p.createCanvas(900, 500);
        canvas.parent("viz-container-5");
        
        p.initData();
      };
  
      p.draw = function() {
        if (!p._controlsSetup || !p._dataLoaded) return;
  
        // Draw background
        p.drawBackground();
  
        if (!p.dropdown || !p.countries.length) {
          p.fill(0);
          p.textAlign(p.LEFT);
          p.textFont('Georgia, serif');
          p.textSize(18);
          p.text("Loading GDP data...", 20, 40);
          return;
        }
  
        let country = p.dropdown.value();
        if (!country) {
          p.fill(0);
          p.textAlign(p.LEFT);
          p.textFont('Georgia, serif');
          p.textSize(18);
          p.text("Select a country to view data", 20, 40);
          return;
        }
  
        let before = p.dataMap[country]?.[2022] || { gdp_usd: 0, yoy_trade_balance: 0 };
        let after = p.dataMap[country]?.[2024] || { gdp_usd: 0, yoy_trade_balance: 0 };
  
        before.gdp_usd = Number(before.gdp_usd) || 0;
        before.yoy_trade_balance = Number(before.yoy_trade_balance) || 0;
        after.gdp_usd = Number(after.gdp_usd) || 0;
        after.yoy_trade_balance = Number(after.yoy_trade_balance) || 0;
  
        if (before.gdp_usd === 0 && after.gdp_usd === 0) {
          p.fill(0);
          p.textAlign(p.CENTER);
          p.textFont('Georgia, serif');
          p.textSize(18);
          p.text("No GDP data available for this country", p.width / 2, p.height / 2);
          return;
        }
  
        // Title
        p.textFont('Georgia, serif');
        p.textSize(20);
        p.textStyle(p.BOLD);
        p.fill(0);
        p.textAlign(p.CENTER);
        p.text(`GDP of ${country} Before and After Tariff`, p.width / 2, 30);
  
        // Draw legend
        p.drawLegend();
  
        // Draw bars and get bar data for tooltips
        let bars = p.drawBars(before, after, country);
  
        // Draw tooltips
        p.drawTooltips(bars);
      };
    };
  
    // Export to window
    window.GDPComps = GDPComps;
  })();