// sketch_tariffs_consumers.js - IMPROVED VERSION
// Consumer impact visualization with editorial styling
(function () {
  window.sketch_tariffs_consumers = {
    _controlsSetup: false,
    table: null,
    usaData: {},
    years: [],
    groups: [],
    tariffYears: [],
    statusMessage: "",
    storyHighlight: "",
    targetGroups: [
      "electronics",
      "chemicals",
      "manufactures",
      "mineral_fuels"
    ],

    preload: function (p) {
      if (this.table) return;
      this.statusMessage = "Loading import data…";

      this.table = p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        () => {
          this.processData();
          this.computeStoryHighlight();
        }
      );
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      this._controlsSetup = true;
      p.textFont("Inter");

      if (!this.table) {
        this.preload(p);
      } else if (!this.years.length) {
        this.processData();
        this.computeStoryHighlight();
      }
    },

    processData: function () {
      if (!this.table || typeof this.table.getRowCount !== "function") {
        this.years = [];
        this.groups = [];
        this.statusMessage = "Failed to load data table.";
        return;
      }

      const yearSet = new Set();
      const groupSet = new Set();
      const tariffByYear = {};
      let foundUSA = false;

      for (let r = 0; r < this.table.getRowCount(); r++) {
        let isUSA = false;

        for (let c = 0; c < this.table.getColumnCount(); c++) {
          const cell = (this.table.getString(r, c) || "").trim().toUpperCase();
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

        const year = parseInt(this.table.getString(r, "year"), 10);
        const group = (this.table.getString(r, "commodity_group") || "")
          .trim()
          .toLowerCase();
        const imp = parseFloat(this.table.getString(r, "import_value"));
        const tariffChange = parseFloat(
          this.table.getString(r, "tariff_change_value")
        );

        if (!year || isNaN(imp)) continue;
        if (this.targetGroups.indexOf(group) === -1) continue;

        yearSet.add(year);
        groupSet.add(group);

        if (!this.usaData[group]) this.usaData[group] = {};
        if (!this.usaData[group][year]) this.usaData[group][year] = 0;
        this.usaData[group][year] += imp;

        if (!tariffByYear[year]) tariffByYear[year] = [];
        if (!isNaN(tariffChange)) tariffByYear[year].push(tariffChange);
      }

      this.years = Array.from(yearSet).sort((a, b) => a - b);
      this.groups = this.targetGroups.filter(g => groupSet.has(g));

      if (!foundUSA) {
        this.statusMessage = "No United States trade rows found in this dataset.";
      } else if (!this.groups.length) {
        this.statusMessage = "US data found, but none of the target consumer categories were present.";
      } else {
        this.statusMessage = "";
      }

      this.tariffYears = [];
      for (const y of this.years) {
        const arr = tariffByYear[y] || [];
        if (!arr.length) continue;
        const avgChange = arr.reduce((a, b) => a + b, 0) / arr.length;
        if (avgChange > 0) this.tariffYears.push(y);
      }

      this.normalizeGroupValues();
    },

    normalizeGroupValues: function () {
      let maxVal = 0;
      for (const g of this.groups) {
        for (const y of this.years) {
          const v = (this.usaData[g] && this.usaData[g][y]) || 0;
          if (v > maxVal) maxVal = v;
        }
      }
      if (maxVal === 0) maxVal = 1;

      for (const g of this.groups) {
        for (const y of this.years) {
          const val = (this.usaData[g] && this.usaData[g][y]) || 0;
          this.usaData[g][y] = val / maxVal;
        }
      }
    },

    prettyName: function (g) {
      return g
        .split("_")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    },

    computeStoryHighlight: function () {
      if (!this.years.length || !this.groups.length) {
        this.storyHighlight = "";
        return;
      }
      const startYear = this.years[0];
      const endYear = this.years[this.years.length - 1];

      let bestGroup = null;
      let bestChange = -Infinity;
      for (const g of this.groups) {
        const s = this.usaData[g][startYear] || 0;
        const e = this.usaData[g][endYear] || 0;
        const diff = e - s;
        if (diff > bestChange) {
          bestChange = diff;
          bestGroup = g;
        }
      }

      if (!bestGroup || bestChange <= 0) {
        this.storyHighlight = "Import exposure has shifted across categories.";
        return;
      }

      this.storyHighlight =
        `${this.prettyName(bestGroup)} shows the largest rise in relative import ` +
        `exposure from ${startYear} to ${endYear}.`;
    },

    draw: function (p, manager, ai, progress) {
      if (!this._controlsSetup) this.setupControls(p);

      // Elegant gradient background
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

      if (!this.years.length) {
        p.fill(102, 102, 102);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Inter');
        p.textSize(16);
        p.text(this.statusMessage || "Loading import data…", p.width/2, p.height/2);
        return;
      }

      const marginLeft = 100;
      const marginRight = 240;
      const marginTop = 130;
      const marginBottom = 80;
      const chartWidth = p.width - marginLeft - marginRight;
      const chartHeight = p.height - marginTop - marginBottom;

      // Title
      p.textFont('Spectral');
      p.textSize(32);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      p.fill(26, 26, 26);
      p.text("Consumer Goods & Tariffs", marginLeft, 30);

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

      const xMin = this.years[0];
      const xMax = this.years[this.years.length - 1];

      // Tariff highlight bands
      for (const ty of this.tariffYears) {
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
        p.text("Tariff", midX, marginTop - 6);
        p.text("hike", midX, marginTop + 8);
      }

      // Grid
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

      // X axis ticks
      p.stroke(240, 240, 240);
      p.textAlign(p.CENTER, p.TOP);
      p.fill(102, 102, 102);
      const tickStep = Math.max(1, Math.floor(this.years.length / 7));
      for (let xi = 0; xi < this.years.length; xi += tickStep) {
        const year = this.years[xi];
        const xTick = p.map(year, xMin, xMax, marginLeft, marginLeft + chartWidth);
        p.line(xTick, marginTop + chartHeight, xTick, marginTop + chartHeight + 5);
        p.noStroke();
        p.text(year, xTick, marginTop + chartHeight + 8);
        p.stroke(240, 240, 240);
      }

      // Axis labels
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

      // Color palette - sophisticated
      const colors = {
        electronics: p.color(37, 99, 168),
        chemicals: p.color(217, 119, 6),
        mineral_fuels: p.color(139, 92, 246),
        manufactures: p.color(5, 150, 105)
      };

      // Draw lines
      for (const g of this.groups) {
        const baseColor = colors[g] || p.color(100, 100, 100);
        const isFocus = (g === "electronics" || g === "chemicals");

        p.noFill();
        p.stroke(baseColor);
        p.strokeWeight(isFocus ? 3 : 2);
        p.beginShape();
        
        let lastX = null;
        let lastY = null;
        
        for (const year of this.years) {
          let val = this.usaData[g][year] || 0;
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
            const label = this.prettyName(g);
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

      // Legend
      const legX = marginLeft + chartWidth + 20;
      const legY = marginTop;
      
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
      
      for (const g of this.groups) {
        p.fill(colors[g] || p.color(100));
        p.rect(legX + 12, cy, 28, 4, 2);
        p.fill(26, 26, 26);
        p.text(this.prettyName(g), legX + 48, cy - 4);
        cy += 26;
      }
    }
  };
})();
