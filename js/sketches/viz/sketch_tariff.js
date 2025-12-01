(function () {
  window.sketch_tariff = {
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
            total_imports_country: Number(row.get("total_imports_country")) || 0,
            total_exports_country: Number(row.get("total_exports_country")) || 0,
            yoy_trade_balance: Number(row.get("yoy_trade_balance")) || 0,
          };
        } else {
          this.dataMap[country][year].total_imports_country += Number(row.get("total_imports_country")) || 0;
          this.dataMap[country][year].total_exports_country += Number(row.get("total_exports_country")) || 0;
          this.dataMap[country][year].yoy_trade_balance += Number(row.get("yoy_trade_balance")) || 0;
        }

        if (!this.countries.includes(country)) this.countries.push(country);
      }

      this.countries.sort();
      console.log("🌍 Countries after aggregation:", this.countries);
    },

    setupControls(p) {
      if (this._controlsSetup || !this._dataLoaded) return;

      this.sectionEl = document.querySelector('section[data-active-index="4"]');
      if (!this.sectionEl) {
        console.error("❌ Section 4 not found");
        return;
      }
      this.sectionEl.style.position = "relative";
      this.sectionEl.style.minHeight = "600px";

      this.canvas = p.createCanvas(900, 500);
      this.canvas.parent(this.sectionEl);

      this.dropdown = p.createSelect();
      this.dropdown.parent(this.sectionEl);
      this.dropdown.option("-- Select a Country --");
      this.countries.forEach((c) => this.dropdown.option(c));
      this.dropdown.changed(() => p.redraw());

      this._controlsSetup = true;
    },

    draw(p) {
      if (!this._controlsSetup || !this._dataLoaded) return;

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

      let before = this.dataMap[country]?.[2022] || { total_imports_country: 0, total_exports_country: 0, yoy_trade_balance: 0 };
      let after = this.dataMap[country]?.[2024] || { total_imports_country: 0, total_exports_country: 0, yoy_trade_balance: 0 };

      before.total_imports_country = Number(before.total_imports_country) || 0;
      before.total_exports_country = Number(before.total_exports_country) || 0;
      before.yoy_trade_balance = Number(before.yoy_trade_balance) || 0;

      after.total_imports_country = Number(after.total_imports_country) || 0;
      after.total_exports_country = Number(after.total_exports_country) || 0;
      after.yoy_trade_balance = Number(after.yoy_trade_balance) || 0;

      if (before.total_imports_country + before.total_exports_country === 0 &&
          after.total_imports_country + after.total_exports_country === 0) {
        p.text("No trade data available for this country", p.width / 2, p.height / 2);
        return;
      }

      p.textAlign(p.CENTER);
      p.text(`Imports and Exports of ${country} Before and After Tariff`, p.width / 2, 30);

      // --- Legend (spaced out) ---
      const legendX = 50;
      const legendY = 60;
      const spacing = 140; // increased spacing

      p.fill("#113EA7"); p.rect(legendX, legendY, 15, 15);
      p.fill(0); p.textAlign(p.LEFT, p.CENTER); p.text("Imports", legendX + 20, legendY + 7.5);

      p.fill("#F57A00"); p.rect(legendX + spacing, legendY, 15, 15);
      p.fill(0); p.text("Exports", legendX + spacing + 20, legendY + 7.5);

      p.fill("#5DD548"); p.rect(legendX + spacing*2, legendY, 15, 15);
      p.fill(0); p.text("Trade Balance ↑", legendX + spacing*2 + 20, legendY + 7.5);

      p.fill("#FC3640"); p.rect(legendX + spacing*3, legendY, 15, 15);
      p.fill(0); p.text("Trade Balance ↓", legendX + spacing*3 + 20, legendY + 7.5);

      // --- Bars ---
      let maxVal = Math.max(before.total_imports_country + before.total_exports_country,
                            after.total_imports_country + after.total_exports_country);
      let barWidth = 50;
      let gap = 10;
      let bars = [];

      // BEFORE 2022
      let xBefore = p.width / 3;
      let hImpBefore = p.map(before.total_imports_country, 0, maxVal, 0, 250);
      let hExpBefore = p.map(before.total_exports_country, 0, maxVal, 0, 250);

      p.fill("#113EA7");
      p.rect(xBefore - barWidth - gap/2, p.height - 80 - hImpBefore, barWidth, hImpBefore);
      bars.push({ x: xBefore - barWidth - gap/2, y: p.height - 80 - hImpBefore, w: barWidth, h: hImpBefore, label: `Imports: ${before.total_imports_country}` });

      p.fill("#F57A00");
      p.rect(xBefore + gap/2, p.height - 80 - hExpBefore, barWidth, hExpBefore);
      bars.push({ x: xBefore + gap/2, y: p.height - 80 - hExpBefore, w: barWidth, h: hExpBefore, label: `Exports: ${before.total_exports_country}` });

      // Trade balance color and rounded to 1 decimal
      const roundedBeforeTB = Math.round(before.yoy_trade_balance * 10) / 10;
      p.fill(roundedBeforeTB >= 0 ? "#5DD548" : "#FC3640");
      p.textAlign(p.CENTER);
      p.text(`Trade Balance: ${roundedBeforeTB}`, xBefore, p.height - 320);
      p.fill(0);
      p.text("Before Tariff (2022)", xBefore, p.height - 40);

      // AFTER 2024
      let xAfter = (2 * p.width) / 3;
      let hImpAfter = p.map(after.total_imports_country, 0, maxVal, 0, 250);
      let hExpAfter = p.map(after.total_exports_country, 0, maxVal, 0, 250);

      p.fill("#113EA7");
      p.rect(xAfter - barWidth - gap/2, p.height - 80 - hImpAfter, barWidth, hImpAfter);
      bars.push({ x: xAfter - barWidth - gap/2, y: p.height - 80 - hImpAfter, w: barWidth, h: hImpAfter, label: `Imports: ${after.total_imports_country}` });

      p.fill("#F57A00");
      p.rect(xAfter + gap/2, p.height - 80 - hExpAfter, barWidth, hExpAfter);
      bars.push({ x: xAfter + gap/2, y: p.height - 80 - hExpAfter, w: barWidth, h: hExpAfter, label: `Exports: ${after.total_exports_country}` });

      const roundedAfterTB = Math.round(after.yoy_trade_balance * 10) / 10;
      p.fill(roundedAfterTB >= 0 ? "#5DD548" : "#FC3640");
      p.text(`Trade Balance: ${roundedAfterTB}`, xAfter, p.height - 320);
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













