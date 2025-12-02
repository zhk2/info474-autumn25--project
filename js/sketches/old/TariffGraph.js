// deprecated

(function() {
  let TariffGraph = function(p) {
    let selectedYear = 2023;
    let yearSelect;
    
    let data = [
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
    ];

    p.setup = function() {
      let canvas = p.createCanvas(900, 500);

      // Year selector
      yearSelect = p.createSelect();
      yearSelect.position(50, 20);
      for (let y = 2023; y <= 2025; y++) {
        yearSelect.option(y);
      }
      yearSelect.changed(() => {
        selectedYear = p.int(yearSelect.value());
      });

      canvas.parent('viz-container-3'); 
    };

    p.draw = function() {
      const margin = { top: 100, right: 50, bottom: 80, left: 70 };
      const chartW = p.width - margin.left - margin.right;
      const chartH = p.height - margin.top - margin.bottom;

      p.background(255);
      p.textAlign(p.CENTER, p.CENTER);

      // Title
      p.textSize(15);
      p.fill(0);
      p.text("Imports and Exports of Different Countries (2023–2025)", p.width / 2, 45);

      // Subtitle for 2025
      if (selectedYear === 2025) {
        p.textSize(16);
        p.fill("#cc0000");
        p.text("Tariffs have been placed", p.width / 2, 75);
      }

      const xStep = chartW / data.length;
      const barW = xStep * 0.55;

      const maxVal = p.max(data.map(d =>
        d[`imports_${selectedYear}`] + d[`exports_${selectedYear}`]
      ));

      // Bars
      p.textSize(12);
      data.forEach((d, i) => {
        const x = margin.left + i * xStep + xStep * 0.2;
        const yBase = margin.top + chartH;

        const imp = d[`imports_${selectedYear}`];
        const exp = d[`exports_${selectedYear}`];

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
        p.text(d.country, x + barW / 2, yBase + 15);
      });

      // Grid lines + Y labels
      p.stroke(200);
      for (let i = 0; i <= 5; i++) {
        const y = margin.top + (chartH / 5) * i;
        p.line(margin.left, y, p.width - margin.right, y);

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
    };
  };

  window.TariffGraph = TariffGraph;
})();