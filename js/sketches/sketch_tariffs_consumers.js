// sketch_tariffs_consumers.js
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
      "electronics", "chemicals", "mineral_fuels", "manufactures",
      "vehicles", "metals", "textiles", "food_agriculture"
    ],

    preload: function(p) {
      if (!this.table) {
        this.table = p.loadTable("data/datasets/Improved_Dataset/trade_master_full.csv", "csv", "header");
      }
    },

    setupControls: function(p) {
      if (this._controlsSetup) return;
      // Could add year toggle buttons here if needed
      this._controlsSetup = true;
      p.textFont("sans-serif");
      this.processData();
      this.computeStoryHighlight();
    },

    processData: function() {
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
        const iso = (this.table.getString(r, "country_iso") || "").trim().toUpperCase();
        if (iso !== "USA") continue;
        foundUSA = true;

        const year = parseInt(this.table.getString(r, "year"), 10);
        const group = (this.table.getString(r, "commodity_group") || "").trim().toLowerCase();
        const imp = parseFloat(this.table.getString(r, "import_value"));
        const tariffChange = parseFloat(this.table.getString(r, "tariff_change_value"));
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
      if (!foundUSA) this.statusMessage = "No United States trade rows found in this dataset.";

      this.tariffYears = [];
      for (const y of this.years) {
        const arr = tariffByYear[y] || [];
        if (arr.length === 0) continue;
        const avgChange = arr.reduce((a,b)=>a+b,0)/arr.length;
        if (avgChange > 0) this.tariffYears.push(y);
      }

      this.normalizeGroupValues();
    },

    normalizeGroupValues: function() {
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

    prettyName: function(g) {
      return g.split("_").map(w=>w[0].toUpperCase()+w.slice(1)).join(" ");
    },

    computeStoryHighlight: function() {
      if (!this.years.length || !this.groups.length) {
        this.storyHighlight = "";
        return;
      }
      const startYear = this.years[0];
      const endYear = this.years[this.years.length-1];

      let bestGroup = null, bestChange = -Infinity;
      for (const g of this.groups) {
        const s = (this.usaData[g][startYear]||0);
        const e = (this.usaData[g][endYear]||0);
        const diff = e - s;
        if (diff > bestChange) { bestChange = diff; bestGroup = g; }
      }

      if (!bestGroup || bestChange <= 0) {
        this.storyHighlight = "Consumer-facing imports have shifted over time, but not all categories respond the same way to tariffs.";
        return;
      }
      this.storyHighlight = `${this.prettyName(bestGroup)} shows the largest increase in relative import exposure from ${startYear} to ${endYear}, suggesting tariffs and demand pressures fall especially hard on that category.`;
    },

    draw: function(p, manager, ai, progress) {
      if (!this.years.length) {
        p.background(250);
        p.fill(0); p.textSize(16); p.textAlign(p.LEFT, p.TOP);
        p.text(this.statusMessage || "Loading data...", 20,20);
        return;
      }

      const marginLeft = 80, marginRight = 210, marginTop = 70, marginBottom = 60;
      const chartWidth = p.width - marginLeft - marginRight;
      const chartHeight = p.height - marginTop - marginBottom;

      p.background(250);
      if (this.storyHighlight) {
        p.fill(40); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
        p.text(this.storyHighlight, marginLeft, marginTop - 28, chartWidth-40, 48);
      }

      p.noFill(); p.stroke(0); p.strokeWeight(1);
      p.rect(marginLeft, marginTop, chartWidth, chartHeight);

      const xMin = this.years[0], xMax = this.years[this.years.length-1];

      // Tariff bands
      p.noStroke(); p.fill(255,235,235,180);
      for (const ty of this.tariffYears) {
        const tx1 = p.map(ty-0.5, xMin, xMax, marginLeft, marginLeft+chartWidth);
        const tx2 = p.map(ty+0.5, xMin, xMax, marginLeft, marginLeft+chartWidth);
        p.rect(tx1, marginTop, tx2-tx1, chartHeight);
      }

      // Grid lines and Y labels
      p.textSize(11); p.textAlign(p.RIGHT, p.CENTER);
      for (let t=0;t<=4;t++){
        const norm = t/4;
        const yPos = p.map(norm,0,1,marginTop+chartHeight,marginTop);
        p.stroke(230); p.line(marginLeft,yPos,marginLeft+chartWidth,yPos);
        p.noStroke(); p.fill(70);
        p.text(norm.toFixed(2), marginLeft-8, yPos);
      }

      // X axis
      p.stroke(210); p.fill(70); p.textSize(11); p.textAlign(p.CENTER, p.TOP);
      const tickStep = Math.max(1, Math.floor(this.years.length/8));
      for (let xi=0;xi<this.years.length;xi+=tickStep){
        const year = this.years[xi];
        const xTick = p.map(year, xMin, xMax, marginLeft, marginLeft+chartWidth);
        p.line(xTick, marginTop+chartHeight, xTick, marginTop+chartHeight+4);
        p.noStroke(); p.text(year, xTick, marginTop+chartHeight+6);
        p.stroke(210);
      }

      // Axis labels
      p.noStroke(); p.fill(0); p.textSize(12); p.textAlign(p.CENTER, p.CENTER);
      p.text("Year", marginLeft+chartWidth/2, p.height-marginBottom+35);
      p.push(); p.translate(40, marginTop+chartHeight/2); p.rotate(-p.HALF_PI);
      p.text("Relative import exposure (normalized 0–1)", 0,0); p.pop();

      // Colors
      const colors = {
        electronics: p.color(33,114,179),
        vehicles: p.color(245,122,0),
        metals: p.color(120,120,120),
        textiles: p.color(178,60,160),
        food_agriculture: p.color(93,180,72),
        chemicals: p.color(200,90,30),
        mineral_fuels: p.color(80,130,200),
        manufactures: p.color(40,160,120)
      };

      // Draw lines
      p.strokeWeight(2.2); p.noFill();
      for (const g of this.groups) {
        p.stroke(colors[g] || p.color(0));
        p.beginShape();
        for (const y of this.years){
          const val = this.usaData[g][y] || 0;
          const xPos = p.map(y,xMin,xMax,marginLeft,marginLeft+chartWidth);
          const yPos = p.map(val,0,1,marginTop+chartHeight,marginTop);
          p.vertex(xPos,yPos);
        }
        p.endShape();
      }

      // Legends
      drawLegend(p, colors, marginLeft+chartWidth+10, marginTop, this.groups, this.prettyName.bind(this));
      drawTariffLegend(p, marginLeft+chartWidth+10, marginTop+160);

      // Footer
      p.noStroke(); p.fill(40); p.textSize(11); p.textAlign(p.LEFT,p.BOTTOM);
      p.text("US imports only; values normalized for comparison across categories.", marginLeft, p.height-10);

      function drawLegend(p, colors, x, y, groups, prettyNameFn){
        p.noStroke(); p.fill(248); p.textSize(12);
        const title = "Categories (relative import exposure)";
        const swatchW = 16, swatchGap=8, boxPadding=12;
        const titleHeight = p.textAscent()+p.textDescent(); const lineHeight=Math.max(18,titleHeight+4);
        const boxHeight=boxPadding+titleHeight+6+lineHeight*groups.length+boxPadding; const boxWidth=160;

        p.fill(248); p.stroke(200); p.rect(x,y,boxWidth,boxHeight,6); p.noStroke();
        p.fill(0); p.textAlign(p.LEFT,p.TOP); p.text(title,x+boxPadding,y+boxPadding);
        for (let i=0;i<groups.length;i++){
          const g=groups[i]; const cy=y+boxPadding+titleHeight+6+i*lineHeight;
          p.fill(colors[g]||p.color(0)); p.rect(x+boxPadding,cy,swatchW,Math.max(8,Math.round(swatchW*0.6)));
          p.fill(40); p.text(prettyNameFn(g),x+boxPadding+swatchW+swatchGap,cy-2);
        }
      }

      function drawTariffLegend(p, x, y){
        p.textAlign(p.LEFT,p.TOP); p.textSize(12); p.noStroke(); p.fill(0);
        const title="Tariff signal", label="Years with average tariff increase";
        const boxPadding=10, boxW=140, boxH=40;
        p.fill(248); p.stroke(200); p.rect(x,y,boxW,boxH,6); p.noStroke();
        p.fill(0); p.text(title,x+boxPadding,y); p.fill(255,235,235); p.rect(x+boxPadding,y+8,24,10);
        p.fill(40); p.text(label,x+boxPadding+32,y+7);
      }
    }
  };
})();

