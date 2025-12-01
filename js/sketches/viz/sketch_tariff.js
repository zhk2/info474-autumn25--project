// sketch_tariff.js - IMPROVED VERSION
// Trade & Tariff visualization with professional editorial styling
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

      this.table = p.loadTable(
        "data/datasets/Improved_Dataset/trade_master_full.csv",
        "csv",
        "header",
        () => {
          this.processData();
          this.populateDropdown();
          this._dataInitialized = true;
        },
        (err) => {
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
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      this._controlsSetup = true;

      const container = document.getElementById("vis");
      if (!container) return;

      if (!this.dropdown) {
        const dropdown = document.createElement("select");
        dropdown.className = "form-select";
        dropdown.style.width = "260px";
        dropdown.style.margin = "20px";
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

      // Elegant background
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

      if (!this.data.length || !this.selectedCountry) {
        p.fill(102, 102, 102);
        p.textFont('Inter');
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(this.statusMessage, p.width/2, p.height/2);
        return;
      }

      const rows = this.data.filter(d => d.country === this.selectedCountry);
      if (!rows.length) {
        p.fill(102, 102, 102);
        p.text("No data for this country.", p.width/2, p.height/2);
        return;
      }

      const years = rows.map(r => r.year);
      const imports = rows.map(r => r.import_value);
      const exports = rows.map(r => r.export_value);
      const tariffs = rows.map(r => r.tariff_prev_year);

      const marginL = 100, marginR = 100, marginT = 110, marginB = 80;
      const chartW = p.width - marginL - marginR;
      const chartH = p.height - marginT - marginB;

      const maxTrade = Math.max(...imports, ...exports) * 1.2;
      const maxTariff = Math.max(...tariffs, 10);

      // Title
      p.textFont('Spectral');
      p.textSize(32);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      p.fill(26, 26, 26);
      p.text("Trade & Tariffs Over Time", marginL, 30);

      // Subtitle
      p.textFont('Inter');
      p.textSize(16);
      p.fill(102, 102, 102);
      p.text(this.selectedCountry, marginL, 70);

      // Axes
      p.stroke(229, 229, 229);
      p.strokeWeight(2);
      p.line(marginL, marginT, marginL, marginT + chartH);
      p.line(marginL, marginT + chartH, marginL + chartW, marginT + chartH);

      // Grid
      p.stroke(245, 245, 245);
      p.strokeWeight(1);
      for (let i = 0; i <= 5; i++) {
        const y = p.map(i/5, 0, 1, marginT + chartH, marginT);
        p.line(marginL, y, marginL + chartW, y);
      }

      // Left Y-axis (Trade)
      p.noStroke();
      p.textAlign(p.RIGHT, p.CENTER);
      p.textFont('Inter');
      p.textSize(11);
      p.fill(102, 102, 102);
      for (let t = 0; t <= 5; t++) {
        const val = (maxTrade / 5) * t;
        const yPos = p.map(val, 0, maxTrade, marginT + chartH, marginT);
        const label = val >= 1e9 ? (val/1e9).toFixed(1) + "B" : (val/1e6).toFixed(0) + "M";
        p.text(label, marginL - 8, yPos);
      }

      // Y-axis label (left)
      p.push();
      p.translate(35, marginT + chartH/2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.CENTER);
      p.fill(37, 99, 168);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.text("Trade Volume (USD)", 0, 0);
      p.pop();

      // Right Y-axis (Tariff %)
      p.textAlign(p.LEFT, p.CENTER);
      p.fill(153, 153, 153);
      for (let t = 0; t <= 5; t++) {
        const val = (maxTariff / 5) * t;
        const yPos = p.map(val, 0, maxTariff, marginT + chartH, marginT);
        p.text(val.toFixed(0) + "%", marginL + chartW + 8, yPos);
      }

      // Y-axis label (right)
      p.push();
      p.translate(p.width - 35, marginT + chartH/2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.CENTER);
      p.fill(217, 119, 6);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.text("Tariff Rate", 0, 0);
      p.pop();

      // X-axis labels
      p.noStroke();
      p.fill(102, 102, 102);
      p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        p.text(r.year, x, marginT + chartH + 10);
      });

      // Tariff bars (subtle, behind lines)
      p.noStroke();
      p.fill(217, 119, 6, 50);
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        const y = p.map(r.tariff_prev_year, 0, maxTariff, marginT + chartH, marginT);
        const h = marginT + chartH - y;
        p.rect(x - 8, y, 16, h, 3);
      });

      // Import line (bold, front)
      p.noFill();
      p.stroke(37, 99, 168);
      p.strokeWeight(3);
      p.beginShape();
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        const y = p.map(r.import_value, 0, maxTrade, marginT + chartH, marginT);
        p.vertex(x, y);
      });
      p.endShape();

      // Import points
      p.noStroke();
      p.fill(37, 99, 168);
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        const y = p.map(r.import_value, 0, maxTrade, marginT + chartH, marginT);
        p.circle(x, y, 7);
      });

      // Export line
      p.noFill();
      p.stroke(245, 158, 11);
      p.strokeWeight(3);
      p.beginShape();
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        const y = p.map(r.export_value, 0, maxTrade, marginT + chartH, marginT);
        p.vertex(x, y);
      });
      p.endShape();

      // Export points
      p.noStroke();
      p.fill(245, 158, 11);
      rows.forEach(r => {
        const x = p.map(r.year, years[0], years.at(-1), marginL, marginL + chartW);
        const y = p.map(r.export_value, 0, maxTrade, marginT + chartH, marginT);
        p.circle(x, y, 7);
      });

      // Legend
      const legX = marginL + chartW - 180;
      const legY = marginT + 20;
      
      p.fill(255, 255, 255, 240);
      p.stroke(229, 229, 229);
      p.strokeWeight(1);
      p.rect(legX, legY, 170, 90, 6);
      
      p.noStroke();
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(12);
      
      // Imports
      p.fill(37, 99, 168);
      p.rect(legX + 15, legY + 20, 24, 4, 2);
      p.fill(26, 26, 26);
      p.text("Imports", legX + 48, legY + 22);
      
      // Exports
      p.fill(245, 158, 11);
      p.rect(legX + 15, legY + 45, 24, 4, 2);
      p.fill(26, 26, 26);
      p.text("Exports", legX + 48, legY + 47);
      
      // Tariffs
      p.fill(217, 119, 6, 100);
      p.rect(legX + 15, legY + 70, 24, 8, 2);
      p.fill(26, 26, 26);
      p.text("Tariff Rate", legX + 48, legY + 72);
    }
  };
})();
