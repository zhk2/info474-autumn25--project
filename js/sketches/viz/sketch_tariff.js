(function () {
  window.sketch_tariff = {
    selectedYear: "2023",
    _controlsSetup: false,

    data: [
      { country: "CHN", imports_2023: 120, imports_2024: 135, imports_2025: 150, exports_2023: 80,  exports_2024: 88,  exports_2025: 95,  tariff_added: "10%", tariff_year: 2025 },
      { country: "MEX", imports_2023: 90,  imports_2024: 100, imports_2025: 110, exports_2023: 70,  exports_2024: 78,  exports_2025: 85,  tariff_added: "5%",  tariff_year: 2025 },
      { country: "CAN", imports_2023: 100, imports_2024: 110, imports_2025: 120, exports_2023: 60,  exports_2024: 68,  exports_2025: 75,  tariff_added: "7%",  tariff_year: 2025 },
      { country: "DEU", imports_2023: 80,  imports_2024: 88,  imports_2025: 95,  exports_2023: 50,  exports_2024: 58,  exports_2025: 65,  tariff_added: "12%", tariff_year: 2025 },
      { country: "JPN", imports_2023: 110, imports_2024: 120, imports_2025: 130, exports_2023: 90,  exports_2024: 98,  exports_2025: 105, tariff_added: "8%",  tariff_year: 2025 },
      { country: "BRA", imports_2023: 95,  imports_2024: 105, imports_2025: 115, exports_2023: 70,  exports_2024: 78,  exports_2025: 85,  tariff_added: "6%",  tariff_year: 2025 },
      { country: "GBR", imports_2023: 105, imports_2024: 115, imports_2025: 125, exports_2023: 75,  exports_2024: 83,  exports_2025: 90,  tariff_added: "9%",  tariff_year: 2025 },
      { country: "IND", imports_2023: 115, imports_2024: 130, imports_2025: 140, exports_2023: 85,  exports_2024: 93,  exports_2025: 100, tariff_added: "11%", tariff_year: 2025 },
      { country: "NGA", imports_2023: 70,  imports_2024: 78,  imports_2025: 85,  exports_2023: 45,  exports_2024: 53,  exports_2025: 60,  tariff_added: "4%",  tariff_year: 2025 },
      { country: "KOR", imports_2023: 125, imports_2024: 135, imports_2025: 145, exports_2023: 95,  exports_2024: 103, exports_2025: 110, tariff_added: "10%", tariff_year: 2025 }
    ],

    setupControls: function (p) {
      if (this._controlsSetup) return;

      this.buttonBoxes = [
        { year: "2023", x: 60, y: 20, w: 60, h: 30 },
        { year: "2024", x: 130, y: 20, w: 60, h: 30 },
        { year: "2025", x: 200, y: 20, w: 60, h: 30 }
      ];

      p.mouseClicked = () => {
        this.buttonBoxes.forEach(btn => {
          if (
            p.mouseX >= btn.x &&
            p.mouseX <= btn.x + btn.w &&
            p.mouseY >= btn.y &&
            p.mouseY <= btn.y + btn.h
          ) {
            this.selectedYear = btn.year;
            p.redraw();
          }
        });
      };

      this._controlsSetup = true;
    },

    draw: function (p) {
      if (!this._controlsSetup) this.setupControls(p);

      const margin = { top: 100, right: 50, bottom: 80, left: 60 };
      const chartWidth = 900 - margin.left - margin.right;
      const chartHeight = 500 - margin.top - margin.bottom;

      p.push();
      p.background(255);

      // ---- TITLE ----
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(15);
      p.fill(0);
      p.text("Imports and Exports of Different Countries 2023–2025", 450, 45);

      // ---- SUBTITLE FOR 2025 ----
      if (this.selectedYear === "2025") {
        p.textSize(16);
        p.fill("#cc0000");
        p.text("Tariffs have been placed", 450, 70);
      }

      // ---- YEAR BUTTONS ----
      this.buttonBoxes.forEach(btn => {
        p.stroke(0);
        p.strokeWeight(1);
        p.fill(this.selectedYear === btn.year ? "#c6d4ff" : "#eeeeee");
        p.rect(btn.x, btn.y, btn.w, btn.h, 5);

        p.noStroke();
        p.fill(0);
        p.textSize(14);
        p.text(btn.year, btn.x + btn.w / 2, btn.y + btn.h / 2);
      });

      const selectedYear = this.selectedYear;
      const data = this.data;

      const xStep = chartWidth / data.length;
      const barWidth = xStep * 0.6;

      const maxValue = p.max(
        data.map(d => d[`imports_${selectedYear}`] + d[`exports_${selectedYear}`])
      );

      // ---- DRAW STACKED BARS ----
      data.forEach((d, i) => {
        const x = margin.left + i * xStep + xStep * 0.2;
        const baseY = margin.top + chartHeight;

        const imp = d[`imports_${selectedYear}`];
        const exp = d[`exports_${selectedYear}`];

        const impH = (imp / maxValue) * chartHeight;
        const expH = (exp / maxValue) * chartHeight;

        // Imports
        p.fill("#1f77b4");
        p.rect(x, baseY - impH, barWidth, impH);
        p.fill(255);
        p.text(imp, x + barWidth / 2, baseY - impH / 2);

        // Exports stacked on top
        p.fill("#ff7f0e");
        p.rect(x, baseY - impH - expH, barWidth, expH);
        p.fill(255);
        p.text(exp, x + barWidth / 2, baseY - impH - expH / 2);

        // Country labels
        p.fill(0);
        p.textSize(12);
        p.text(d.country, x + barWidth / 2, baseY + 15);
      });

      // ---- Y GRID LINES ----
      p.stroke(200);
      for (let i = 0; i <= 5; i++) {
        const yPos = margin.top + (chartHeight / 5) * i;
        p.line(margin.left, yPos, 900 - margin.right, yPos);
        p.noStroke();
        p.fill(0);
        p.text(Math.round(maxValue * (1 - i / 5)), margin.left - 30, yPos);
        p.stroke(200);
      }

      // ---- LEGEND ----
      const lx = margin.left;
      const ly = 70;

      p.fill("#1f77b4");
      p.rect(lx, ly, 20, 20);
      p.fill(0);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("imports", lx + 30, ly + 10);

      p.fill("#ff7f0e");
      p.rect(lx + 140, ly, 20, 20);
      p.fill(0);
      p.text("exports", lx + 170, ly + 10);

      p.pop();
    }
  };
})();









   