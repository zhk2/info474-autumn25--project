(function () {
  window.sketch_tariff = {
    _controlsSetup: false,
    _dataInitialized: false,
    table: null,
    data: [],
    countries: [],
    selectedCountry: null,
    dropdown: null,
    statusMessage: "Loading trade data…",

    initData: function (p) {
      if (this._dataInitialized) return;

      console.log("Loading CSV table...");
      this.table = p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        () => {
          console.log("CSV loaded successfully!");
          this.processData();
          this.populateDropdown();
          this._dataInitialized = true;
        },
        (err) => {
          console.error("Failed to load table:", err);
          this.statusMessage = "Failed to load trade data!";
        }
      );
    },

    processData: function () {
      if (!this.table || typeof this.table.getRowCount !== "function") {
        this.statusMessage = "Failed to process trade data.";
        return;
      }

      this.data = [];
      for (let r = 0; r < this.table.getRowCount(); r++) {
        const row = this.table.getRow(r);
        this.data.push({
          year: row.getNum("year"),
          country: row.getString("country"),
          import_value: row.getNum("import_value"),
          export_value: row.getNum("export_value"),
          tariff_prev_year: row.getNum("tariff_prev_year")
        });
      }

      this.countries = [...new Set(this.data.map(d => d.country))];
      this.selectedCountry = this.countries.length ? this.countries[0] : null;

      console.log("Countries loaded:", this.countries);
      console.log("First 5 rows of data:", this.data.slice(0, 5));
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      this._controlsSetup = true;

      const container = document.getElementById("vis");
      if (!container) return;

      // Dropdown (do not wipe the canvas the manager created)
      if (!this.dropdown) {
        const dropdown = document.createElement("select");
        dropdown.className = "form-select";
        dropdown.style.width = "240px";
        dropdown.style.marginBottom = "10px";
        dropdown.onchange = () => {
          this.selectedCountry = dropdown.value;
        };
        this.dropdown = dropdown;
        container.appendChild(dropdown);
      }

      this.populateDropdown();
    },

    populateDropdown: function () {
      if (!this.dropdown) return;
      this.dropdown.innerHTML = "";
      this.countries.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        this.dropdown.appendChild(opt);
      });
      if (this.selectedCountry) {
        this.dropdown.value = this.selectedCountry;
      } else if (this.countries.length) {
        this.dropdown.value = this.countries[0];
        this.selectedCountry = this.countries[0];
      }
    },

    draw: function (p) {
      if (!this._controlsSetup) this.setupControls(p);
      if (!this._dataInitialized) this.initData(p);

      p.background(250);

      if (!this.data.length || !this.selectedCountry) {
        p.fill(0);
        p.textSize(20);
        p.text(this.statusMessage, 20, 40);
        return;
      }

      const rows = this.data.filter(d => d.country === this.selectedCountry);
      if (!rows.length) {
        p.fill(0);
        p.text("No data for this country.", 20, 40);
        return;
      }

      const years = rows.map(r => r.year);
      const imports = rows.map(r => r.import_value);
      const exports = rows.map(r => r.export_value);
      const tariffs = rows.map(r => r.tariff_prev_year);

      // Chart margins
      const marginL = 80, marginR = 80, marginT = 40, marginB = 80;
      const chartW = p.width - marginL - marginR;
      const chartH = p.height - marginT - marginB;

      const maxTrade = Math.max(...imports, ...exports) * 1.25;
      const maxTariff = Math.max(...tariffs, 10);

      // Axes
      p.stroke(0);
      p.line(marginL, marginT, marginL, marginT + chartH); // left Y
      p.line(marginL, marginT + chartH, marginL + chartW, marginT + chartH); // bottom X

      // Title
      p.noStroke();
      p.fill(20);
      p.textSize(20);
      p.text("Trade & Tariff Data: " + this.selectedCountry, marginL, marginT - 10);

      // Import line
      p.stroke(50, 100, 200);
      p.strokeWeight(3);
      p.noFill();
      p.beginShape();
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        const y = p.map(r.import_value, 0, maxTrade, marginT + chartH, marginT);
        p.vertex(x, y);
      });
      p.endShape();

      // Export line
      p.stroke(255, 150, 50);
      p.strokeWeight(3);
      p.beginShape();
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        const y = p.map(r.export_value, 0, maxTrade, marginT + chartH, marginT);
        p.vertex(x, y);
      });
      p.endShape();

      // Tariff bars
      p.noStroke();
      p.fill(220, 60, 60, 150);
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        const y = p.map(r.tariff_prev_year, 0, maxTariff, marginT + chartH, marginT);
        const h = marginT + chartH - y;
        p.rect(x - 6, y, 12, h);
      });

      // Axis labels
      p.fill(0);
      p.textSize(12);
      p.textAlign(p.CENTER);
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        p.text(r.year, x, marginT + chartH + 20);
      });

      // Left Y-axis (Trade)
      p.textAlign(p.RIGHT, p.CENTER);
      p.textSize(11);
      for (let t = 0; t <= 5; t++) {
        const val = (maxTrade / 5) * t;
        const yPos = p.map(val, 0, maxTrade, marginT + chartH, marginT);
        p.noStroke();
        p.fill(0);
        p.text(val.toFixed(0), marginL - 5, yPos);
      }

      // Right Y-axis (Tariff %)
      p.textAlign(p.LEFT, p.CENTER);
      for (let t = 0; t <= 5; t++) {
        const val = (maxTariff / 5) * t;
        const yPos = p.map(val, 0, maxTariff, marginT + chartH, marginT);
        p.noStroke();
        p.fill(220, 60, 60);
        p.text(val.toFixed(0) + "%", marginL + chartW + 5, yPos);
      }

      // Legend
      p.noStroke();
      p.textSize(12);
      p.fill(50, 100, 200);
      p.rect(marginL + chartW - 120, marginT, 12, 12);
      p.fill(0);
      p.text("Imports", marginL + chartW - 100, marginT + 10);
      p.fill(255, 150, 50);
      p.rect(marginL + chartW - 120, marginT + 20, 12, 12);
      p.fill(0);
      p.text("Exports", marginL + chartW - 100, marginT + 30);
      p.fill(220, 60, 60, 150);
      p.rect(marginL + chartW - 120, marginT + 40, 12, 12);
      p.fill(0);
      p.text("Tariff %", marginL + chartW - 100, marginT + 50);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    new p5(window.sketch_tariff, "vis");
  });
})();

   
