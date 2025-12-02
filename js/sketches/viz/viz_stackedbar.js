// viz_stackedbar.js
// Stacked bar: top 10 importers by sector (static sample data)
(function () {
  const tradeData = [
    { country: "Argentina", year: 2023, sector: "Agricultural products", value: 18500 },
    { country: "Argentina", year: 2023, sector: "Manufactures", value: 12100 },
    { country: "Brazil", year: 2023, sector: "Agricultural products", value: 45000 },
    { country: "Brazil", year: 2023, sector: "Fuels and mining products", value: 32000 },
    { country: "Canada", year: 2023, sector: "Fuels and mining products", value: 65200 },
    { country: "Canada", year: 2023, sector: "Machinery and transport equipment", value: 41800 },
    { country: "China", year: 2023, sector: "Manufactures", value: 189000 },
    { country: "China", year: 2023, sector: "Textiles", value: 55000 },
    { country: "Egypt", year: 2023, sector: "Fuels and mining products", value: 9100 },
    { country: "Egypt", year: 2023, sector: "Food", value: 7800 },
    { country: "France", year: 2023, sector: "Machinery and transport equipment", value: 88400 },
    { country: "France", year: 2023, sector: "Manufactures", value: 61500 },
    { country: "Germany", year: 2023, sector: "Machinery and transport equipment", value: 115000 },
    { country: "Germany", year: 2023, sector: "Automotive products", value: 95000 },
    { country: "India", year: 2023, sector: "Manufactures", value: 72300 },
    { country: "India", year: 2023, sector: "Textiles", value: 38900 },
    { country: "Japan", year: 2023, sector: "Automotive products", value: 102100 },
    { country: "Japan", year: 2023, sector: "Machinery and transport equipment", value: 75000 },
    { country: "Mexico", year: 2023, sector: "Automotive products", value: 44200 },
    { country: "Mexico", year: 2023, sector: "Manufactures", value: 31600 },
    { country: "Nigeria", year: 2023, sector: "Fuels and mining products", value: 19700 },
    { country: "Nigeria", year: 2023, sector: "Agricultural products", value: 6400 }
  ];

  window.sketch_stackedbar = {
    _controlsSetup: false,
    sectors: [],
    top10Data: [],
    selectedYear: 2023,
    dropdown: null,
    colors: [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
      "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52B788"
    ],

    computeTop10: function () {
      const countryTotals = {};
      const sectorSet = new Set();

      for (const row of tradeData) {
        if (row.year !== this.selectedYear) continue;
        const { country, sector, value } = row;
        sectorSet.add(sector);
        if (!countryTotals[country]) {
          countryTotals[country] = { country, total: 0 };
        }
        if (!countryTotals[country][sector]) countryTotals[country][sector] = 0;
        countryTotals[country][sector] += value;
        countryTotals[country].total += value;
      }

      this.sectors = Array.from(sectorSet);

      const sorted = Object.values(countryTotals).sort((a, b) => b.total - a.total);
      this.top10Data = sorted.slice(0, 10);
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      this._controlsSetup = true;
      p.textFont("sans-serif");

      this.computeTop10();

      const container = document.getElementById("vis");
      if (container && !this.dropdown) {
        this.dropdown = p.createSelect();
        this.dropdown.parent(container);
        this.dropdown.style("width", "180px");
        this.dropdown.option("2023");
        this.dropdown.changed(() => {
          this.selectedYear = parseInt(this.dropdown.value(), 10);
          this.computeTop10();
        });
      }
    },

    draw: function (p) {
      if (!this._controlsSetup) this.setupControls(p);

      p.background(255);
      p.fill(0);
      p.textSize(18);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Top 10 importers by sector (sample data, 2023)", p.width / 2, 16);

      if (!this.top10Data.length) {
        p.textAlign(p.LEFT, p.TOP);
        p.text("No data available.", 20, 40);
        return;
      }

      const margin = { left: 120, right: 80, top: 70, bottom: 90 };
      const chartW = p.width - margin.left - margin.right;
      const chartH = p.height - margin.top - margin.bottom;
      const barSlot = chartW / this.top10Data.length;
      const barWidth = barSlot * 0.55;

      const maxVal = this.top10Data.reduce((m, d) => {
        const sum = this.sectors.reduce((s, sec) => s + (d[sec] || 0), 0);
        return Math.max(m, sum);
      }, 1);

      p.textSize(11);
      p.textAlign(p.RIGHT, p.CENTER);
      p.stroke(230);
      for (let i = 0; i <= 4; i++) {
        const val = (maxVal / 4) * i;
        const y = p.map(val, 0, maxVal, margin.top + chartH, margin.top);
        p.line(margin.left, y, margin.left + chartW, y);
        p.noStroke();
        p.fill(90);
        p.text(val.toFixed(0), margin.left - 8, y);
        p.stroke(230);
      }
      p.noStroke();

      p.textAlign(p.CENTER, p.TOP);
      for (let i = 0; i < this.top10Data.length; i++) {
        const d = this.top10Data[i];
        const x = margin.left + i * barSlot + (barSlot - barWidth) / 2;
        let yBottom = margin.top + chartH;

        for (let j = 0; j < this.sectors.length; j++) {
          const sector = this.sectors[j];
          const val = d[sector] || 0;
          const h = p.map(val, 0, maxVal, 0, chartH);
          p.fill(this.colors[j % this.colors.length]);
          p.rect(x, yBottom - h, barWidth, h);
          yBottom -= h;
        }

        p.fill(0);
        p.text(d.country, x + barWidth / 2, margin.top + chartH + 10);
      }

      // Legend
      const lx = margin.left + chartW + 16;
      let ly = margin.top;
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(11);
      for (let i = 0; i < this.sectors.length; i++) {
        p.fill(this.colors[i % this.colors.length]);
        p.rect(lx, ly - 6, 14, 14);
        p.fill(30);
        p.text(this.sectors[i], lx + 20, ly + 1);
        ly += 20;
      }
    }
  };
})();
