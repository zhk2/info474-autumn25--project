// sketch_trade_tariff.js
// p5.js visualization: Imports & Exports Before (2022) vs After (2024) Tariff
// sketch_tariff.js
// p5.js visualization: Imports & Exports Before (2022) vs After (2024) Tariff

(function () {
  window.sketch_tariff = {
    table: null,
    dropdown: null,
    countries: [],
    dataMap: {},
    _controlsSetup: false,
    _dataInitialized: false,

    initData(p) {
      // Load table once
      this.table = p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        (table) => {
          this.processData(table);
        }
      );
    },

    processData(table) {
      this.countries = [];
      this.dataMap = {};

      for (let r = 0; r < table.getRowCount(); r++) {
        let row = table.getRow(r);
        let country = row.getString("country_name");
        let year = row.getNum("year");

        if (year !== 2022 && year !== 2024) continue;

        if (!this.dataMap[country]) this.dataMap[country] = {};

        this.dataMap[country][year] = {
          import_value: row.getNum("import_value"),
          export_value: row.getNum("export_value"),
          gdp: row.getNum("gdp_usd"),
          tariff_prev: row.getNum("tariff_prev_year"),
          tariff_change: row.getNum("tariff_change_value"),
          direction: row.getString("tariff_change_direction"),
        };

        if (!this.countries.includes(country)) this.countries.push(country);
      }

      this.countries.sort();
    },

    setupControls(p) {
      if (this._controlsSetup) return;

      // Canvas
      this.cnv = p.createCanvas(900, 500);
      this.cnv.parent("vis");

      // Dropdown
      this.dropdown = p.createSelect();
      this.dropdown.parent("vis");
      this.dropdown.style("width", "250px");

      this.dropdown.option("-- Select a Country --");
      for (let c of this.countries) this.dropdown.option(c);

      this.dropdown.changed(() => p.redraw());
      p.noLoop();

      this._controlsSetup = true;
    },

    draw(p) {
      p.background(255);
      p.fill(0);
      p.textSize(18);

      if (!this.dropdown) {
        p.text("Loading trade data...", 20, 40);
        return;
      }

      let country = this.dropdown.value();
      if (country === "-- Select a Country --") {
        p.text("Select a country to view data", 20, 40);
        return;
      }

      let before = this.dataMap[country]?.[2022];
      let after = this.dataMap[country]?.[2024];

      if (!before || !after) {
        p.text("Data for 2022 and 2024 is incomplete.", 20, 40);
        return;
      }

      p.textAlign(p.CENTER);
      p.text(
        `Imports and Exports of ${country} Before and After Tariff`,
        p.width / 2,
        30
      );

      let maxVal = Math.max(
        before.import_value + before.export_value,
        after.import_value + after.export_value
      );

      let barWidth = 120;

      // BEFORE tariff (2022)
      let x1 = p.width / 3;

      let hImp1 = p.map(before.import_value, 0, maxVal, 0, 250);
      let hExp1 = p.map(before.export_value, 0, maxVal, 0, 250);

      p.fill("#113EA7");
      p.rect(x1 - barWidth / 2, p.height - 80 - hImp1, barWidth, hImp1);

      p.fill("#F57A00");
      p.rect(
        x1 - barWidth / 2,
        p.height - 80 - hImp1 - hExp1,
        barWidth,
        hExp1
      );

      p.fill(0);
      p.text("Before Tariff (2022)", x1, p.height - 40);

      p.fill(before.direction === "increase" ? "#5DD548" : "#FC3640");
      p.text(`Tariff: ${before.tariff_prev}%`, x1, p.height - 320);

      // AFTER tariff (2024)
      let x2 = (2 * p.width) / 3;

      let hImp2 = p.map(after.import_value, 0, maxVal, 0, 250);
      let hExp2 = p.map(after.export_value, 0, maxVal, 0, 250);

      p.fill("#113EA7");
      p.rect(x2 - barWidth / 2, p.height - 80 - hImp2, barWidth, hImp2);

      p.fill("#F57A00");
      p.rect(
        x2 - barWidth / 2,
        p.height - 80 - hImp2 - hExp2,
        barWidth,
        hExp2
      );

      p.fill(0);
      p.text("After Tariff (2024)", x2, p.height - 40);

      p.fill(after.direction === "increase" ? "#5DD548" : "#FC3640");
      p.text(`Tariff: ${after.tariff_prev}%`, x2, p.height - 320);
    },
  };
})();

