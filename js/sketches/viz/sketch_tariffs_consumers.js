// sketch_tariffs_consumers.js
// Story: "How Tariffs Affect Consumers: Which Goods Are Most Exposed?"

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

      // Show a loading message until the callback fires
      this.statusMessage = "Loading import data…";

      this.table = p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        () => {
          // 🔹 Only process once the CSV has finished loading
          this.processData();
          this.computeStoryHighlight();
        }
      );
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      this._controlsSetup = true;
      p.textFont("sans-serif");

      // If table isn’t loaded yet, trigger preload (which has a callback)
      if (!this.table) {
        this.preload(p);
      } else if (!this.years.length) {
        // If table already exists but we haven’t processed it, do it now
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

      // 🔹 Scan every column in each row and keep rows that contain USA / United States
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
        this.statusMessage =
          "No United States trade rows found in this dataset.";
      } else if (!this.groups.length) {
        this.statusMessage =
          "US data found, but none of the target consumer categories were present.";
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
        this.storyHighlight =
          "Import exposure has shifted across categories, but not every consumer good responds the same way to tariffs.";
        return;
      }

      this.storyHighlight =
        `${this.prettyName(bestGroup)} shows the largest rise in relative import ` +
        `exposure from ${startYear} to ${endYear}, meaning tariffs and demand ` +
        "pressures land especially hard on that category.";
    },

    draw: function (p, manager, ai, progress) {
      if (!this._controlsSetup) this.setupControls(p);

      p.background(250);

      if (!this.years.length) {
        p.fill(0);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(14);
        p.text(this.statusMessage || "Loading import data…", 20, 20);
        return;
      }

      const marginLeft = 80;
      const marginRight = 220; // a bit more room for legend
      const headerTop = 26;
      const headerGap = 64;
      const marginTop = headerTop + headerGap;
      const marginBottom = 70;
      const chartWidth = p.width - marginLeft - marginRight;
      const chartHeight = p.height - marginTop - marginBottom;

      // ----- Title + subtitle -----
      p.noStroke();
      p.fill(25);
      p.textAlign(p.LEFT, p.TOP);

      p.textSize(18);
      p.text("How Tariffs Affect Consumers", marginLeft, headerTop);

      // ----- Chart frame -----
      p.noFill();
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(marginLeft, marginTop, chartWidth, chartHeight);

      const xMin = this.years[0];
      const xMax = this.years[this.years.length - 1];

      // ----- Tariff bands -----
      // lighter tariff shading so it does not overpower the lines
      for (const ty of this.tariffYears) {
        p.fill(255, 235, 235, 70);
        p.stroke(0);
        const tx1 = p.map(ty - 0.5, xMin, xMax, marginLeft, marginLeft + chartWidth);
        const tx2 = p.map(ty + 0.5, xMin, xMax, marginLeft, marginLeft + chartWidth);
        p.rect(tx1, marginTop, tx2 - tx1, chartHeight);
        p.noStroke();
        p.fill(120);
        p.textSize(9);
        p.textAlign(p.CENTER, p.BOTTOM);
        const midX = (tx1 + tx2) / 2;
        p.text("Tariff hike", midX, marginTop - 4);
      }

      // ----- Grid + Y labels -----
      p.textSize(11);
      p.textAlign(p.RIGHT, p.CENTER);
      const yTicks = [0.0, 0.25, 0.5, 0.75, 1.0];
      for (let i = 0; i < yTicks.length; i++) {
        const val = yTicks[i];
        const yPos = p.map(val, 0, 1, marginTop + chartHeight, marginTop);
        p.stroke(230);
        p.line(marginLeft, yPos, marginLeft + chartWidth, yPos);
        p.noStroke();
        p.fill(80);
        p.text(val.toFixed(2), marginLeft - 8, yPos);
      }

      // ----- X axis ticks + labels -----
      p.stroke(210);
      p.fill(80);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(11);
      const tickStep = Math.max(1, Math.floor(this.years.length / 7));
      for (let xi = 0; xi < this.years.length; xi += tickStep) {
        const year = this.years[xi];
        const xTick = p.map(year, xMin, xMax, marginLeft, marginLeft + chartWidth);
        p.line(xTick, marginTop + chartHeight, xTick, marginTop + chartHeight + 4);
        p.noStroke();
        p.text(year, xTick, marginTop + chartHeight + 6);
        p.stroke(210);
      }

      // ----- Axis labels -----
      p.noStroke();
      p.fill(0);
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Year", marginLeft + chartWidth / 2, marginTop + chartHeight + 36);

      p.push();
      p.translate(38, marginTop + chartHeight / 2);
      p.rotate(-p.HALF_PI);
      p.text("US import exposure (normalized 0–1)", 0, 0);
      p.pop();
      p.textAlign(p.LEFT, p.BASELINE);

      // ----- Color palette -----
      const colors = {
        electronics: p.color(33, 114, 179), // tech blue
        vehicles: p.color(220, 70, 70),     // red for autos
        metals: p.color(120, 120, 120),
        textiles: p.color(178, 60, 160),
        food_agriculture: p.color(93, 180, 72),
        chemicals: p.color(245, 152, 60),   // amber
        mineral_fuels: p.color(60, 90, 130),
        manufactures: p.color(40, 160, 120)
      };

      // ----- Lines + end labels with halos -----
      for (const g of this.groups) {
        const baseColor = colors[g] || p.color(0);
        const isFocus = (g === "electronics" || g === "chemicals");
        const mutedColor = p.lerpColor(baseColor, p.color(200, 200, 200), 0.45);
        const lineColor = isFocus ? baseColor : mutedColor;

        p.noFill();
        p.stroke(lineColor);
        p.strokeWeight(isFocus ? 2.4 : 1.6);
        p.beginShape();
        let lastX = null;
        let lastY = null;
        for (const year of this.years) {
          let val = this.usaData[g][year] || 0;
          // Tiny bump for very small non-zero values so lines like Mineral Fuels are still visible
          let renderVal = val;
          const tinyBump = 0.005;
          if (renderVal > 0 && renderVal < tinyBump) {
            renderVal += tinyBump;
          }

          const xPos = p.map(year, xMin, xMax, marginLeft, marginLeft + chartWidth);
          const yPos = p.map(renderVal, 0, 1, marginTop + chartHeight, marginTop);
          p.vertex(xPos, yPos);
          lastX = xPos;
          lastY = yPos;
        }
        p.endShape();

        if (lastX !== null && lastY !== null) {
          // endpoint dot for every series
          p.noStroke();
          p.fill(lineColor);
          p.circle(lastX, lastY, isFocus ? 4 : 3);

          if (isFocus) {
            // halo label for focus categories (Electronics, Chemicals)
            const label = this.prettyName(g);
            const textW = p.textWidth(label);
            const textH = p.textAscent() + p.textDescent();

            let labelX = lastX + 8;
            const maxLabelX = marginLeft + chartWidth - textW - 6;
            if (labelX > maxLabelX) labelX = maxLabelX;

            const labelY = lastY;

            p.noStroke();
            // p.stroke(0);
            p.fill(255, 255, 255, 230);
            p.rect(labelX - 4, labelY - textH / 2 - 2, textW + 8, textH + 4, 3);

            p.fill(40);
            p.text(label, labelX, labelY + 1);
          } else if (g === "mineral_fuels" || g === "manufactures") {
            // subtle label for near-zero or secondary categories so they stay readable
            const label = this.prettyName(g);
            p.fill(40);
            p.textSize(9);
            let labelX = lastX + 6;
            const textW = p.textWidth(label);
            const maxLabelX = marginLeft + chartWidth - textW - 6;
            if (labelX > maxLabelX) labelX = maxLabelX;

            let labelY = lastY - 8;
            if (labelY < marginTop + 10) labelY = marginTop + 10;

            p.text(label, labelX, labelY);
          }
        }
      }

      // ----- Legends -----
      drawCategoryLegend(
        p,
        colors,
        this.groups,
        this.prettyName.bind(this),
        marginLeft + chartWidth + 12,
        marginTop
      );
      drawTariffLegend(
        p,
        marginLeft + chartWidth + 12,
        marginTop + 170
      );

      // Footer: data source + method
      p.noStroke();
      p.fill(40);
      p.textSize(10);
      p.textAlign(p.LEFT, p.BOTTOM);
      // Removed footer text here

      function drawCategoryLegend(p, colors, groups, prettyNameFn, x, y) {
        const padding = 10;
        const swatch = 14;
        const gap = 6;
        p.textSize(11);
        const title = "Import categories";
        const titleH = p.textAscent() + p.textDescent();
        const lineH = 18;
        const boxH = padding + titleH + 4 + groups.length * lineH + padding;
        const boxW = 190;

        p.fill(248);
        p.stroke(0);
        p.rect(x, y, boxW, boxH, 6);

        p.noStroke();
        p.fill(0);
        p.textAlign(p.LEFT, p.TOP);
        p.text(title, x + padding, y + padding);

        let cy = y + padding + titleH + 4;
        for (const g of groups) {
          p.fill(colors[g] || p.color(0));
          p.rect(x + padding, cy + 4, swatch, 8);
          p.fill(40);
          p.text(prettyNameFn(g), x + padding + swatch + gap, cy + 2);
          cy += lineH;
        }
      }

      function drawTariffLegend(p, x, y) {
        const padding = 10;
        const boxW = 190;
        const boxH = 44;

        p.fill(248);
        p.stroke(0);
        p.rect(x, y, boxW, boxH, 6);

        p.noStroke();
        p.fill(0);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(11);
        p.text("Tariff signal", x + padding, y + 4);

        p.fill(255, 235, 235);
        p.rect(x + padding, y + 20, 28, 10);
        p.fill(40);
        p.textSize(10);
        p.text("Years with average tariff increase", x + padding + 36, y + 18, boxW - padding - 36, 24);
      }
    }
  };
})();