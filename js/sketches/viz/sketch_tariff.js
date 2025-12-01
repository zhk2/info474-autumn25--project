(function () {
  window.sketch_tariff = {
    _controlsSetup: false,
    _dataInitialized: false,
    table: null,
    data: [],
    countries: [],
    selectedCountry: null,
    canvas: null,
    statusMessage: "Loading trade data…",

    initData: function (p) {
      if (this._dataInitialized) return;

      this.table = p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        () => {
          this.processData();
          this._dataInitialized = true;
          console.log("Data loaded:", this.data); // Now visible on window
        }
      );
    },

    processData: function () {
      if (!this.table || typeof this.table.getRowCount !== "function") {
        this.statusMessage = "Failed to load trade data.";
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
      if (!this.selectedCountry && this.countries.length) this.selectedCountry = this.countries[0];

      console.log("Processed data stored:", this.data); // Immediate visibility
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;

      const container = document.getElementById("vis");
      if (!container) return;

      container.innerHTML = "";

 
      const dropdown = document.createElement("select");
      dropdown.className = "form-select";
      dropdown.style.width = "240px";
      dropdown.style.marginBottom = "10px";

      this.countries.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        dropdown.appendChild(opt);
      });

      dropdown.onchange = () => {
        this.selectedCountry = dropdown.value;
      };
      container.appendChild(dropdown);

      // Canvas
      this.canvas = p.createCanvas(900, 400);
      this.canvas.parent("vis");

      this._controlsSetup = true;
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

      const marginL = 80, marginR = 80, marginT = 40, marginB = 80;
      const chartW = p.width - marginL - marginR;
      const chartH = p.height - marginT - marginB;

      const maxTrade = Math.max(...imports, ...exports) * 1.25;
      const maxTariff = Math.max(...tariffs, 10);

      // Axes
      p.stroke(0);
      p.line(marginL, marginT, marginL, marginT + chartH);
      p.line(marginL, marginT + chartH, marginL + chartW, marginT + chartH);
      p.line(marginL + chartW, marginT, marginL + chartW, marginT + chartH);

      p.noStroke();
      p.fill(20);
      p.textSize(20);
      p.text("Trade & Tariff Data: " + this.selectedCountry, marginL, marginT - 10);

      // Imports line
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

      // Exports line
      p.stroke(255, 150, 50);
      p.strokeWeight(3);
      p.beginShape();
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        const y = p.map(r.export_value, 0, maxTrade, marginT + chartH, marginT);
        p.vertex(x, y);
      });
      p.endShape();

      // Tariffs bars
      p.noStroke();
      p.fill(220, 60, 60, 150);
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        const y = p.map(r.tariff_prev_year, 0, maxTariff, marginT + chartH, marginT);
        const h = marginT + chartH - y;
        p.rect(x - 6, y, 12, h);
      });

      // Axis labels, legends, etc. unchanged
    }
  };
  
  document.addEventListener("DOMContentLoaded", () => {
    // Only create canvas if #vis exists
    if (document.getElementById("vis")) {
      new p5(window.sketch_tariff, "vis");
    }
  });
})();



















   
