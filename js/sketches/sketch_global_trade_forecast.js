// sketch_global_trade_forecast.js
// Story: "Where Are We Headed? Global Trade Over Time"

(function () {
  window.sketch_global_trade_forecast = {
    _controlsSetup: false,
    table: null,
    years: [],
    values: [],
    forecastYears: [],
    forecastValues: [],
    growthSummary: "",

    initData: function (p) {
      // preload CSV
      this.table = p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        () => {
          this.processGlobalTrade();
          this.computeForecast();
          this.computeSummary();
        }
      );
    },

    processGlobalTrade: function () {
      if (!this.table) return;
      const seen = {};
      for (let r = 0; r < this.table.getRowCount(); r++) {
        const year = parseInt(this.table.getString(r, "year"), 10);
        const tradeVal = this.table.getNum(r, "global_total_trade");
        if (!year || isNaN(tradeVal)) continue;
        if (seen[year]) continue;
        seen[year] = tradeVal;
      }

      const sortedYears = Object.keys(seen)
        .map(y => parseInt(y, 10))
        .sort((a, b) => a - b);

      this.years = [];
      this.values = [];
      for (let y of sortedYears) {
        this.years.push(y);
        this.values.push(seen[y] / 1e12); // trillions USD
      }
    },

    computeForecast: function () {
      const n = this.years.length;
      if (n < 2) return;

      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        const x = this.years[i];
        const y = this.values[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      }

      const denom = n * sumXX - sumX * sumX;
      if (denom === 0) return;

      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;

      const lastYear = this.years[this.years.length - 1];
      const endYear = 2030;

      this.forecastYears = [];
      this.forecastValues = [];
      for (let y = lastYear + 1; y <= endYear; y++) {
        this.forecastYears.push(y);
        this.forecastValues.push(slope * y + intercept);
      }
    },

    computeSummary: function () {
      if (!this.years.length || !this.values.length) {
        this.growthSummary = "";
        return;
      }
      const startVal = this.values[0];
      const endVal = this.values[this.values.length - 1];
      if (startVal <= 0) {
        this.growthSummary = "";
        return;
      }
      const pct = ((endVal - startVal) / startVal) * 100;
      this.growthSummary = `From ${this.years[0]} to ${this.years[this.years.length - 1]}, total global trade grew about ${pct.toFixed(0)}%.`;
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      // placeholder for interactive controls if needed
      this._controlsSetup = true;
    },

    draw: function (p) {
      if (!this._controlsSetup) this.setupControls(p);

      // Responsive canvas
      const w = Math.min(1200, Math.max(900, window.innerWidth - 60));
      const h = Math.min(900, Math.max(650, window.innerHeight - 80));
      if (!p.canvas) {
        const c = p.createCanvas(w, h);
        const mount = document.getElementById("forecast-canvas");
        if (mount) c.parent("forecast-canvas");
      }

      p.background(250);

      const marginLeft = 80;
      const marginRight = 40;
      const headerTop = 30;
      const headerGap = 80;
      const marginTop = headerTop + headerGap;
      const marginBottom = 80;
      const chartWidth = p.width - marginLeft - marginRight;
      const chartHeight = p.height - marginTop - marginBottom;

      // Header
      p.noStroke();
      p.fill(20);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(20);
      p.text("Global Trade Over Time", marginLeft, headerTop);

      p.textSize(12);
      p.fill(60);
      const subtitle = "Solid line shows observed trade (imports + exports) in trillions of USD; the dashed line extends a simple linear forecast.";
      p.text(subtitle, marginLeft, headerTop + 26, chartWidth, 40);

      if (this.growthSummary) {
        p.text(this.growthSummary, marginLeft, headerTop + 50, chartWidth, 40);
      }

      if (!this.years.length) {
        p.fill(0);
        p.textSize(16);
        p.text("No global trade data found.", marginLeft, marginTop + 40);
        return;
      }

      const allYears = this.years.concat(this.forecastYears);
      const minYear = Math.min(...allYears);
      const maxYear = Math.max(...allYears);
      const allVals = this.values.concat(this.forecastValues);
      const minVal = 0;
      const maxVal = Math.max(...allVals) * 1.15;

      // Forecast shading
      if (this.forecastYears.length) {
        const fxStart = p.map(this.years[this.years.length - 1] + 0.01, minYear, maxYear, marginLeft, marginLeft + chartWidth);
        const fxEnd = marginLeft + chartWidth;
        p.noStroke();
        p.fill(235, 241, 255);
        p.rect(fxStart, marginTop, fxEnd - fxStart, chartHeight);
      }

      // Chart frame
      p.noFill();
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(marginLeft, marginTop, chartWidth, chartHeight);

      // Y grid + labels
      p.textSize(11);
      for (let t = 0; t <= 5; t++) {
        const val = p.map(t, 0, 5, minVal, maxVal);
        const yPos = p.map(val, minVal, maxVal, marginTop + chartHeight, marginTop);
        p.stroke(230);
        p.line(marginLeft, yPos, marginLeft + chartWidth, yPos);
        p.noStroke();
        p.fill(70);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(val.toFixed(1), marginLeft - 8, yPos);
      }

      // X ticks
      p.stroke(210);
      p.fill(70);
      p.textAlign(p.CENTER, p.TOP);
      for (let xi = 0; xi < this.years.length; xi++) {
        const yVal = this.years[xi];
        const xTick = p.map(yVal, minYear, maxYear, marginLeft, marginLeft + chartWidth);
        p.line(xTick, marginTop + chartHeight, xTick, marginTop + chartHeight + 4);
        if (xi % 2 === 0) {
          p.noStroke();
          p.text(yVal, xTick, marginTop + chartHeight + 6);
          p.stroke(210);
        }
      }

      // Axis labels
      p.noStroke();
      p.fill(0);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Year", marginLeft + chartWidth / 2, p.height - marginBottom + 32);

      p.push();
      p.translate(35, marginTop + chartHeight / 2);
      p.rotate(-p.HALF_PI);
      p.text("Total global trade (trillions of USD)", 0, 0);
      p.pop();
      p.textAlign(p.LEFT, p.BASELINE);

      // Observed line
      p.stroke(33, 114, 179);
      p.strokeWeight(3);
      p.noFill();
      p.beginShape();
      for (let i = 0; i < this.years.length; i++) {
        const xPos = p.map(this.years[i], minYear, maxYear, marginLeft, marginLeft + chartWidth);
        const yPos = p.map(this.values[i], minVal, maxVal, marginTop + chartHeight, marginTop);
        p.vertex(xPos, yPos);
      }
      p.endShape();

      // Forecast line
      if (this.forecastYears.length) {
        p.strokeWeight(2);
        p.drawingContext.setLineDash([6, 5]);
        p.noFill();
        p.beginShape();
        for (let i = 0; i < this.forecastYears.length; i++) {
          const fx = p.map(this.forecastYears[i], minYear, maxYear, marginLeft, marginLeft + chartWidth);
          const fy = p.map(this.forecastValues[i], minVal, maxVal, marginTop + chartHeight, marginTop);
          p.vertex(fx, fy);
        }
        p.endShape();
        p.drawingContext.setLineDash([]);
      }
    }
  };
})();

