(function () {
  var TariffViz = function (p) {
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
    p.initData = function () {
      p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        (table) => {
          p.table = table;
          console.log("CSV loaded:", table.getRowCount(), "rows");
          p.processData(table);
          p._dataLoaded = true;

          if (!p._controlsSetup) p.setupControls();
          p.redraw();
        },
        () => console.error("Failed to load CSV")
      );
    };

    p.processData = function (table) {
      p.dataMap = {};
      p.countries = [];

      for (let r = 0; r < table.getRowCount(); r++) {
        let row = table.getRow(r);
        let country = row.getString("country_name");
        let year = Number(row.get("year"));

        if (isNaN(year) || (year !== 2022 && year !== 2024)) continue;

        if (!p.dataMap[country]) p.dataMap[country] = {};
        if (!p.dataMap[country][year]) {
          p.dataMap[country][year] = {
            total_imports_country: Number(row.get("total_imports_country")) || 0,
            total_exports_country: Number(row.get("total_exports_country")) || 0,
            yoy_trade_balance: Number(row.get("yoy_trade_balance")) || 0,
          };
        } else {
          p.dataMap[country][year].total_imports_country += Number(row.get("total_imports_country")) || 0;
          p.dataMap[country][year].total_exports_country += Number(row.get("total_exports_country")) || 0;
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

    p.setupControls = function () {
      if (p._controlsSetup || !p._dataLoaded) return;

      // Get the viz container
      const container = document.getElementById("viz-container-4");
      if (!container) {
        console.error("viz-container-4 not found");
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

    p.drawHorizontalBars = function () {
      const chartBottom = p.height - 80;
      const chartTop = p.height - 330;
      
      // Alternating bars
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        if (i % 2 === 0) {
          p.fill(245, 245, 245); // Light gray for even bars
          const barHeight = (chartBottom - chartTop) / 5;
          p.rect(0, chartTop + (i * barHeight), p.width, barHeight);
        }
      }
    };

    p.drawGradientBackground = function () {
      const gradSteps = 30;
      p.noStroke();
      for (let i = 0; i < gradSteps; i++) {
        const inter = i / gradSteps;
        const c = p.lerpColor(
          p.color('#fafafa'),
          p.color('#fafafa'),
          inter
        );
        p.fill(c);
        p.rect(0, (p.height / gradSteps) * i, p.width, p.height / gradSteps + 1);
      }
    };

    p.drawLegend = function () {
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
      p.text("Year Over Year Trade Balance ↑", legendX + spacing * 2 + 20, legendY + 7.5);

      p.fill("#FC3640"); 
      p.rect(legendX + spacing * 3, legendY, 15, 15);
      p.fill(0); 
      p.text("Year Over Year Trade Balance ↓", legendX + spacing * 3 + 20, legendY + 7.5);
    };

    p.drawBars = function (before, after, country) {
      // USD formatter
      const formatUSD = (val) => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          currencyDisplay: "code",
          maximumFractionDigits: 0
        }).format(val);
      };
    
      // Ensure numbers
      before.total_imports_country = Number(before.total_imports_country) || 0;
      before.total_exports_country = Number(before.total_exports_country) || 0;
      before.yoy_trade_balance = Number(before.yoy_trade_balance) || 0;
    
      after.total_imports_country = Number(after.total_imports_country) || 0;
      after.total_exports_country = Number(after.total_exports_country) || 0;
      after.yoy_trade_balance = Number(after.yoy_trade_balance) || 0;
    
      let maxVal = Math.max(
        before.total_imports_country + before.total_exports_country,
        after.total_imports_country + after.total_exports_country
      );
    
      let barWidth = 50;
      let gap = 10;
      let bars = [];
    
      // Y-axis setup
      const yAxisX = 80;
      const chartBottom = p.height - 80;
      const chartTop = p.height - 330;
    
      p.stroke(200);
      p.strokeWeight(2);
      p.line(yAxisX, chartTop, yAxisX, chartBottom);
    
      p.textFont("Inter");
      p.textSize(11);
      p.fill(102);
      p.textAlign(p.RIGHT, p.CENTER);
    
      // Y-axis ticks
      const numTicks = 5;
      for (let i = 0; i <= numTicks; i++) {
        const tickValue = (maxVal / numTicks) * i;
        const yPos = p.map(tickValue, 0, maxVal, chartBottom, chartTop);
    
        p.stroke(200);
        p.line(yAxisX - 5, yPos, yAxisX, yPos);
    
        // Human readable format
        p.noStroke();
        let label;
        if (tickValue >= 1e12) label = "$" + (tickValue / 1e12).toFixed(1) + "T";
        else if (tickValue >= 1e9) label = "$" + (tickValue / 1e9).toFixed(1) + "B";
        else if (tickValue >= 1e6) label = "$" + (tickValue / 1e6).toFixed(1) + "M";
        else label = "$" + tickValue.toFixed(0);
    
        p.text(label + " USD", yAxisX - 10, yPos);
      }
    
      // BEFORE (left)
      let xBefore = p.width / 3;
      let hImpBefore = p.map(before.total_imports_country, 0, maxVal, 0, 250);
      let hExpBefore = p.map(before.total_exports_country, 0, maxVal, 0, 250);
    
      // Before Imports
      p.fill("#113EA7");
      p.rect(xBefore - barWidth - gap / 2, chartBottom - hImpBefore, barWidth, hImpBefore);
      bars.push({
        x: xBefore - barWidth - gap / 2,
        y: chartBottom - hImpBefore,
        w: barWidth,
        h: hImpBefore,
        label: `Imports: ${formatUSD(before.total_imports_country)}`
      });
    
      // Before Exports
      p.fill("#F57A00");
      p.rect(xBefore + gap / 2, chartBottom - hExpBefore, barWidth, hExpBefore);
      bars.push({
        x: xBefore + gap / 2,
        y: chartBottom - hExpBefore,
        w: barWidth,
        h: hExpBefore,
        label: `Exports: ${formatUSD(before.total_exports_country)}`
      });
    
      // Before Trade Balance
      const roundedBeforeTB = Math.round(before.yoy_trade_balance * 10) / 10;
      p.fill(roundedBeforeTB >= 0 ? "#5DD548" : "#FC3640");
      p.textAlign(p.CENTER);
      p.text(`Trade Balance: ${roundedBeforeTB}`, xBefore, chartTop - 10);
      p.fill(0);
      p.text("Before Tariff (2022)", xBefore, chartBottom + 40);
    
      // AFTER (right)
      let xAfter = (2 * p.width) / 3;
      let hImpAfter = p.map(after.total_imports_country, 0, maxVal, 0, 250);
      let hExpAfter = p.map(after.total_exports_country, 0, maxVal, 0, 250);
    
      // After Imports
      p.fill("#113EA7");
      p.rect(xAfter - barWidth - gap / 2, chartBottom - hImpAfter, barWidth, hImpAfter);
      bars.push({
        x: xAfter - barWidth - gap / 2,
        y: chartBottom - hImpAfter,
        w: barWidth,
        h: hImpAfter,
        label: `Imports: ${formatUSD(after.total_imports_country)}`
      });
    
      // After Exports  (THIS WAS THE MISSING BAR)
      p.fill("#F57A00");
      p.rect(xAfter + gap / 2, chartBottom - hExpAfter, barWidth, hExpAfter);
      bars.push({
        x: xAfter + gap / 2,
        y: chartBottom - hExpAfter,
        w: barWidth,
        h: hExpAfter,
        label: `Exports: ${formatUSD(after.total_exports_country)}`
      });
    
      // After Trade Balance
      const roundedAfterTB = Math.round(after.yoy_trade_balance * 10) / 10;
      p.fill(roundedAfterTB >= 0 ? "#5DD548" : "#FC3640");
      p.text(`Trade Balance: ${roundedAfterTB}`, xAfter, chartTop - 10);
      p.fill(0);
      p.text("After Tariff (2024)", xAfter, chartBottom + 40);
    
      return bars;
    };
    

    p.drawTooltips = function (bars) {
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

    // ------------------------------
    // p5 Setup & Draw
    // ------------------------------
    p.setup = function () {
      let canvas = p.createCanvas(900, 500);
      canvas.parent("viz-container-4");
      
      p.initData();
    };

    p.draw = function () {
      if (!p._controlsSetup || !p._dataLoaded) return;

      p.drawGradientBackground();
      p.drawHorizontalBars();

      if (!p.dropdown || !p.countries.length) {
        p.fill(0);
        p.textAlign(p.LEFT);
        p.text("Loading trade data...", 20, 40);
        return;
      }

      let country = p.dropdown.value();
      if (!country) {
        p.fill(0);
        p.textAlign(p.LEFT);
        p.text("Select a country to view data", 20, 40);
        return;
      }

      let before = p.dataMap[country]?.[2022] || { 
        total_imports_country: 0, 
        total_exports_country: 0, 
        yoy_trade_balance: 0 
      };
      let after = p.dataMap[country]?.[2024] || { 
        total_imports_country: 0, 
        total_exports_country: 0, 
        yoy_trade_balance: 0 
      };

      after.total_imports_country = Number(after.total_imports_country) || 0;
      after.total_exports_country = Number(after.total_exports_country) || 0;
      after.yoy_trade_balance = Number(after.yoy_trade_balance) || 0;

      if (before.total_imports_country + before.total_exports_country === 0 &&
          after.total_imports_country + after.total_exports_country === 0) {
        p.fill(0);
        p.textAlign(p.CENTER);
        p.text("No trade data available for this country", p.width / 2, p.height / 2);
        return;
      }

      // Title
      // p.textFont('Spectral');
      p.textSize(20);
      p.textStyle(p.BOLD);
      p.fill(0);
      p.textAlign(p.CENTER);
      p.text(`Imports and Exports of ${country} Before and After Tariff`, p.width / 2, 30);

      // Draw legend
      p.drawLegend();

      // Draw bars and get bar data for tooltips
      let bars = p.drawBars(before, after, country);

      // Draw tooltips
      p.drawTooltips(bars);
    };
  };

  // Export to window
  window.TariffViz = TariffViz;
})();