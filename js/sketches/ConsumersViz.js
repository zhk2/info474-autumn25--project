(function () {
    var ConsumersViz = function (p) {
      // ------------------------------
      // Variables
      // ------------------------------
      p.table = null;
      p.usaData = {};
      p.years = [];
      p.groups = [];
      p.tariffYears = [];
      p.statusMessage = "";
      p.storyHighlight = "";
      p._controlsSetup = false;
  
      p.targetGroups = [
        "electronics",
        "chemicals",
        "manufactures",
        "mineral_fuels"
      ];
  
      p.colors = {
        electronics: null,
        chemicals: null,
        mineral_fuels: null,
        manufactures: null
      };
  
      // ------------------------------
      // Helper Functions
      // ------------------------------
      p.initData = function () {
        if (p.table) return;
        p.statusMessage = "Loading import data…";
  
        p.table = p.loadTable(
          "data/zain/trade_master_full.csv",
          "csv",
          "header",
          () => {
            console.log("CSV loaded:", p.table.getRowCount(), "rows");
            p.processData();
            p.computeStoryHighlight();
            p.statusMessage = "";
          },
          () => {
            console.error("Failed to load CSV");
            p.statusMessage = "Failed to load data table.";
          }
        );
      };
  
      p.processData = function () {
        if (!p.table || typeof p.table.getRowCount !== "function") {
          p.years = [];
          p.groups = [];
          p.statusMessage = "Failed to load data table.";
          return;
        }
  
        const yearSet = new Set();
        const groupSet = new Set();
        const tariffByYear = {};
        let foundUSA = false;
  
        for (let r = 0; r < p.table.getRowCount(); r++) {
          let isUSA = false;
  
          for (let c = 0; c < p.table.getColumnCount(); c++) {
            const cell = (p.table.getString(r, c) || "").trim().toUpperCase();
            if (
              cell === "USA" ||
              cell === "UNITED STATES" ||
              cell === "UNITED STATES OF AMERICA"
            ) {
              isUSA = true;
              break;
            }
          }
  
          if (!isUSA) continue;
          foundUSA = true;
  
          const year = parseInt(p.table.getString(r, "year"), 10);
          const group = (p.table.getString(r, "commodity_group") || "")
            .trim()
            .toLowerCase();
          const imp = parseFloat(p.table.getString(r, "import_value"));
          const tariffChange = parseFloat(
            p.table.getString(r, "tariff_change_value")
          );
  
          if (!year || isNaN(imp)) continue;
          if (p.targetGroups.indexOf(group) === -1) continue;
  
          yearSet.add(year);
          groupSet.add(group);
  
          if (!p.usaData[group]) p.usaData[group] = {};
          if (!p.usaData[group][year]) p.usaData[group][year] = 0;
          p.usaData[group][year] += imp;
  
          if (!tariffByYear[year]) tariffByYear[year] = [];
          if (!isNaN(tariffChange)) tariffByYear[year].push(tariffChange);
        }
  
        p.years = Array.from(yearSet).sort((a, b) => a - b);
        p.groups = p.targetGroups.filter(g => groupSet.has(g));
  
        if (!foundUSA) {
          p.statusMessage = "No United States trade rows found in this dataset.";
        } else if (!p.groups.length) {
          p.statusMessage = "US data found, but none of the target consumer categories were present.";
        } else {
          p.statusMessage = "";
        }
  
        p.tariffYears = [];
        for (const y of p.years) {
          const arr = tariffByYear[y] || [];
          if (!arr.length) continue;
          const avgChange = arr.reduce((a, b) => a + b, 0) / arr.length;
          if (avgChange > 0) p.tariffYears.push(y);
        }
  
        p.normalizeGroupValues();
      };
  
      p.normalizeGroupValues = function () {
        let maxVal = 0;
        for (const g of p.groups) {
          for (const y of p.years) {
            const v = (p.usaData[g] && p.usaData[g][y]) || 0;
            if (v > maxVal) maxVal = v;
          }
        }
        if (maxVal === 0) maxVal = 1;
  
        for (const g of p.groups) {
          for (const y of p.years) {
            const val = (p.usaData[g] && p.usaData[g][y]) || 0;
            p.usaData[g][y] = val / maxVal;
          }
        }
      };
  
      p.prettyName = function (g) {
        return g
          .split("_")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      };
  
      p.computeStoryHighlight = function () {
        if (!p.years.length || !p.groups.length) {
          p.storyHighlight = "";
          return;
        }
        const startYear = p.years[0];
        const endYear = p.years[p.years.length - 1];
  
        let bestGroup = null;
        let bestChange = -Infinity;
        for (const g of p.groups) {
          const s = p.usaData[g][startYear] || 0;
          const e = p.usaData[g][endYear] || 0;
          const diff = e - s;
          if (diff > bestChange) {
            bestChange = diff;
            bestGroup = g;
          }
        }
  
        if (!bestGroup || bestChange <= 0) {
          p.storyHighlight = "Import exposure has shifted across categories.";
          return;
        }
  
        p.storyHighlight =
          `${p.prettyName(bestGroup)} shows the largest rise in relative import ` +
          `exposure from ${startYear} to ${endYear}.`;
      };
  
      p.setupControls = function () {
        if (p._controlsSetup) return;
        p._controlsSetup = true;
        p.textFont("Inter");
  
        // Initialize colors
        p.colors.electronics = p.color(37, 99, 168);
        p.colors.chemicals = p.color(217, 119, 6);
        p.colors.mineral_fuels = p.color(139, 92, 246);
        p.colors.manufactures = p.color(5, 150, 105);
      };
  
      p.drawGradientBackground = function () {
        const gradSteps = 30;
        p.noStroke();
        for (let i = 0; i < gradSteps; i++) {
          const inter = i / gradSteps;
          const c = p.lerpColor(
            p.color("#fafafa"),
            p.color("#fafafa"),
            inter
          );
          p.fill(c);
          p.rect(0, (p.height / gradSteps) * i, p.width, p.height / gradSteps + 1);
        }
      };
  
      p.drawTariffBands = function (marginLeft, marginTop, chartWidth, chartHeight, xMin, xMax) {
        for (const ty of p.tariffYears) {
          p.fill(255, 220, 220, 90);
          p.noStroke();
          const tx1 = p.map(ty - 0.5, xMin, xMax, marginLeft, marginLeft + chartWidth);
          const tx2 = p.map(ty + 0.5, xMin, xMax, marginLeft, marginLeft + chartWidth);
          p.rect(tx1, marginTop, tx2 - tx1, chartHeight);
          
          // Label
          p.fill(220, 38, 38);
          p.textSize(10);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.textFont('Inter');
          const midX = (tx1 + tx2) / 2;
          p.text("Tariff hike", midX, marginTop - 6);
          p.text("years",      midX, marginTop + 8);
        }
      };
  
      p.drawGrid = function (marginLeft, marginTop, chartWidth, chartHeight) {
        p.stroke(245, 245, 245);
        p.strokeWeight(1);
        const yTicks = [0.0, 0.25, 0.5, 0.75, 1.0];
        p.textFont('Inter');
        p.textSize(11);
        p.textAlign(p.RIGHT, p.CENTER);
        p.fill(102, 102, 102);
        
        for (let i = 0; i < yTicks.length; i++) {
          const val = yTicks[i];
          const yPos = p.map(val, 0, 1, marginTop + chartHeight, marginTop);
          p.line(marginLeft, yPos, marginLeft + chartWidth, yPos);
          p.noStroke();
          p.text(val.toFixed(2), marginLeft - 10, yPos);
          p.stroke(245, 245, 245);
        }
        console.log("made!")
      };
  
      p.drawXAxisTicks = function (marginLeft, marginTop, chartWidth, chartHeight, xMin, xMax) {
        p.stroke(240, 240, 240);
        p.textAlign(p.CENTER, p.TOP);
        p.fill(102, 102, 102);
        const tickStep = Math.max(1, Math.floor(p.years.length / 7));
        for (let xi = 0; xi < p.years.length; xi += tickStep) {
          const year = p.years[xi];
          const xTick = p.map(year, xMin, xMax, marginLeft, marginLeft + chartWidth);
          p.line(xTick, marginTop + chartHeight, xTick, marginTop + chartHeight + 5);
          p.noStroke();
          p.text(year, xTick, marginTop + chartHeight + 8);
          p.stroke(240, 240, 240);
        }
      };
  
      p.drawAxisLabels = function (marginLeft, marginTop, chartWidth, chartHeight) {
        p.noStroke();
        p.fill(102, 102, 102);
        p.textSize(12);
        p.textAlign(p.CENTER, p.TOP);
        p.text("Year", marginLeft + chartWidth / 2, marginTop + chartHeight + 40);
  
        p.push();
        p.translate(50, marginTop + chartHeight / 2);
        p.rotate(-p.HALF_PI);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Import Exposure (normalized)", 0, 0);
        p.pop();
      };
  
      p.drawLines = function (marginLeft, marginTop, chartWidth, chartHeight, xMin, xMax) {
        for (const g of p.groups) {
          const baseColor = p.colors[g] || p.color(100, 100, 100);
          const isFocus = (g === "electronics" || g === "chemicals");
  
          p.noFill();
          p.stroke(baseColor);
          p.strokeWeight(isFocus ? 3 : 2);
          p.beginShape();
          
          let lastX = null;
          let lastY = null;
          
          for (const year of p.years) {
            let val = p.usaData[g][year] || 0;
            const xPos = p.map(year, xMin, xMax, marginLeft, marginLeft + chartWidth);
            const yPos = p.map(val, 0, 1, marginTop + chartHeight, marginTop);
            p.vertex(xPos, yPos);
            lastX = xPos;
            lastY = yPos;
          }
          p.endShape();
  
          // End point
          if (lastX !== null && lastY !== null) {
            p.noStroke();
            p.fill(baseColor);
            p.circle(lastX, lastY, isFocus ? 6 : 4);
  
            // Label for focus categories
            if (isFocus) {
              const label = p.prettyName(g);
              p.fill(255, 255, 255, 240);
              p.stroke(baseColor);
              p.strokeWeight(1);
              const padding = 8;
              const textW = p.textWidth(label) + padding * 2;
              p.rect(lastX + 10, lastY - 10, textW, 20, 4);
              
              p.noStroke();
              p.fill(baseColor);
              p.textAlign(p.LEFT, p.CENTER);
              p.textSize(12);
              p.textStyle(p.BOLD);
              p.text(label, lastX + 10 + padding, lastY);
            }
          }
        }
      };
  
      p.drawLegend = function (marginLeft, marginTop, chartWidth) {
        const legX = marginLeft + chartWidth + 20;
        const legY = marginTop + 30;
        
        p.fill(255, 255, 255, 250);
        p.stroke(229, 229, 229);
        p.strokeWeight(1);
        p.rect(legX, legY, 200, 140, 6);
        
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.textFont('Inter');
        p.textSize(13);
        p.textStyle(p.BOLD);
        p.fill(26, 26, 26);
        p.text("Categories", legX + 12, legY + 12);
        
        let cy = legY + 38;
        p.textStyle(p.NORMAL);
        p.textSize(12);
        
        for (const g of p.groups) {
          p.fill(p.colors[g] || p.color(100));
          p.rect(legX + 12, cy, 28, 4, 2);
          p.fill(26, 26, 26);
          p.text(p.prettyName(g), legX + 48, cy - 4);
          cy += 26;
        }
      };
  
      // ------------------------------
      // p5 Setup & Draw
      // ------------------------------
      p.setup = function () {
        const canvas = p.createCanvas(1200, 600);
        canvas.parent("viz-container-50");
        
        p.setupControls();
        p.initData();
      };
  
      p.draw = function () {
        if (!p._controlsSetup) p.setupControls();
  
        // Draw gradient background
        p.drawGradientBackground();
  
        if (!p.years.length) {
          p.fill(102, 102, 102);
          p.textAlign(p.CENTER, p.CENTER);
          p.textFont('Inter');
          p.textSize(16);
          p.text(p.statusMessage || "Loading import data…", p.width / 2, p.height / 2);
          return;
        }
  
        const marginLeft = 120;
        const marginRight = 260;
        const marginTop = 150;
        const marginBottom = 100;
        const chartWidth = p.width - marginLeft - marginRight;
        const chartHeight = p.height - marginTop - marginBottom;
  
        // Title
        p.textFont('Spectral');
        p.textSize(32);
        p.textStyle(p.BOLD);
        p.textAlign(p.LEFT, p.TOP);
        p.fill(26, 26, 26);
        p.text("Consumer Goods & Tariffs (2015-2024)", marginLeft, 30);
  
        // Subtitle
        p.textFont('Inter');
        p.textSize(16);
        p.textStyle(p.NORMAL);
        p.fill(102, 102, 102);
        p.text("US Import Exposure by Category", marginLeft, 70);
  
        // Description
        p.textSize(13);
        p.fill(153, 153, 153);
        const desc = "Normalized import dependence (0–1) with tariff hike periods highlighted";
        p.text(desc, marginLeft, 95);
  
        // Chart frame
        p.noFill();
        p.stroke(229, 229, 229);
        p.strokeWeight(2);
        p.rect(marginLeft, marginTop, chartWidth, chartHeight);
  
        const xMin = p.years[0];
        const xMax = p.years[p.years.length - 1];
  
        // Draw components
        p.drawTariffBands(marginLeft, marginTop, chartWidth, chartHeight, xMin, xMax);
        p.drawGrid(marginLeft, marginTop, chartWidth, chartHeight);
        p.drawXAxisTicks(marginLeft, marginTop, chartWidth, chartHeight, xMin, xMax);
        p.drawAxisLabels(marginLeft, marginTop, chartWidth, chartHeight);
        p.drawLines(marginLeft, marginTop, chartWidth, chartHeight, xMin, xMax);
        p.drawLegend(marginLeft, marginTop, chartWidth);
      };
    };
  
    // Export to window
    window.ConsumersViz = ConsumersViz;
  })();
