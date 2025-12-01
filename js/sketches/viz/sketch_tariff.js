// sketch_tariff.js
// Aggregated country-level imports/exports before and after tariff

(function () {
  window.sketch_tariff = {
    table: null,
    dropdown: null,
    countries: [],
    dataMap: {},
    _controlsSetup: false,

    initData(p) {
      this.table = p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        (table) => this.processData(table)
      );
    },

    processData(table) {
      this.dataMap = {};
      this.countries = [];

      for (let r = 0; r < table.getRowCount(); r++) {
        let row = table.getRow(r);
        let country = row.getString("country_name");
        let year = row.getNum("year");

        // Only need 2022 and 2024
        if (year !== 2022 && year !== 2024) continue;

        // Initialize country object
        if (!this.dataMap[country]) this.dataMap[country] = {};
        if (!this.dataMap[country][year]) {
          this.dataMap[country][year] = {
            import_value: 0,
            export_value: 0,
            tariff_prev_year: row.getNum("tariff_prev_year"),
            tariff_change_value: row.getNum("tariff_change_value"),
            tariff_change_direction: row.getString("tariff_change_direction")
          };
        }

        // Aggregate by summing imports/exports across commodities
        this.dataMap[country][year].import_value += row.getNum("import_value");
        this.dataMap[country][year].export_value += row.getNum("export_value");

        if (!this.countries.includes(country)) {
          this.countries.push(country);
        }
      }

      this.countries.sort();
    },

    setupControls(p) {
      if (this._controlsSetup) return;

      // Canvas
      this.canvas = p.createCanvas(900, 500);
      this.canvas.parent("vis");

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
      p.textSize(18);
      p.fill(0);

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
        p.text("Missing 2022 or 2024 data.", 20, 40);
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

      let barWidth = 130;

      // BEFORE (2022)
      let x1 = p.width / 3;

      let hImp1 = p.map(before.import_value, 0, maxVal, 0, 250);
      let hExp1 = p.map(before.export_value, 0, maxVal, 0, 250);

      p.fill("#113EA7");
      p.rect(x1 - barWidth / 2, p.height - 80 - hImp1, barWidth, hImp1);

      p.fill("#F57A00");
      p.rect(x1 - barWidth / 2, p.height - 80 - hImp1 - hExp1, barWidth, hExp1);

      p.fill(0);
      p.text("Before Tariff (2022)", x1, p.height - 40);

      p.fill(before.tariff_change_direction === "increase" ? "#5DD548" : "#FC3640");
      p.text(`Tariff: ${before.tariff_prev_year}%`, x1, p.height - 320);

      // AFTER (2024)
      let x2 = (2 * p.width) / 3;

      let hImp2 = p.map(after.import_value, 0, maxVal, 0, 250);
      let hExp2 = p.map(after.export_value, 0, maxVal, 0, 250);

      p.fill("#113EA7");
      p.rect(x2 - barWidth / 2, p.height - 80 - hImp2, barWidth, hImp2);

      p.fill("#F57A00");
      p.rect(x2 - barWidth / 2, p.height - 80 - hImp2 - hExp2, barWidth, hExp2);

      p.fill(0);
      p.text("After Tariff (2024)", x2, p.height - 40);

      p.fill(after.tariff_change_direction === "increase" ? "#5DD548" : "#FC3640");
      p.text(`Tariff: ${after.tariff_prev_year}%`, x2, p.height - 320);
    },
  };
})();


