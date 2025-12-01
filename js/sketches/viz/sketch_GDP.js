// sketch_GDP.js
// GDP comparison: 2022 vs 2024 with tariff context (instance-mode for scrollytelling)
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
      this.dropdown.option("-- Select a Country --");
      for (const c of this.countries) this.dropdown.option(c);
      if (this.selectedCountry) this.dropdown.value(this.selectedCountry);
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      this._controlsSetup = true;
      p.textFont("sans-serif");
      this.initData(p);

      const container = document.getElementById("vis");
      if (container && !this.dropdown) {
        this.dropdown = p.createSelect();
        this.dropdown.parent(container);
        this.dropdown.style("width", "220px");
        this.dropdown.option("-- Select a Country --");
        this.dropdown.changed(() => {
          const val = this.dropdown.value();
          this.selectedCountry = val === "-- Select a Country --" ? null : val;
        });
      }
    },

    draw: function (p) {
      if (!this._controlsSetup) this.setupControls(p);

      p.background(255);
      p.textSize(14);
      p.fill(0);

      if (!this.countries.length) {
        p.text(this.statusMessage || "Loading GDP data…", 20, 30);
        return;
      }

      const country = this.selectedCountry;
      if (!country || !this.dataMap[country]) {
        p.text("Select a country to view GDP", 20, 30);
        return;
      }

      const before = this.dataMap[country][2022];
      const after = this.dataMap[country][2024];
      if (!before || !after) {
        p.text("GDP data for 2022 and 2024 is incomplete.", 20, 30);
        return;
      }

      const margin = { left: 80, right: 40, top: 60, bottom: 70 };
      const chartW = p.width - margin.left - margin.right;
      const chartH = p.height - margin.top - margin.bottom;

      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.text("GDP of " + country + " Before vs After Tariff", margin.left + chartW / 2, margin.top - 30);

      const maxGDP = Math.max(before.gdp, after.gdp) || 1;
      const barWidth = 120;

      const x1 = margin.left + chartW * 0.33;
      const x2 = margin.left + chartW * 0.67;
      const baseY = margin.top + chartH;

      // Y grid/labels
      p.stroke(230);
      p.textAlign(p.RIGHT, p.CENTER);
      p.textSize(11);
      for (let i = 0; i <= 4; i++) {
        const v = (maxGDP / 4) * i;
        const y = p.map(v, 0, maxGDP, baseY, margin.top);
        p.line(margin.left, y, margin.left + chartW, y);
        p.noStroke();
        p.fill(80);
        p.text(v.toFixed(0), margin.left - 6, y);
        p.stroke(230);
      }
      p.noStroke();

      // 2022 bar
      p.fill("#113EA7");
      const h1 = p.map(before.gdp, 0, maxGDP, 0, chartH);
      p.rect(x1 - barWidth / 2, baseY - h1, barWidth, h1);
      p.fill(0);
      p.textAlign(p.CENTER, p.TOP);
      p.text("2022", x1, baseY + 10);

      // Tariff label (2022)
      p.fill(before.direction === "increase" ? "#5DD548" : "#FC3640");
      p.textSize(12);
      p.text("Tariff: " + before.tariff_prev + "%", x1, baseY - h1 - 18);

      // 2024 bar
      p.fill("#F57A00");
      const h2 = p.map(after.gdp, 0, maxGDP, 0, chartH);
      p.rect(x2 - barWidth / 2, baseY - h2, barWidth, h2);
      p.fill(0);
      p.textAlign(p.CENTER, p.TOP);
      p.text("2024", x2, baseY + 10);

      // Tariff label (2024)
      p.fill(after.direction === "increase" ? "#5DD548" : "#FC3640");
      p.textSize(12);
      p.text("Tariff: " + after.tariff_prev + "%", x2, baseY - h2 - 18);
    }
  };
})();
