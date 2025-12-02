(function() {
    var TradeAndTariff = function(p) {
      // Declare all variables at the top
      let table = null;
      let dropdown = null;
      let countries = [];
      let dataMap = {};
      let canvas = null;
      let dataLoaded = false;
  
      // Helper function: Process CSV data
      p.processData = function(table) {
        dataMap = {};
        countries = [];
  
        for (let r = 0; r < table.getRowCount(); r++) {
          let row = table.getRow(r);
          let country = row.getString("country_name");
          let year = Number(row.get("year"));
  
          if (isNaN(year) || (year !== 2022 && year !== 2024)) continue;
  
          if (!dataMap[country]) dataMap[country] = {};
          if (!dataMap[country][year]) {
            dataMap[country][year] = {
              total_imports_country: Number(row.get("total_imports_country")) || 0,
              total_exports_country: Number(row.get("total_exports_country")) || 0,
              yoy_trade_balance: Number(row.get("yoy_trade_balance")) || 0,
            };
          } else {
            dataMap[country][year].total_imports_country += Number(row.get("total_imports_country")) || 0;
            dataMap[country][year].total_exports_country += Number(row.get("total_exports_country")) || 0;
            dataMap[country][year].yoy_trade_balance += Number(row.get("yoy_trade_balance")) || 0;
          }
  
          if (!countries.includes(country)) countries.push(country);
        }
  
        countries.sort();
        console.log("Countries after aggregation:", countries);
      };
  
      // Helper function: Draw gradient background
      p.drawGradientBackground = function() {
        const gradSteps = 30;
        p.noStroke();
        for (let i = 0; i < gradSteps; i++) {
          const inter = i / gradSteps;
          const c = p.lerpColor(
            p.color(250, 249, 246),
            p.color(245, 242, 235),
            inter
          );
          p.fill(c);
          p.rect(0, (p.height / gradSteps) * i, p.width, p.height / gradSteps + 1);
        }
      };
  
      // Helper function: Draw legend
      p.drawLegend = function() {
        const legendX = 50;
        const legendY = 60;
        const spacing = 200;
        
        p.textFont('Inter');
        p.textSize(16);
        p.textStyle(p.NORMAL);
  
        p.fill("#113EA7"); 
        p.rect(legendX, legendY, 15, 15);
        p.fill(0); 
        p.textAlign(p.LEFT, p.CENTER); 
        p.text("Imports", legendX + 20, legendY + 7.5);
  
        p.fill("#F57A00"); 
        p.rect(legendX + spacing, legendY, 15, 15);
        p.fill(0); 
        p.text("Exports", legendX + spacing + 20, legendY + 7.5);
  
        p.fill("#5DD548"); 
        p.rect(legendX + spacing * 2, legendY, 15, 15);
        p.fill(0); 
        p.text("Trade Balance ↑", legendX + spacing * 2 + 20, legendY + 7.5);
  
        p.fill("#FC3640"); 
        p.rect(legendX + spacing * 3, legendY, 15, 15);
        p.fill(0); 
        p.text("Trade Balance ↓", legendX + spacing * 3 + 20, legendY + 7.5);
      };
  
      // Setup function
      p.setup = function() {
        // Create canvas
        canvas = p.createCanvas(900, 500);
        canvas.parent('viz-container-6');
  
        // Create dropdown
        dropdown = p.createSelect();
        dropdown.option("-- Select a Country --");
        dropdown.parent('viz-container-6');
        dropdown.addClass("form-select");
        dropdown.style("width", "260px");
        dropdown.style("margin-bottom", "16px");
        dropdown.changed(() => p.redraw());
  
        // Load data
        p.loadTable(
          "data/zain/trade_master_full.csv",
          "csv",
          "header",
          (loadedTable) => {
            table = loadedTable;
            console.log("CSV loaded:", table.getRowCount(), "rows");
            p.processData(table);
            dataLoaded = true;
  
            // Populate dropdown after data loads
            countries.forEach((c) => dropdown.option(c));
            p.redraw();
          },
          () => console.error("Failed to load CSV")
        );
      };
  
      // Draw function
      p.draw = function() {
        if (!dataLoaded) {
          p.background(250, 249, 246);
          p.fill(0);
          p.textSize(18);
          p.text("Loading trade data...", 20, 40);
          return;
        }
  
        // Draw background
        p.drawGradientBackground();
  
        // Get selected country
        let country = dropdown.value();
        if (!country || country === "-- Select a Country --") {
          p.fill(0);
          p.textSize(18);
          p.text("Select a country to view data", 20, 40);
          return;
        }
  
        // Get data
        let before = dataMap[country]?.[2022] || { 
          total_imports_country: 0, 
          total_exports_country: 0, 
          yoy_trade_balance: 0 
        };
        let after = dataMap[country]?.[2024] || { 
          total_imports_country: 0, 
          total_exports_country: 0, 
          yoy_trade_balance: 0 
        };
  
        if (before.total_imports_country + before.total_exports_country === 0 &&
            after.total_imports_country + after.total_exports_country === 0) {
          p.textAlign(p.CENTER);
          p.text("No trade data available for this country", p.width / 2, p.height / 2);
          return;
        }
  
        // Draw title
        p.textFont('Spectral');
        p.textSize(20);
        p.textStyle(p.BOLD);
        p.fill(0);
        p.textAlign(p.CENTER);
        p.text(`Imports and Exports of ${country} Before and After Tariff`, p.width / 2, 30);
  
        // Draw legend
        p.drawLegend();
  
        // Draw bars
        let maxVal = Math.max(
          before.total_imports_country + before.total_exports_country,
          after.total_imports_country + after.total_exports_country
        );
        let barWidth = 50;
        let gap = 10;
        let bars = [];
  
        // BEFORE 2022
        let xBefore = p.width / 3;
        let hImpBefore = p.map(before.total_imports_country, 0, maxVal, 0, 250);
        let hExpBefore = p.map(before.total_exports_country, 0, maxVal, 0, 250);
  
        p.fill("#113EA7");
        p.rect(xBefore - barWidth - gap / 2, p.height - 80 - hImpBefore, barWidth, hImpBefore);
        bars.push({ 
          x: xBefore - barWidth - gap / 2, 
          y: p.height - 80 - hImpBefore, 
          w: barWidth, 
          h: hImpBefore, 
          label: `Imports: ${before.total_imports_country}` 
        });
  
        p.fill("#F57A00");
        p.rect(xBefore + gap / 2, p.height - 80 - hExpBefore, barWidth, hExpBefore);
        bars.push({ 
          x: xBefore + gap / 2, 
          y: p.height - 80 - hExpBefore, 
          w: barWidth, 
          h: hExpBefore, 
          label: `Exports: ${before.total_exports_country}` 
        });
  
        const roundedBeforeTB = Math.round(before.yoy_trade_balance * 10) / 10;
        p.fill(roundedBeforeTB >= 0 ? "#5DD548" : "#FC3640");
        p.textAlign(p.CENTER);
        p.textFont('Inter');
        p.textSize(16);
        p.textStyle(p.NORMAL);
        p.text(`Trade Balance: ${roundedBeforeTB}`, xBefore, p.height - 320);
        p.fill(0);
        p.text("Before Tariff (2022)", xBefore, p.height - 40);
  
        // AFTER 2024
        let xAfter = (2 * p.width) / 3;
        let hImpAfter = p.map(after.total_imports_country, 0, maxVal, 0, 250);
        let hExpAfter = p.map(after.total_exports_country, 0, maxVal, 0, 250);
  
        p.fill("#113EA7");
        p.rect(xAfter - barWidth - gap / 2, p.height - 80 - hImpAfter, barWidth, hImpAfter);
        bars.push({ 
          x: xAfter - barWidth - gap / 2, 
          y: p.height - 80 - hImpAfter, 
          w: barWidth, 
          h: hImpAfter, 
          label: `Imports: ${after.total_imports_country}` 
        });
  
        p.fill("#F57A00");
        p.rect(xAfter + gap / 2, p.height - 80 - hExpAfter, barWidth, hExpAfter);
        bars.push({ 
          x: xAfter + gap / 2, 
          y: p.height - 80 - hExpAfter, 
          w: barWidth, 
          h: hExpAfter, 
          label: `Exports: ${after.total_exports_country}` 
        });
  
        const roundedAfterTB = Math.round(after.yoy_trade_balance * 10) / 10;
        p.fill(roundedAfterTB >= 0 ? "#5DD548" : "#FC3640");
        p.text(`Trade Balance: ${roundedAfterTB}`, xAfter, p.height - 320);
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
  
    // Export to window
    window.TradeAndTariff = TradeAndTariff;
  })();