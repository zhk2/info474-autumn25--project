(function () {
  window.sketch_gdp = {
    selectedYear: "2023",
    _controlsSetup: false,

    data: [
      { country: "CHN", gdp_2023: 18000, gdp_2024: 18800, gdp_2025: 19500 },
      { country: "MEX", gdp_2023: 1300,  gdp_2024: 1380,  gdp_2025: 1450 },
      { country: "CAN", gdp_2023: 2200,  gdp_2024: 2300,  gdp_2025: 2400 },
      { country: "DEU", gdp_2023: 4200,  gdp_2024: 4350,  gdp_2025: 4500 },
      { country: "JPN", gdp_2023: 5000,  gdp_2024: 5100,  gdp_2025: 5250 },
      { country: "BRA", gdp_2023: 1900,  gdp_2024: 2000,  gdp_2025: 2100 },
      { country: "GBR", gdp_2023: 3100,  gdp_2024: 3200,  gdp_2025: 3300 },
      { country: "IND", gdp_2023: 3500,  gdp_2024: 3800,  gdp_2025: 4100 },
      { country: "NGA", gdp_2023: 500,   gdp_2024: 540,   gdp_2025: 580 },
      { country: "KOR", gdp_2023: 1800,  gdp_2024: 1900,  gdp_2025: 2000 }
    ],

    setupControls: function (p) {
      if (this._controlsSetup) return;

      // Drawn *inside canvas* like sketch_tariff
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

      const margin = { top: 100, right: 50, bottom: 80, left: 70 };
      const chartWidth = 900 - margin.left - margin.right;
      const chartHeight = 500 - margin.top - margin.bottom;

      p.push();
      p.background(255);
      p.textFont("Arial");

      // === TITLE ===
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(22);
      p.fill(0);
      p.text("GDP of Different Countries 2023–2025", 450, 45);

      // === SUBTITLE WHEN TARIFFS (2025) ===
      if (this.selectedYear === "2025") {
        p.textSize(16);
        p.fill("#cc0000");
        p.text("Tariffs have been placed", 450, 70);
      }

      // === YEAR BUTTONS (in canvas) ===
      this.buttonBoxes.forEach(btn => {
        p.stroke(0);
        p.strokeWeight(1);
        p.fill(this.selectedYear === btn.year ? "#c6efc6" : "#eeeeee");
        p.rect(btn.x, btn.y, btn.w, btn.h, 5);

        p.noStroke();
        p.fill(0);
        p.textSize(14);
        p.text(btn.year, btn.x + btn.w / 2, btn.y + btn.h / 2);
      });

      // === DATA & SCALES ===
      const selectedYear = this.selectedYear;
      const data = this.data;

      const barCount = data.length;
      const xStep = chartWidth / barCount;
      const barWidth = xStep * 0.55;

      const maxValue = p.max(data.map(d => d["gdp_" + selectedYear]));

      // === DRAW BARS ===
      data.forEach((d, i) => {
        const x = margin.left + i * xStep + xStep * 0.2;
        const baseY = margin.top + chartHeight;

        const gdp = d["gdp_" + selectedYear];
        const barHeight = (gdp / maxValue) * chartHeight;

        p.fill("#2ca02c"); // green GDP bars
        p.rect(x, baseY - barHeight, barWidth, barHeight);

        // GDP label
        p.fill(255);
        p.text(
          gdp.toLocaleString(),
          x + barWidth / 2,
          baseY - barHeight / 2
        );

        // Country code label
        p.fill(0);
        p.textSize(12);
        p.text(d.country, x + barWidth / 2, baseY + 15);
      });

      // === Y GRID & LABELS ===
      p.stroke(200);
      for (let i = 0; i <= 5; i++) {
        const yPos = margin.top + (chartHeight / 5) * i;
        p.line(margin.left, yPos, 900 - margin.right, yPos);

        p.noStroke();
        p.fill(0);
        p.text(
          Math.round(maxValue * (1 - i / 5)).toLocaleString(),
          margin.left - 40,
          yPos
        );
        p.stroke(200);
      }

      p.pop();
    }
  };
})();


