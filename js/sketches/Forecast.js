(function () {
    var Forecast = function (p) {
      // ------------------------------
      // Variables
      // ------------------------------
      p.table = null;
      p.years = [];
      p.tradeVals = [];
      p.tariffShareByYear = {};
      p.periodLabels = [];
      p.periodTradeChange = [];
      p.periodTariffTension = [];
      p.statusMessage = "Loading global trade data…";
      p._controlsSetup = false;
  
      p.periodBins = [
        { label: "2015–2017", start: 2015, end: 2017 },
        { label: "2018–2020", start: 2018, end: 2020 },
        { label: "2021–2024", start: 2021, end: 2024 }
      ];
  
      // ------------------------------
      // Helper Functions
      // ------------------------------
      p.initData = function () {
        if (p.table) return;
        p.statusMessage = "Loading global trade data...";
  
        p.table = p.loadTable(
          "data/zain/trade_master_full.csv",
          "csv",
          "header",
          () => {
            console.log("CSV loaded:", p.table.getRowCount(), "rows");
            p.processData();
            p.statusMessage = "";
          }
        );
      };
  
      p.processData = function () {
        if (!p.table || typeof p.table.getRowCount !== "function") {
          p.statusMessage = "Failed to load global trade data.";
          p.years = [];
          return;
        }
  
        const yearTrade = {};
        const tariffCounts = {};
        const tariffPosCounts = {};
  
        for (let r = 0; r < p.table.getRowCount(); r++) {
          const year = parseInt(p.table.getString(r, "year"), 10);
          if (!year) continue;
  
          const gTrade = parseFloat(p.table.getString(r, "global_total_trade"));
          if (!isNaN(gTrade) && !yearTrade[year]) yearTrade[year] = gTrade;
  
          const tVal = parseFloat(p.table.getString(r, "tariff_change_value"));
          if (!isNaN(tVal)) {
            if (!tariffCounts[year]) {
              tariffCounts[year] = 0;
              tariffPosCounts[year] = 0;
            }
            tariffCounts[year] += 1;
            if (tVal > 0) tariffPosCounts[year] += 1;
          }
        }
  
        const sortedYears = Object.keys(yearTrade)
          .map(y => parseInt(y, 10))
          .sort((a, b) => a - b);
  
        p.years = [];
        p.tradeVals = [];
        p.tariffShareByYear = {};
  
        for (let y of sortedYears) {
          p.years.push(y);
          p.tradeVals.push(yearTrade[y] / 1e12);
          const total = tariffCounts[y] || 0;
          const pos = tariffPosCounts[y] || 0;
          p.tariffShareByYear[y] = total > 0 ? pos / total : 0;
        }
  
        console.log("Years processed:", p.years);
        console.log("Trade values (trillions):", p.tradeVals);
        console.log("Tariff share by year:", p.tariffShareByYear);
  
        // Compute yearly change
        const yearlyChange = {};
        for (let i = 1; i < p.years.length; i++) {
          const prev = p.tradeVals[i - 1];
          const cur = p.tradeVals[i];
          if (prev > 0) yearlyChange[p.years[i]] = ((cur - prev) / prev) * 100;
        }
  
        // Compute period-level averages
        p.periodLabels = [];
        p.periodTradeChange = [];
        p.periodTariffTension = [];
  
        for (const bin of p.periodBins) {
          const { label, start, end } = bin;
  
          const changes = [];
          for (let y = start + 1; y <= end; y++) {
            if (yearlyChange.hasOwnProperty(y)) changes.push(yearlyChange[y]);
          }
          const avgChange = changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : null;
  
          let posSum = 0;
          let totalSum = 0;
          for (let y = start; y <= end; y++) {
            const total = tariffCounts[y] || 0;
            const pos = tariffPosCounts[y] || 0;
            posSum += pos;
            totalSum += total;
          }
          const tension = totalSum > 0 ? posSum / totalSum : 0;
  
          p.periodLabels.push(label);
          p.periodTradeChange.push(avgChange);
          p.periodTariffTension.push(tension);
        }
  
        console.log("Period labels:", p.periodLabels);
        console.log("Period trade changes:", p.periodTradeChange);
        console.log("Period tariff tension:", p.periodTariffTension);
      };
  
      p.setupControls = function () {
        if (p._controlsSetup) return;
        p._controlsSetup = true;
        p.textFont("Inter");
        p.initData();
      };
  
      // ------------------------------
      // p5 Setup & Draw
      // ------------------------------
      p.setup = function () {
        const canvas = p.createCanvas(1200, 600);
        canvas.parent("viz-container-6");
        p.setupControls();
      };
  
      p.draw = function () {
        if (!p._controlsSetup) p.setupControls();
  
        p.background("#fafafa");
  
        if (!p.periodLabels.length) {
          p.fill(102, 102, 102);
          p.textAlign(p.CENTER, p.CENTER);
          p.textFont("Inter");
          p.textSize(16);
          p.text(p.statusMessage || "Loading global trade data…", p.width / 2, p.height / 2);
          return;
        }
  
        const n = p.periodLabels.length;
        const labels = p.periodLabels;
        const tradeChange = p.periodTradeChange;
        const tariffIndex = p.periodTariffTension;
  
        const marginLeft = 100,
          marginRight = 240,
          marginTop = 130,
          marginBottom = 90;
        const chartWidth = p.width - marginLeft - marginRight;
        const chartHeight = p.height - marginTop - marginBottom;
  
        // Title
        p.textFont("Spectral");
        p.textSize(32);
        p.textStyle(p.BOLD);
        p.textAlign(p.LEFT, p.TOP);
        p.fill(26, 26, 26);
        p.text("Trade Volatility & Tariff Tension", marginLeft, 30);
  
        // Subtitle
        p.textFont("Inter");
        p.textSize(16);
        p.textStyle(p.NORMAL);
        p.fill(102, 102, 102);
        p.text("Period-by-Period Analysis", marginLeft, 70);
  
        // Additional subtitle
        p.fill(153, 153, 153);
        p.textFont("Inter");
        p.textSize(14);
        p.textStyle(p.NORMAL);
        p.textAlign(p.LEFT, p.TOP);
        p.text("Each point represents a 3-4 year period", marginLeft, 95);
  
        // Chart frame
        p.noFill();
        p.stroke(229, 229, 229);
        p.strokeWeight(2);
        p.rect(marginLeft, marginTop, chartWidth, chartHeight);
  
        // Calculate ranges for axes
        const maxTariff = Math.max(...tariffIndex);
        const minTariff = Math.min(...tariffIndex);
        const maxTrade = Math.max(...tradeChange);
        const minTrade = Math.min(...tradeChange);
        
        // Add some padding to ranges
        const tariffRange = maxTariff - minTariff;
        const tradeRange = maxTrade - minTrade;
        const tariffMin = minTariff - tariffRange * 0.1;
        const tariffMax = maxTariff + tariffRange * 0.1;
        const tradeMin = minTrade - tradeRange * 0.1;
        const tradeMax = maxTrade + tradeRange * 0.1;
  
        // Draw gridlines
        p.stroke(229, 229, 229);
        p.strokeWeight(1);
        
        // Vertical gridlines
        for (let i = 0; i <= 4; i++) {
          const x = marginLeft + (chartWidth * i) / 4;
          p.line(x, marginTop, x, marginTop + chartHeight);
        }
        
        // Horizontal gridlines
        for (let i = 0; i <= 4; i++) {
          const y = marginTop + (chartHeight * i) / 4;
          p.line(marginLeft, y, marginLeft + chartWidth, y);
        }
  
        // Map data points to pixel coordinates
        const mapX = (val) => marginLeft + ((val - tariffMin) / (tariffMax - tariffMin)) * chartWidth;
        const mapY = (val) => marginTop + chartHeight - ((val - tradeMin) / (tradeMax - tradeMin)) * chartHeight;
  
        // Draw scatter points
        for (let i = 0; i < n; i++) {
          if (tradeChange[i] !== null) {
            const x = mapX(tariffIndex[i]);
            const y = mapY(tradeChange[i]);
            
            // Draw point
            p.fill(41, 128, 185);
            p.stroke(41, 128, 185);
            p.strokeWeight(2);
            p.circle(x, y, 16);
            
            // Draw label
            p.fill(26, 26, 26);
            p.noStroke();
            p.textFont("Inter");
            p.textSize(14);
            p.textStyle(p.BOLD);
            p.textAlign(p.LEFT, p.CENTER);
            p.text(labels[i], x + 12, y);
          }
        }
  
        // X-axis label
        p.fill(230, 126, 34);
        p.textFont("Inter");
        p.textSize(16);
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.TOP);
        p.text("Tariff Tension →", marginLeft + chartWidth / 2, marginTop + chartHeight + 40);
  
        // Y-axis label
        p.push();
        p.translate(marginLeft - 60, marginTop + chartHeight / 2);
        p.rotate(-p.HALF_PI);
        p.fill(41, 128, 185);
        p.textAlign(p.CENTER, p.TOP);
        p.text("↑ Trade Volatility", 0, 0);
        p.pop();
  
        // X-axis tick labels
        p.fill(102, 102, 102);
        p.textFont("Inter");
        p.textSize(12);
        p.textStyle(p.NORMAL);
        p.textAlign(p.CENTER, p.TOP);
        for (let i = 0; i <= 4; i++) {
          const val = tariffMin + (tariffMax - tariffMin) * (i / 4);
          const x = marginLeft + (chartWidth * i) / 4;
          p.text((val * 100).toFixed(0) + "%", x, marginTop + chartHeight + 10);
        }
  
        // Y-axis tick labels
        p.textAlign(p.RIGHT, p.CENTER);
        for (let i = 0; i <= 4; i++) {
          const val = tradeMin + (tradeRange * i) / 4;
          const y = marginTop + chartHeight - (chartHeight * i) / 4;
          p.text(val.toFixed(1) + "%", marginLeft - 10, y);
        }
  
        // Legend box
        const legendX = p.width - marginRight + 20;
        const legendY = marginTop + 20;
        const legendWidth = 200;
        const legendHeight = 200;
        
        p.fill(249, 249, 249);
        p.stroke(229, 229, 229);
        p.strokeWeight(1);
        p.rect(legendX, legendY, legendWidth, legendHeight, 8);
  
        // Legend title
        p.fill(26, 26, 26);
        p.noStroke();
        p.textFont("Inter");
        p.textSize(16);
        p.textStyle(p.BOLD);
        p.textAlign(p.LEFT, p.TOP);
        p.text("How to Read", legendX + 15, legendY + 15);
  
        // Legend point example
        p.fill(41, 128, 185);
        p.stroke(41, 128, 185);
        p.strokeWeight(2);
        p.circle(legendX + 25, legendY + 55, 12);
        
        p.fill(102, 102, 102);
        p.noStroke();
        p.textSize(13);
        p.textStyle(p.NORMAL);
        p.text("Each period (3-4 years)", legendX + 40, legendY + 50);
  
        // Legend arrows
        p.textSize(12);
        p.text("→ Right: More tariff hikes", legendX + 15, legendY + 85);
        p.text("↑ Up: Higher trade swings", legendX + 15, legendY + 110);
  
        // Legend note
        p.fill(153, 153, 153);
        p.textSize(11);
        p.textStyle(p.ITALIC);
        const noteText = "Higher volatility often\ncorrelates with trade\ntension periods";
        p.text(noteText, legendX + 15, legendY + 145);
      };
    };
  
    // Export to window
    window.Forecast = Forecast;
  })();