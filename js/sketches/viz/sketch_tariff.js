(function () {
  window.sketch_tariff = {
    selectedYear: "2023",
    _controlsSetup: false,

    data: [
      { country: "CHN", imports_2023: 120, imports_2024: 135, imports_2025: 150, exports_2023: 80, exports_2024: 88, exports_2025: 95 },
      { country: "MEX", imports_2023: 90, imports_2024: 100, imports_2025: 110, exports_2023: 70, exports_2024: 78, exports_2025: 85 },
      { country: "CAN", imports_2023: 100, imports_2024: 110, imports_2025: 120, exports_2023: 60, exports_2024: 68, exports_2025: 75 },
      { country: "DEU", imports_2023: 80, imports_2024: 88, imports_2025: 95, exports_2023: 50, exports_2024: 58, exports_2025: 65 },
      { country: "JPN", imports_2023: 110, imports_2024: 120, imports_2025: 130, exports_2023: 90, exports_2024: 98, exports_2025: 105 },
      { country: "BRA", imports_2023: 95, imports_2024: 105, imports_2025: 115, exports_2023: 70, exports_2024: 78, exports_2025: 85 },
      { country: "GBR", imports_2023: 105, imports_2024: 115, imports_2025: 125, exports_2023: 75, exports_2024: 83, exports_2025: 90 },
      { country: "IND", imports_2023: 115, imports_2024: 130, imports_2025: 140, exports_2023: 85, exports_2024: 93, exports_2025: 100 },
      { country: "NGA", imports_2023: 70, imports_2024: 78, imports_2025: 85, exports_2023: 45, exports_2024: 53, exports_2025: 60 },
      { country: "KOR", imports_2023: 125, imports_2024: 135, imports_2025: 145, exports_2023: 95, exports_2024: 103, exports_2025: 110 }
    ],

    setupControls: function (p) {
      if (this._controlsSetup) return;

      this.buttons = [
        { year: "2023", x: 50, y: 20, w: 60, h: 28 },
        { year: "2024", x: 120, y: 20, w: 60, h: 28 },
        { year: "2025", x: 190, y: 20, w: 60, h: 28 }
      ];

      p.mouseClicked = () => {
        this.buttons.forEach(btn => {
          if (p.mouseX >= btn.x && p.mouseX <= btn.x + btn.w &&
              p.mouseY >= btn.y && p.mouseY <= btn.y + btn.h) {
            this.selectedYear = btn.year;
          }
        });
      };

      this._controlsSetup = true;
    },

    draw: function (p) {
      if (!this._controlsSetup) this.setupControls(p);

      const margin = { top: 100, right: 50, bottom: 80, left: 70 };
      const chartW = 900 - margin.left - margin.right;
      const chartH = 500 - margin.top - margin.bottom;

      p.background(255);
      p.textAlign(p.CENTER, p.CENTER);

      // Title
      p.textSize(18);
      p.fill(0);
      p.text("Imports and Exports of Different Countries (2023–2025)", 450, 45);

      // Subtitle for 2025
      if (this.selectedYear === "2025") {
        p.textSize(16);
        p.fill("#cc0000");
        p.text("Tariffs have been placed", 450, 75);
      }

      // Draw buttons
      this.buttons.forEach(b => {
        p.fill(this.selectedYear === b.year ? "#aac4ff" : "#eaeaea");
        p.stroke(0);
        p.rect(b.x, b.y, b.w, b.h, 5);
        p.noStroke();
        p.fill(0);
        p.textSize(14);
        p.text(b.year, b.x + b.w / 2, b.y + b.h / 2);
      });

      const data = this.data;
      const xStep = chartW / data.length;
      const barW = xStep * 0.55;

      const maxVal = p.max(data.map(d =>
        d[`imports_${this.selectedYear}`] + d[`exports_${this.selectedYear}`]
      ));

      // Bars
      data.forEach((d, i) => {
        const x = margin.left + i * xStep + xStep * 0.2;
        const yBase = margin.top + chartH;

        const imp = d[`imports_${this.selectedYear}`];
        const exp = d[`exports_${this.selectedYear}`];

        const impH = (imp / maxVal) * chartH;
        const expH = (exp / maxVal) * chartH;

        // Imports
        p.fill("#1f77b4");
        p.rect(x, yBase - impH, barW, impH);
        p.fill(255);
        p.text(imp, x + barW / 2, yBase - impH / 2);

        // Exports
        p.fill("#ff7f0e");
        p.rect(x, yBase - impH - expH, barW, expH);
        p.fill(255);
        p.text(exp, x + barW / 2, yBase - impH - expH / 2);

        // Country label
        p.fill(0);
        p.textSize(12);
        p.text(d.country, x + barW / 2, yBase + 15);
      });

      // Grid lines + Y labels
      p.stroke(200);
      for (let i = 0; i <= 5; i++) {
        const y = margin.top + (chartH / 5) * i;
        p.line(margin.left, y, 900 - margin.right, y);

        p.noStroke();
        p.fill(0);
        p.text(Math.round(maxVal * (1 - i / 5)), margin.left - 35, y);
        p.stroke(200);
      }

      // Legend
      p.noStroke();
      p.fill("#1f77b4");
      p.rect(70, 70, 20, 20);
      p.fill(0);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("imports", 95, 80);

      p.fill("#ff7f0e");
      p.rect(170, 70, 20, 20);
      p.fill(0);
      p.text("exports", 195, 80);
    }
  };
})();










   