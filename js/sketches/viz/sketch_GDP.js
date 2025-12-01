// sketch_GDP.js - IMPROVED VERSION
// GDP comparison with editorial styling
(function () {
  window.sketch_gdp = {
    _controlsSetup: false,
    table: null,
    dataMap: {},
    countries: [],
    dropdown: null,
    selectedCountry: null,
    statusMessage: "Loading GDP data…",

    initData: function (p) {
      if (this.table) return;
      this.statusMessage = "Loading GDP data…";
      this.table = p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        () => {
          this.processData();
          this.populateDropdown();
          this.statusMessage = "";
        },
        () => {
          this.statusMessage = "Failed to load GDP data.";
        }
      );
    },

    processData: function () {
      if (!this.table || typeof this.table.getRowCount !== "function") {
        this.statusMessage = "Failed to load GDP data.";
        return;
      }

      this.dataMap = {};
      this.countries = [];

      for (let r = 0; r < this.table.getRowCount(); r++) {
        const row = this.table.getRow(r);
        const country = row.getString("country_name");
        const year = row.getNum("year");
        if (year !== 2022 && year !== 2024) continue;
        if (!country) continue;

        if (!this.dataMap[country]) this.dataMap[country] = {};
        this.dataMap[country][year] = {
          gdp: row.getNum("gdp_usd"),
          tariff_prev: row.getNum("tariff_prev_year"),
          direction: row.getString("tariff_change_direction")
        };
        if (this.countries.indexOf(country) === -1) this.countries.push(country);
      }

      this.countries.sort();
      if (!this.selectedCountry && this.countries.length) {
        this.selectedCountry = this.countries[0];
      }
    },

    populateDropdown: function () {
      if (!this.dropdown) return;
      this.dropdown.elt.innerHTML = "";
      this.dropdown.option("— Select a Country —");
      for (const c of this.countries) this.dropdown.option(c);
      if (this.selectedCountry) this.dropdown.value(this.selectedCountry);
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      this._controlsSetup = true;
      p.textFont("Inter");
      this.initData(p);

      const container = document.getElementById("vis");
      if (container && !this.dropdown) {
        this.dropdown = p.createSelect();
        this.dropdown.parent(container);
        this.dropdown.class('form-select');
        this.dropdown.style("width", "240px");
        this.dropdown.style("margin", "20px");
        this.dropdown.option("— Select a Country —");
        this.dropdown.changed(() => {
          const val = this.dropdown.value();
          this.selectedCountry = val === "— Select a Country —" ? null : val;
        });
      }
    },

    draw: function (p) {
      if (!this._controlsSetup) this.setupControls(p);

      // Elegant background gradient
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

      p.textFont('Inter');
      p.textSize(15);
      p.fill(102, 102, 102);

      if (!this.countries.length) {
        p.text(this.statusMessage || "Loading GDP data…", 30, 80);
        return;
      }

      const country = this.selectedCountry;
      if (!country || !this.dataMap[country]) {
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(18);
        p.text("← Select a country to view GDP comparison", p.width/2, p.height/2);
        return;
      }

      const before = this.dataMap[country][2022];
      const after = this.dataMap[country][2024];
      if (!before || !after) {
        p.text("GDP data for 2022 and 2024 is incomplete.", 30, 80);
        return;
      }

      const margin = { left: 100, right: 60, top: 100, bottom: 90 };
      const chartW = p.width - margin.left - margin.right;
      const chartH = p.height - margin.top - margin.bottom;

      // Title
      p.textAlign(p.LEFT, p.TOP);
      p.textFont('Spectral');
      p.textSize(32);
      p.textStyle(p.BOLD);
      p.fill(26, 26, 26);
      p.text("GDP Impact Analysis", margin.left, 30);
      
      // Subtitle
      p.textFont('Inter');
      p.textSize(16);
      p.fill(102, 102, 102);
      p.text(country + " · 2022 vs 2024", margin.left, 70);

      const maxGDP = Math.max(before.gdp, after.gdp) || 1;
      const barWidth = 140;

      const x1 = margin.left + chartW * 0.35;
      const x2 = margin.left + chartW * 0.65;
      const baseY = margin.top + chartH;

      // Grid lines and labels
      p.stroke(240, 240, 240);
      p.strokeWeight(1);
      p.textAlign(p.RIGHT, p.CENTER);
      p.textFont('Inter');
      p.textSize(12);
      p.fill(153, 153, 153);
      
      for (let i = 0; i <= 5; i++) {
        const v = (maxGDP / 5) * i;
        const y = p.map(v, 0, maxGDP, baseY, margin.top);
        p.line(margin.left, y, margin.left + chartW, y);
        p.noStroke();
        const label = v >= 1e9 ? (v/1e9).toFixed(1) + "B" : (v/1e6).toFixed(0) + "M";
        p.text(label, margin.left - 12, y);
        p.stroke(240, 240, 240);
      }
      p.noStroke();

      // Y-axis label
      p.push();
      p.translate(40, margin.top + chartH/2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.CENTER);
      p.fill(102, 102, 102);
      p.textSize(13);
      p.text("GDP (USD)", 0, 0);
      p.pop();

      // 2022 bar
      const h1 = p.map(before.gdp, 0, maxGDP, 0, chartH);
      
      // Bar shadow
      p.fill(0, 0, 0, 20);
      p.rect(x1 - barWidth / 2 + 3, baseY - h1 + 3, barWidth, h1, 4);
      
      // Main bar
      p.fill(37, 99, 168);
      p.rect(x1 - barWidth / 2, baseY - h1, barWidth, h1, 4);
      
      // Value on bar
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.textStyle(p.BOLD);
      const val1 = before.gdp >= 1e9 ? (before.gdp/1e9).toFixed(2) + "B" : (before.gdp/1e6).toFixed(0) + "M";
      p.text("$" + val1, x1, baseY - h1 + 30);

      // Year label
      p.fill(26, 26, 26);
      p.textStyle(p.NORMAL);
      p.textSize(18);
      p.text("2022", x1, baseY + 30);

      // Tariff badge
      const tariffColor = before.direction === "increase" ? p.color(220, 38, 38) : p.color(5, 150, 105);
      p.fill(tariffColor);
      p.rect(x1 - 45, baseY - h1 - 40, 90, 26, 13);
      p.fill(255);
      p.textSize(13);
      p.text(before.tariff_prev + "% tariff", x1, baseY - h1 - 27);

      // 2024 bar
      const h2 = p.map(after.gdp, 0, maxGDP, 0, chartH);
      
      // Bar shadow
      p.fill(0, 0, 0, 20);
      p.rect(x2 - barWidth / 2 + 3, baseY - h2 + 3, barWidth, h2, 4);
      
      // Main bar
      p.fill(217, 119, 6);
      p.rect(x2 - barWidth / 2, baseY - h2, barWidth, h2, 4);
      
      // Value on bar
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.textStyle(p.BOLD);
      const val2 = after.gdp >= 1e9 ? (after.gdp/1e9).toFixed(2) + "B" : (after.gdp/1e6).toFixed(0) + "M";
      p.text("$" + val2, x2, baseY - h2 + 30);

      // Year label
      p.fill(26, 26, 26);
      p.textStyle(p.NORMAL);
      p.textSize(18);
      p.text("2024", x2, baseY + 30);

      // Tariff badge
      const tariffColor2 = after.direction === "increase" ? p.color(220, 38, 38) : p.color(5, 150, 105);
      p.fill(tariffColor2);
      p.rect(x2 - 45, baseY - h2 - 40, 90, 26, 13);
      p.fill(255);
      p.textSize(13);
      p.text(after.tariff_prev + "% tariff", x2, baseY - h2 - 27);

      // Change indicator
      const pctChange = ((after.gdp - before.gdp) / before.gdp * 100).toFixed(1);
      const isPositive = pctChange >= 0;
      
      p.fill(isPositive ? p.color(5, 150, 105) : p.color(220, 38, 38));
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);
      p.textStyle(p.BOLD);
      const arrow = isPositive ? "↑" : "↓";
      p.text(arrow + " " + Math.abs(pctChange) + "%", (x1 + x2) / 2, margin.top - 30);
    }
  };
})();
