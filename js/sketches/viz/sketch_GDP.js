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
        () => console.error("Failed to load CSV")
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
            yoy_trade_balance: Number(row.get("yoy_trade_balance")) || 0,
          };
        } else {
          this.dataMap[country][year].gdp_usd += Number(row.get("gdp_usd")) || 0;
          this.dataMap[country][year].yoy_trade_balance += Number(row.get("yoy_trade_balance")) || 0;
        }

        if (!this.countries.includes(country)) this.countries.push(country);
      }

      this.countries.sort();
      console.log("Countries after aggregation:", this.countries);
    },

  setupControls(p) {
    if (this._controlsSetup || !this._dataLoaded) return;

    // Left-hand narrative section for this step
    this.sectionEl = document.querySelector('section[data-active-index="5"]');
    if (!this.sectionEl) {
      console.error("Section 5 not found");
      return;
    }
    this.sectionEl.style.position = "relative";
    this.sectionEl.style.minHeight = "650px";

    // Shared right-hand visualization container (#vis)
    const visContainer = document.getElementById("vis");
    if (!visContainer) {
      console.error(" #vis container not found");
      return;
    }

    // Make #vis stack children vertically and center them
    visContainer.innerHTML = "";                     // clear any previous sketch
    visContainer.style.display = "flex";
    visContainer.style.flexDirection = "column";     // dropdown on top, canvas below
    visContainer.style.alignItems = "center";
    visContainer.style.justifyContent = "center";

    // Dropdown goes in #vis, above the canvas
    this.dropdown = p.createSelect();
    this.dropdown.option("-- Select a Country --");
    this.countries.forEach((c) => this.dropdown.option(c));
    this.dropdown.parent(visContainer);
    this.dropdown.addClass("form-select");
    this.dropdown.style("margin-bottom", "16px");
    this.dropdown.style("width", "260px");

    this.dropdown.changed(() => p.redraw());

    // Canvas goes in the same #vis container, under the dropdown
    this.canvas = p.createCanvas(900, 500);
    this.canvas.parent(visContainer);
    this.canvas.style("display", "block");
    this.canvas.style("margin", "0 auto");

    this._controlsSetup = true;
  },

    draw(p) {
      if (!this._controlsSetup || !this._dataLoaded) return;
      if (!this.sectionEl) return;

      // Show / hide dropdown based on whether this step is on screen
      const rect = this.sectionEl.getBoundingClientRect();
      const sectionVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (sectionVisible) this.dropdown.show();
      else this.dropdown.hide();

    // Elegant gradient background
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

      if (!this.dropdown || !this.countries.length) {
        p.textAlign(p.LEFT, p.TOP);
        p.text("Loading GDP data...", 20, 40);
        return;
      }

      let country = this.dropdown.value();
      if (!country || country === "-- Select a Country --") {
        p.fill(0);
        p.textAlign(p.LEFT, p.TOP);
        p.text("Select a country to view data", 20, 40);
        return;
      }

      let before = this.dataMap[country]?.[2022] || { gdp_usd: 0, yoy_trade_balance: 0 };
      let after = this.dataMap[country]?.[2024] || { gdp_usd: 0, yoy_trade_balance: 0 };

      before.gdp_usd = Number(before.gdp_usd) || 0;
      before.yoy_trade_balance = Number(before.yoy_trade_balance) || 0;
      after.gdp_usd = Number(after.gdp_usd) || 0;
      after.yoy_trade_balance = Number(after.yoy_trade_balance) || 0;

      if (before.gdp_usd === 0 && after.gdp_usd === 0) {
        p.textAlign(p.CENTER, p.CENTER);
        p.text("No GDP data available for this country", p.width / 2, p.height / 2);
        return;
      }
      
      // title
      p.textFont('Spectral');
      p.textSize(20);
      p.textStyle(p.BOLD);
      p.fill(0);
      p.textAlign(p.CENTER);
      p.text(`GDP of ${country} Before and After Tariff`, p.width / 2, 30);

      // --- Legend ---
      const legendX = 60;
      const legendY = 70;
      const spacing = 220;

      p.rectMode(p.CORNER);

      p.fill("#113EA7");
      p.rect(legendX, legendY, 15, 15);
      p.fill(0);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("GDP (USD)", legendX + 22, legendY + 7.5);

      p.fill("#5DD548");
      p.rect(legendX + spacing, legendY, 15, 15);
      p.fill(0);
      p.text("Trade Balance ↑", legendX + spacing + 22, legendY + 7.5);

      p.fill("#FC3640");
      p.rect(legendX + spacing * 2, legendY, 15, 15);
      p.fill(0);
      p.text("Trade Balance ↓", legendX + spacing * 2 + 22, legendY + 7.5);

      // --- Bars ---
      let maxVal = Math.max(before.gdp_usd, after.gdp_usd);
      let barWidth = 60;
      let minBarHeight = 12;
      let bars = [];

      const chartBottom = p.height - 80;
      const chartTop = chartBottom - 260;

      // BEFORE 2022
      let xBefore = p.width / 3;
      let hGDPBefore = p.map(before.gdp_usd, 0, maxVal, 0, chartBottom - chartTop);
      if (hGDPBefore < minBarHeight && before.gdp_usd > 0) hGDPBefore = minBarHeight;

      p.fill("#113EA7");
      p.rect(
        xBefore - barWidth / 2,
        chartBottom - hGDPBefore,
        barWidth,
        hGDPBefore
      );
      bars.push({
        x: xBefore - barWidth / 2,
        y: chartBottom - hGDPBefore,
        w: barWidth,
        h: hGDPBefore,
        label: `GDP: ${before.gdp_usd.toLocaleString()}`
      });

      // Trade balance above bar
      const roundedBeforeTB = Math.round(before.yoy_trade_balance * 10) / 10;
      p.fill(roundedBeforeTB >= 0 ? "#5DD548" : "#FC3640");
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(
        `Trade Balance: ${roundedBeforeTB}`,
        xBefore,
        chartBottom - hGDPBefore - 10
      );
      p.fill(0);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Before Tariff (2022)", xBefore, chartBottom + 10);

      // AFTER 2024
      let xAfter = (2 * p.width) / 3;
      let hGDPAftr = p.map(after.gdp_usd, 0, maxVal, 0, chartBottom - chartTop);
      if (hGDPAftr < minBarHeight && after.gdp_usd > 0) hGDPAftr = minBarHeight;

      p.fill("#113EA7");
      p.rect(
        xAfter - barWidth / 2,
        chartBottom - hGDPAftr,
        barWidth,
        hGDPAftr
      );
      bars.push({
        x: xAfter - barWidth / 2,
        y: chartBottom - hGDPAftr,
        w: barWidth,
        h: hGDPAftr,
        label: `GDP: ${after.gdp_usd.toLocaleString()}`
      });

      const roundedAfterTB = Math.round(after.yoy_trade_balance * 10) / 10;
      p.fill(roundedAfterTB >= 0 ? "#5DD548" : "#FC3640");
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(
        `Trade Balance: ${roundedAfterTB}`,
        xAfter,
        chartBottom - hGDPAftr - 10
      );
      p.fill(0);
      p.textAlign(p.CENTER, p.TOP);
      p.text("After Tariff (2024)", xAfter, chartBottom + 10);

      // --- Hover tooltips ---
      bars.forEach((b) => {
        if (
          p.mouseX > b.x && p.mouseX < b.x + b.w &&
          p.mouseY > b.y && p.mouseY < b.y + b.h
        ) {
          p.fill(255, 255, 230);
          p.stroke(0);
          const pad = 6;
          const tw = p.textWidth(b.label);
          p.rect(p.mouseX + 10, p.mouseY - 24, tw + pad * 2, 20, 4);
          p.noStroke();
          p.fill(0);
          p.textAlign(p.LEFT, p.CENTER);
          p.text(b.label, p.mouseX + 10 + pad, p.mouseY - 14);
        }
      });
    },
  };
})();