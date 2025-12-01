// sketch_global_trade_forecast.js
// Story: "Where Are We Headed? Trade Volatility and Tariff Tension"
// Static summary using grouped time periods:
//   - Top panel: average year-to-year % change in total global trade per period
//   - Bottom panel: average tariff "tension" = share of positive tariff_change_value per period

(function () {
  window.sketch_global_trade_forecast = {
    _controlsSetup: false,
    table: null,

    years: [],
    tradeVals: [],        // trillions USD
    tradeChangePct: [],   // % change vs previous year
    tariffIndexYear: [],  // per-year tension index (0–1)

    // Grouped period data
    binDefs: [
      { label: "2015–2017", start: 2015, end: 2017 },
      { label: "2018–2020", start: 2018, end: 2020 },
      { label: "2021–2024", start: 2021, end: 2024 }
    ],
    binLabels: [],
    binTradeChange: [],   // avg % change in each period
    binTariffIndex: [],   // avg tariff tension in each period

    maxTariffIndex: 1,
    statusMessage: "Loading global trade data…",

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

      const yearTrade = {};        // year -> global_total_trade
      const tariffCounts = {};     // year -> how many rows had any tariff_change_value
      const tariffPosCounts = {};  // year -> how many rows had tariff_change_value > 0

      for (let r = 0; r < this.table.getRowCount(); r++) {
        const year = parseInt(this.table.getString(r, "year"), 10);
        if (!year) continue;

        // Global trade: keep a single aggregate row per year
        const gTrade = parseFloat(this.table.getString(r, "global_total_trade"));
        if (!isNaN(gTrade) && !yearTrade[year]) {
          yearTrade[year] = gTrade;
        }

        // Tariff changes: build a per-year "tension" index
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
      this.tradeChangePct = [];
      this.tariffIndexYear = [];

      // Fill trade values (trillions of USD)
      for (let y of sortedYears) {
        this.years.push(y);
        this.tradeVals.push(yearTrade[y] / 1e12);
      }

      const n = this.years.length;
      if (n === 0) {
        this.statusMessage = "No global trade rows found in this dataset.";
        return;
      }

      // Compute % change vs previous year
      this.tradeChangePct = new Array(n).fill(null);
      for (let i = 1; i < n; i++) {
        const prev = this.tradeVals[i - 1];
        const cur = this.tradeVals[i];
        if (prev > 0) {
          this.tradeChangePct[i] = ((cur - prev) / prev) * 100;
        }
      }

      // Per-year tariff "tension" index: share of positive changes
      this.tariffIndexYear = new Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        const y = this.years[i];
        const total = tariffCounts[y] || 0;
        const pos = tariffPosCounts[y] || 0;
        let idx = 0;
        if (total > 0) {
          idx = pos / total; // 0–1
        }
        this.tariffIndexYear[i] = idx;
      }

      // ---- Group data into periods / bins ----
      this.binLabels = [];
      this.binTradeChange = [];
      this.binTariffIndex = [];

      let maxIdx = 0;

      for (const bin of this.binDefs) {
        const label = bin.label;
        const start = bin.start;
        const end = bin.end;

        const tradeValsBin = [];
        const tariffValsBin = [];

        for (let i = 0; i < n; i++) {
          const y = this.years[i];
          if (y < start || y > end) continue;

          const chg = this.tradeChangePct[i];
          if (chg != null && !isNaN(chg)) {
            tradeValsBin.push(chg);
          }

          const tIdx = this.tariffIndexYear[i];
          if (!isNaN(tIdx)) {
            tariffValsBin.push(tIdx);
          }
        }

        // Average values per bin (if no data, fall back to 0)
        let avgChange = null;
        if (tradeValsBin.length > 0) {
          const sum = tradeValsBin.reduce((a, b) => a + b, 0);
          avgChange = sum / tradeValsBin.length;
        }

        let avgTariff = 0;
        if (tariffValsBin.length > 0) {
          const sumT = tariffValsBin.reduce((a, b) => a + b, 0);
          avgTariff = sumT / tariffValsBin.length;
        }

        this.binLabels.push(label);
        this.binTradeChange.push(avgChange);
        this.binTariffIndex.push(avgTariff);

        if (avgTariff > maxIdx) maxIdx = avgTariff;
      }

      this.maxTariffIndex = maxIdx > 0 ? maxIdx : 1;
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      this._controlsSetup = true;
      p.textFont("sans-serif");
      this.initData(p);
    },

    draw: function (p) {
      if (!this._controlsSetup) this.setupControls(p);

      p.background(250);

      if (!this.binLabels.length) {
        p.fill(0);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(14);
        p.text(this.statusMessage || "Loading global trade data…", 20, 20);
        return;
      }

      // Layout
      const marginLeft = 80;
      const marginRight = 210;
      const headerTop = 26;
      const headerGap = 40;
      const marginTop = headerTop + headerGap;
      const marginBottom = 80;
      const chartWidth = p.width - marginLeft - marginRight;
      const chartHeight = p.height - marginTop - marginBottom;

      const topPanelHeight = chartHeight * 0.55;
      const gapPanels = 18;
      const bottomPanelHeight = chartHeight - topPanelHeight - gapPanels;

      const topY = marginTop;
      const bottomY = marginTop + topPanelHeight + gapPanels;

      // ---------- Header ----------
      p.noStroke();
      p.fill(25);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(18);
      p.text("Trade Volatility and Tariff Tension", marginLeft, headerTop);

      p.textSize(11);
      p.fill(60);
      p.text(
        "Top: average year-to-year change in total global trade by period",
        marginLeft,
        headerTop + 22
      );
      p.text(
        "Bottom: average tariff tension (share of positive tariff changes) by period",
        marginLeft,
        headerTop + 36
      );

      const bins = this.binLabels;
      const tradeBins = this.binTradeChange;
      const tariffBins = this.binTariffIndex;
      const B = bins.length;

      // Guard in case something odd happens
      if (!B) return;

      // X positions are based on bin index (0..B-1)
      const step = chartWidth / B;
      const barWidth = Math.max(18, step * 0.55);

      // ---------- Top panel: trade % change (by period) ----------
      let minChange = 0;
      let maxChange = 0;
      for (let i = 0; i < B; i++) {
        const v = tradeBins[i];
        if (v == null || isNaN(v)) continue;
        if (v < minChange) minChange = v;
        if (v > maxChange) maxChange = v;
      }
      if (minChange === maxChange) {
        minChange -= 5;
        maxChange += 5;
      } else {
        const pad = (maxChange - minChange) * 0.15;
        minChange -= pad;
        maxChange += pad;
      }

      const topBaseline = p.map(
        0,
        minChange,
        maxChange,
        topY + topPanelHeight,
        topY
      );

      // Frame for top panel
      p.noFill();
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(marginLeft, topY, chartWidth, topPanelHeight);

      // Horizontal grid & labels (top panel)
      p.textSize(10);
      p.textAlign(p.RIGHT, p.CENTER);
      const topTicks = 5;
      for (let t = 0; t <= topTicks; t++) {
        const v = p.map(t, 0, topTicks, minChange, maxChange);
        const yPos = p.map(
          v,
          minChange,
          maxChange,
          topY + topPanelHeight,
          topY
        );
        p.stroke(230);
        p.line(marginLeft, yPos, marginLeft + chartWidth, yPos);
        p.noStroke();
        p.fill(80);
        p.text(v.toFixed(1), marginLeft - 8, yPos);
      }

      // Label near top-left of panel
      p.noStroke();
      p.fill(0);
      p.textSize(11);
      p.textAlign(p.LEFT, p.TOP);
      p.text("Global trade: average year-to-year change (%)", marginLeft + 4, topY + 4);

      // Bars for trade change (by period)
      p.stroke(0);
      p.strokeWeight(0.7);
      for (let i = 0; i < B; i++) {
        const pct = tradeBins[i];
        if (pct == null || isNaN(pct)) continue;

        const xCenter = marginLeft + step * (i + 0.5);
        const yZero = topBaseline;
        const yVal = p.map(
          pct,
          minChange,
          maxChange,
          topY + topPanelHeight,
          topY
        );

        const x0 = xCenter - barWidth / 2;
        const x1 = xCenter + barWidth / 2;

        if (pct >= 0) {
          p.fill(33, 114, 179); // blue for positive growth
          p.rect(x0, yVal, x1 - x0, yZero - yVal);
        } else {
          p.fill(200, 90, 90); // muted red for contraction
          p.rect(x0, yZero, x1 - x0, yVal - yZero);
        }
      }

      // Draw the 0% baseline
      p.stroke(100);
      p.strokeWeight(1);
      p.line(marginLeft, topBaseline, marginLeft + chartWidth, topBaseline);

      // ---------- Bottom panel: tariff tension (by period) ----------
      // Frame
      p.noFill();
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(marginLeft, bottomY, chartWidth, bottomPanelHeight);

      // Horizontal grid & labels for tariff index (0 to maxTariffIndex)
      const tariffMax = this.maxTariffIndex > 0 ? this.maxTariffIndex : 1;
      p.textSize(10);
      p.textAlign(p.RIGHT, p.CENTER);
      const tariffTicks = 4;
      for (let t = 0; t <= tariffTicks; t++) {
        const v = (tariffMax * t) / tariffTicks;
        const frac = v / tariffMax;
        const yPos = bottomY + bottomPanelHeight - frac * bottomPanelHeight;
        p.stroke(230);
        p.line(marginLeft, yPos, marginLeft + chartWidth, yPos);
        p.noStroke();
        p.fill(80);
        p.text(v.toFixed(2), marginLeft - 8, yPos);
      }

      // Label near top-left of bottom panel
      p.noStroke();
      p.fill(0);
      p.textSize(11);
      p.textAlign(p.LEFT, p.TOP);
      p.text(
        "Tariff tension: average share of positive tariff changes",
        marginLeft + 4,
        bottomY + 4
      );

      // Bars for tariff tension (by period)
      p.stroke(0);
      p.strokeWeight(0.7);
      for (let i = 0; i < B; i++) {
        const idx = tariffBins[i] || 0;
        const xCenter = marginLeft + step * (i + 0.5);

        const frac = idx / tariffMax;
        const h = frac * bottomPanelHeight;

        const x0 = xCenter - barWidth / 2;
        const x1 = xCenter + barWidth / 2;
        const y1 = bottomY + bottomPanelHeight;
        const y0 = y1 - h;

        p.fill(245, 122, 0); // orange for tariff tension
        p.rect(x0, y0, x1 - x0, h);
      }

      // ---------- Shared X axis (period labels) ----------
      p.stroke(210);
      p.fill(80);
      p.textAlign(p.CENTER, p.TOP);
      for (let i = 0; i < B; i++) {
        const label = bins[i];
        const xCenter = marginLeft + step * (i + 0.5);
        const axisY = bottomY + bottomPanelHeight;
        p.line(xCenter, axisY, xCenter, axisY + 4);
        p.noStroke();
        p.text(label, xCenter, axisY + 6);
        p.stroke(210);
      }

      // X axis label
      p.noStroke();
      p.fill(0);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(
        "Period",
        marginLeft + chartWidth / 2,
        p.height - marginBottom + 28
      );

      // ---------- Legend ----------
      drawLegend(
        p,
        marginLeft + chartWidth + 10,
        marginTop + 10
      );

      // ---------- Method note ----------
      p.noStroke();
      p.fill(70);
      p.textSize(10);
      p.textAlign(p.LEFT, p.TOP);
      const footer =
        "Blue bars: average year-to-year % change in total global trade within each period. " +
        "Orange bars: average share of rows with tariff_change_value > 0 within each period.";
      p.text(footer, marginLeft, bottomY + bottomPanelHeight + 26, chartWidth, 40);

      // Helper: legend on the right
      function drawLegend(p, x, y) {
        const padding = 10;
        const boxW = 200;
        const boxH = 72;
        const sw = 24;

        p.fill(248);
        p.stroke(200);
        p.rect(x, y, boxW, boxH, 6);

        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(11);
        p.fill(0);
        p.text("How to read this view", x + padding, y + 6);

        let cy = y + 24;
        // Trade volatility
        p.stroke(0);
        p.fill(33, 114, 179);
        p.rect(x + padding, cy + 4, sw, 10);
        p.noStroke();
        p.fill(50);
        p.textSize(10);
        p.text(
          "Blue bars (top): global trade volatility by period",
          x + padding + sw + 8,
          cy
        );

        // Tariff tension
        cy += 20;
        p.stroke(0);
        p.fill(245, 122, 0);
        p.rect(x + padding, cy + 4, sw, 10);
        p.noStroke();
        p.fill(50);
        p.text(
          "Orange bars (bottom): tariff tension by period",
          x + padding + sw + 8,
          cy
        );
      }
    }
  };
})();