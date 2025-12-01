(function () {
  window.sketch_gdp = {
    table: null,
    dropdown: null,
    countries: [],
    dataMap: {},
    canvas: null,
    _controlsSetup: false,
    _dataLoaded: false,
    sectionEl: null, // container section

    initData(p) {
      p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        (table) => {
          this.table = table;
          console.log("✅ CSV loaded:", table.getRowCount(), "rows");
          this.processData(table);
          this._dataLoaded = true;

          if (!this._controlsSetup) this.setupControls(p);
          p.redraw();
        },
        () => console.error("❌ Failed to load CSV")
      );
    },

    processData(table) {
      this.dataMap = {};
      this.countries = [];

      for (let r = 0; r < table.getRowCount(); r++) {
        let row = table.getRow(r);
        let country = row.getString("country_name");
        let year = Number(row.get("year"));

        if (isNaN(year) || (year !== 2022 && year !== 2024)) continue;

        if (!this.dataMap[country]) this.dataMap[country] = {};
        if (!this.dataMap[country][year]) {
          this.dataMap[country][year] = {
            gdp_usd: Number(row.get("gdp_usd")) || 0,
            tariff_prev_year: Number(row.get("tariff_prev_year")) || 0,
            tariff_change_value: Number(row.get("tariff_change_value")) || 0,
            tariff_change_direction: row.get("tariff_change_direction") || "unknown",
          };
        } else {
          this.dataMap[country][year].gdp_usd += Number(row.get("gdp_usd")) || 0;
        }

        if (!this.countries.includes(country)) this.countries.push(country);
      }

      this.countries.sort();
      console.log("🌍 Countries after aggregation:", this.countries);
    },

    setupControls(p) {
      if (this._controlsSetup || !this._dataLoaded) return;

      // Section container
      this.sectionEl = document.querySelector('section[data-active-index="4"]');
      if (!this.sectionEl) {
        console.error("❌ Section 4 not found");
        return;
      }
      this.sectionEl.style.position = "relative";
      this.sectionEl.style.minHeight = "600px"; // enough space for canvas

      // Canvas inside section
      this.canvas = p.createCanvas(900, 500);
      this.canvas.parent(this.sectionEl);

      // Dropdown inside section
      this.dropdown = p.createSelect();
      this.dropdown.parent(this.sectionEl);
      this.dropdown.option("-- Select a Country --");
      this.countries.forEach((c) => this.dropdown.option(c));
      this.dropdown.changed(() => p.redraw());

      this._controlsSetup = true;
    },

    draw(p) {
      if (!this._controlsSetup || !this._dataLoaded) return;

      // Show dropdown only if section is visible
      const sectionVisible = this.sectionEl.getBoundingClientRect().top < window.innerHeight &&
                             this.sectionEl.getBoundingClientRect().bottom > 0;
      if (sectionVisible) this.dropdown.show();
      else this.dropdown.hide();

      p.background(255);
      p.fill(0);
      p.textSize(18);

      if (!this.dropdown || !this.countries.length) {
        p.text("Loading trade data...", 20, 40);
        return;
      }

      let country = this.dropdown.value();
      if (!country || country === "-- Select a Country --") {
        p.text("Select a country to view data", 20, 40);
        return;
      }

      let before = this.dataMap[country]?.[2022] || { gdp_usd: 0, tariff_prev_year: 0, tariff_change_direction: "unknown" };
      let after = this.dataMap[country]?.[2024] || { gdp_usd: 0, tariff_prev_year: 0, tariff_change_direction: "unknown" };

      before.gdp_usd = Number(before.gdp_usd) || 0;
      after.gdp_usd = Number(after.gdp_usd) || 0;

      if (before.gdp_usd === 0 && after.gdp_usd === 0) {
        p.text("No GDP data available for this country", p.width / 2, p.height / 2);
        return;
      }

      p.textAlign(p.CENTER);
      p.text(`GDP of ${country} Before and After Tariff`, p.width / 2, 30);

      // --- Legend ---
      const legendX = 50;
      const legendY = 60;
      const legendSpacing = 20;

      p.fill("#113EA7"); p.rect(legendX, legendY, 15, 15);
      p.fill(0); p.textAlign(p.LEFT, p.CENTER); p.text("GDP (USD)", legendX + 20, legendY + 7.5);

      p.fill("#5DD548"); p.rect(legendX + 150, legendY, 15, 15);
      p.fill(0); p.text("Tariff ↑", legendX + 170, legendY + 7.5);

      p.fill("#FC3640"); p.rect(legendX + 270, legendY, 15, 15);
      p.fill(0); p.text("Tariff ↓", legendX + 290, legendY + 7.5);

      // --- Bars ---
      let maxVal = Math.max(before.gdp_usd, after.gdp_usd);
      let barWidth = 100;
      let gap = 10;

      let bars = [];

      // BEFORE 2022
      let xBefore = p.width / 3;
      let hBefore = p.map(before.gdp_usd, 0, maxVal, 0, 250);

      p.fill("#113EA7");
      p.rect(xBefore - barWidth/2, p.height - 80 - hBefore, barWidth, hBefore);
      bars.push({ x: xBefore - barWidth/2, y: p.height - 80 - hBefore, w: barWidth, h: hBefore, label: `GDP: $${before.gdp_usd.toLocaleString()}` });

      p.fill(before.tariff_change_direction === "increase" ? "#5DD548" : "#FC3640");
      p.textAlign(p.CENTER);
      p.text(`Tariff: ${before.tariff_prev_year}%`, xBefore, p.height - 320);
      p.fill(0);
      p.text("Before Tariff (2022)", xBefore, p.height - 40);

      // AFTER 2024
      let xAfter = (2 * p.width) / 3;
      let hAfter = p.map(after.gdp_usd, 0, maxVal, 0, 250);

      p.fill("#113EA7");
      p.rect(xAfter - barWidth/2, p.height - 80 - hAfter, barWidth, hAfter);
      bars.push({ x: xAfter - barWidth/2, y: p.height - 80 - hAfter, w: barWidth, h: hAfter, label: `GDP: $${after.gdp_usd.toLocaleString()}` });

      p.fill(after.tariff_change_direction === "increase" ? "#5DD548" : "#FC3640");
      p.text(`Tariff: ${after.tariff_prev_year}%`, xAfter, p.height - 320);
      p.fill(0);
      p.text("After Tariff (2024)", xAfter, p.height - 40);

      // --- Hover tooltips ---
      bars.forEach((b) => {
        if (p.mouseX > b.x && p.mouseX < b.x + b.w &&
            p.mouseY > b.y && p.mouseY < b.y + b.h) {
          p.fill(255, 255, 200);
          p.stroke(0);
          p.rect(p.mouseX + 10, p.mouseY - 20, p.textWidth(b.label) + 10, 20);
          p.noStroke();
          p.fill(0);
          p.textAlign(p.LEFT, p.CENTER);
          p.text(b.label, p.mouseX + 15, p.mouseY - 10);
        }
      });
    },
  };
})();

