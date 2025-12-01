// sketch_global_trade_forecast.js - IMPROVED VERSION
// Trade forecast with editorial scatter plot styling
(function () {
  window.sketch_global_trade_forecast = {
    _controlsSetup: false,
    table: null,
    years: [],
    tradeVals: [],
    tariffShareByYear: {},
    periodLabels: [],
    periodTradeChange: [],
    periodTariffTension: [],
    statusMessage: "Loading global trade data…",

    periodBins: [
      { label: "2015–2017", start: 2015, end: 2017 },
      { label: "2018–2020", start: 2018, end: 2020 },
      { label: "2021–2024", start: 2021, end: 2024 }
    ],

    initData: function (p) {
      if (this.table) return;
      this.statusMessage = "Loading global trade data…";

      this.table = p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        () => {
          this.processData();
          this.statusMessage = "";
        }
      );
    },

    processData: function () {
      if (!this.table || typeof this.table.getRowCount !== "function") {
        this.statusMessage = "Failed to load global trade data.";
        this.years = [];
        return;
      }

      const yearTrade = {};
      const tariffCounts = {};
      const tariffPosCounts = {};

      for (let r = 0; r < this.table.getRowCount(); r++) {
        const year = parseInt(this.table.getString(r, "year"), 10);
        if (!year) continue;

        const gTrade = parseFloat(this.table.getString(r, "global_total_trade"));
        if (!isNaN(gTrade) && !yearTrade[year]) {
          yearTrade[year] = gTrade;
        }

        const tStr = this.table.getString(r, "tariff_change_value");
        const tVal = parseFloat(tStr);
        if (!isNaN(tVal)) {
          if (!tariffCounts[year]) {
            tariffCounts[year] = 0;
            tariffPosCounts[year] = 0;
          }
          tariffCounts[year] += 1;
          if (tVal > 0) {
            tariffPosCounts[year] += 1;
          }
        }
      }

      const sortedYears = Object.keys(yearTrade)
        .map(y => parseInt(y, 10))
        .sort((a, b) => a - b);

      this.years = [];
      this.tradeVals = [];
      this.tariffShareByYear = {};

      for (let y of sortedYears) {
        this.years.push(y);
        this.tradeVals.push(yearTrade[y] / 1e12);

        const total = tariffCounts[y] || 0;
        const pos = tariffPosCounts[y] || 0;
        let share = 0;
        if (total > 0) share = pos / total;
        this.tariffShareByYear[y] = share;
      }

      if (!this.years.length) {
        this.statusMessage = "No global trade rows found in this dataset.";
        return;
      }

      const yearlyChange = {};
      for (let i = 1; i < this.years.length; i++) {
        const yPrev = this.years[i - 1];
        const yCur = this.years[i];
        const prev = this.tradeVals[i - 1];
        const cur = this.tradeVals[i];
        if (prev > 0) {
          yearlyChange[yCur] = ((cur - prev) / prev) * 100;
        }
      }

      this.periodLabels = [];
      this.periodTradeChange = [];
      this.periodTariffTension = [];

      for (const bin of this.periodBins) {
        const { label, start, end } = bin;

        const changes = [];
        for (let y = start + 1; y <= end; y++) {
          if (yearlyChange.hasOwnProperty(y)) {
            changes.push(yearlyChange[y]);
          }
        }
        let avgChange = null;
        if (changes.length > 0) {
          avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        }

        let posSum = 0;
        let totalSum = 0;
        for (let y = start; y <= end; y++) {
          const total = tariffCounts[y] || 0;
          const pos = tariffPosCounts[y] || 0;
          posSum += pos;
          totalSum += total;
        }
        let tension = 0;
        if (totalSum > 0) tension = posSum / totalSum;

        this.periodLabels.push(label);
        this.periodTradeChange.push(avgChange);
        this.periodTariffTension.push(tension);
      }
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      this._controlsSetup = true;
      p.textFont("Inter");
      this.initData(p);
    },

    draw: function (p) {
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

      if (!this.periodLabels.length) {
        p.fill(102, 102, 102);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Inter');
        p.textSize(16);
        p.text(this.statusMessage || "Loading global trade data…", p.width/2, p.height/2);
        return;
      }

      const n = this.periodLabels.length;
      const labels = this.periodLabels;
      const tradeChange = this.periodTradeChange;
      const tariffIndex = this.periodTariffTension;

      const marginLeft = 100;
      const marginRight = 240;
      const marginTop = 130;
      const marginBottom = 90;
      const chartWidth = p.width - marginLeft - marginRight;
      const chartHeight = p.height - marginTop - marginBottom;

      // Title
      p.textFont('Spectral');
      p.textSize(32);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      p.fill(26, 26, 26);
      p.text("Trade Volatility & Tariff Tension", marginLeft, 30);

      // Subtitle
      p.textFont('Inter');
      p.textSize(16);
      p.textStyle(p.NORMAL);
      p.fill(102, 102, 102);
      p.text("Period-by-Period Analysis", marginLeft, 70);

      // Description
      p.textSize(13);
      p.fill(153, 153, 153);
      p.text("Each point represents a 3-4 year period", marginLeft, 95);

      // Compute axis ranges
      let xMin = Infinity, xMax = -Infinity;
      let yMin = Infinity, yMax = -Infinity;

      for (let i = 0; i < n; i++) {
        const x = tariffIndex[i];
        const y = tradeChange[i];
        if (x == null || isNaN(x) || y == null || isNaN(y)) continue;
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }

      if (!isFinite(xMin) || !isFinite(xMax)) {
        xMin = 0; xMax = 1;
      }

      xMin = 0.00;
      xMax = 0.12;

      if (!isFinite(yMin) || !isFinite(yMax)) {
        yMin = -5; yMax = 15;
      }

      const yPad = (yMax - yMin) * 0.15 || 1.0;
      yMin -= yPad;
      yMax += yPad;

      // Chart frame
      p.noFill();
      p.stroke(229, 229, 229);
      p.strokeWeight(2);
      p.rect(marginLeft, marginTop, chartWidth, chartHeight);

      // Grid & labels
      p.textFont('Inter');
      p.textSize(11);
      p.fill(102, 102, 102);

      // Y grid
      p.textAlign(p.RIGHT, p.CENTER);
      const yTicks = 5;
      for (let t = 0; t <= yTicks; t++) {
        const v = p.map(t, 0, yTicks, yMin, yMax);
        const yPos = p.map(v, yMin, yMax, marginTop + chartHeight, marginTop);
        p.stroke(245, 245, 245);
        p.strokeWeight(1);
        p.line(marginLeft, yPos, marginLeft + chartWidth, yPos);
        p.noStroke();
        p.text(v.toFixed(1) + "%", marginLeft - 10, yPos);
      }

      // X grid
      p.textAlign(p.CENTER, p.TOP);
      const xTicks = 4;
      const axisY = marginTop + chartHeight;
      for (let t = 0; t <= xTicks; t++) {
        const frac = p.map(t, 0, xTicks, xMin, xMax);
        const xPos = p.map(frac, xMin, xMax, marginLeft, marginLeft + chartWidth);
        p.stroke(245, 245, 245);
        p.line(xPos, marginTop, xPos, marginTop + chartHeight);
        p.noStroke();
        p.text((frac * 100).toFixed(0) + "%", xPos, axisY + 8);
      }

      // Axis labels
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.fill(217, 119, 6);
      p.textStyle(p.BOLD);
      p.text("Tariff Tension →", marginLeft + chartWidth / 2, p.height - marginBottom + 45);

      p.push();
      p.translate(45, marginTop + chartHeight / 2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.CENTER);
      p.fill(37, 99, 168);
      p.text("← Trade Volatility", 0, 0);
      p.pop();

      // Scatter points with labels
      p.textAlign(p.LEFT, p.CENTER);
      p.textFont('Inter');
      p.textSize(12);
      p.textStyle(p.NORMAL);

      for (let i = 0; i < n; i++) {
        const xVal = tariffIndex[i];
        const yVal = tradeChange[i];
        if (xVal == null || isNaN(xVal) || yVal == null || isNaN(yVal)) continue;

        const xPos = p.map(xVal, xMin, xMax, marginLeft, marginLeft + chartWidth);
        const yPos = p.map(yVal, yMin, yMax, marginTop + chartHeight, marginTop);

        // Shadow
        p.noStroke();
        p.fill(0, 0, 0, 30);
        p.circle(xPos + 2, yPos + 2, 16);

        // Point
        p.stroke(217, 119, 6);
        p.strokeWeight(2);
        p.fill(37, 99, 168);
        p.circle(xPos, yPos, 16);

        // Label with background
        p.noStroke();
        const label = labels[i];
        const textW = p.textWidth(label);
        
        p.fill(255, 255, 255, 240);
        p.rect(xPos + 12, yPos - 10, textW + 12, 20, 4);
        
        p.fill(26, 26, 26);
        p.textStyle(p.BOLD);
        p.text(label, xPos + 18, yPos);
      }

      // Legend
      const legX = marginLeft + chartWidth + 20;
      const legY = marginTop;
      
      p.fill(255, 255, 255, 250);
      p.stroke(229, 229, 229);
      p.strokeWeight(1);
      p.rect(legX, legY, 200, 150, 6);
      
      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      p.textFont('Inter');
      p.textSize(13);
      p.textStyle(p.BOLD);
      p.fill(26, 26, 26);
      p.text("How to Read", legX + 12, legY + 12);
      
      p.textStyle(p.NORMAL);
      p.textSize(11);
      p.fill(102, 102, 102);
      
      let cy = legY + 40;
      
      // Point sample
      p.stroke(217, 119, 6);
      p.strokeWeight(2);
      p.fill(37, 99, 168);
      p.circle(legX + 20, cy, 12);
      p.noStroke();
      p.fill(26, 26, 26);
      p.text("Each period (3-4 years)", legX + 32, cy - 6);
      
      cy += 30;
      p.fill(102, 102, 102);
      p.text("→ Right: More tariff hikes", legX + 12, cy);
      cy += 20;
      p.text("↑ Up: Higher trade swings", legX + 12, cy);
      cy += 30;
      p.textSize(10);
      p.fill(153, 153, 153);
      const note = "Higher volatility often\ncorrelates with trade\ntension periods";
      p.text(note, legX + 12, cy);
    }
  };
})();
