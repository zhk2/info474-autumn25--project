(function () {
  window.sketch_tariff = {
    table: null,
    dropdown: null,
    countries: [],
    dataMap: {},
    _controlsSetup: false,
    _dataLoaded: false,

    initData(p) {
      // Load CSV asynchronously
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
            import_value: 0,
            export_value: 0,
            tariff_prev_year: Number(row.get("tariff_prev_year")) || 0,
            tariff_change_value: Number(row.get("tariff_change_value")) || 0,
            tariff_change_direction: row.get("tariff_change_direction") || "unknown",
          };
        }

        this.dataMap[country][year].import_value += Number(row.get("import_value")) || 0;
        this.dataMap[country][year].export_value += Number(row.get("export_value")) || 0;

        if (!this.countries.includes(country)) this.countries.push(country);
      }

      this.countries.sort();
      console.log("🌍 Countries after aggregation:", this.countries);
    },

    setupControls(p) {
      if (this._controlsSetup || !this._dataLoaded) return;

      // Canvas (append to body)
      this.canvas = p.createCanvas(900, 500);

      // Dropdown (absolute positioning)
      this.dropdown = p.createSelect();
      this.dropdown.position(20, 20);
      this.dropdown.option("-- Select a Country --");
      this.countries.forEach((c) => this.dropdown.option(c, c));
      this.dropdown.changed(() => p.redraw());

      this._controlsSetup = true;
    },

    draw(p) {
      p.background(255);
      p.fill(0);
      p.textSize(18);

      if (!this._dataLoaded) {
        p.text("Loading trade data...", 20, 40);
        return;
      }

      if (!this.dropdown) {
        p.text("Dropdown not ready yet", 20, 40);
        return;
      }

      let country = this.dropdown.value();
      if (!country || country === "-- Select a Country --") {
        p.text("Select a country to view data", 20, 40);
        return;
      }

      // Get data safely
      let before = this.dataMap[country]?.[2022] || { import_value: 0, export_value: 0, tariff_prev_year: 0, tariff_change_direction: "unknown" };
      let after = this.dataMap[country]?.[2024] || { import_value: 0, export_value: 0, tariff_prev_year: 0, tariff_change_direction: "unknown" };

      // Ensure numeric
      before.import_value = Number(before.import_value) || 0;
      before.export_value = Number(before.export_value) || 0;
      before.tariff_prev_year = Number(before.tariff_prev_year) || 0;

      after.import_value = Number(after.import_value) || 0;
      after.export_value = Number(after.export_value) || 0;
      after.tariff_prev_year = Number(after.tariff_prev_year) || 0;

      // Debug: log if all zeros
      if (before.import_value + before.export_value === 0 && after.import_value + after.export_value === 0) {
        console.warn("No trade data available for", country, before, after);
        p.text("No trade data available for this country", p.width / 2, p.height / 2);
        return;
      }

      // Title
      p.textAlign(p.CENTER);
      p.text(`Imports and Exports of ${country} Before and After Tariff`, p.width / 2, 30);

      // Max for scaling bars
      let maxVal = Math.max(before.import_value + before.export_value, after.import_value + after.export_value);

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







