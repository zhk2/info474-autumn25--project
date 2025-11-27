(function() {
  // Use your exact data
  window.sketch_tariff = {
    selectedYear: 2023,
    _controlsSetup: false,
    data: [
      { country: "CHN", imports_2023: 120, imports_2024: 135, imports_2025: 150, exports_2023: 80, exports_2024: 88, exports_2025: 95, tariff_added: "10%", tariff_year: 2025 },
      { country: "MEX", imports_2023: 90, imports_2024: 100, imports_2025: 110, exports_2023: 70, exports_2024: 78, exports_2025: 85, tariff_added: "5%", tariff_year: 2025 },
      { country: "CAN", imports_2023: 100, imports_2024: 110, imports_2025: 120, exports_2023: 60, exports_2024: 68, exports_2025: 75, tariff_added: "7%", tariff_year: 2025 },
      { country: "DEU", imports_2023: 80, imports_2024: 88, imports_2025: 95, exports_2023: 50, exports_2024: 58, exports_2025: 65, tariff_added: "12%", tariff_year: 2025 },
      { country: "JPN", imports_2023: 110, imports_2024: 120, imports_2025: 130, exports_2023: 90, exports_2024: 98, exports_2025: 105, tariff_added: "8%", tariff_year: 2025 },
      { country: "BRA", imports_2023: 95, imports_2024: 105, imports_2025: 115, exports_2023: 70, exports_2024: 78, exports_2025: 85, tariff_added: "6%", tariff_year: 2025 },
      { country: "GBR", imports_2023: 105, imports_2024: 115, imports_2025: 125, exports_2023: 75, exports_2024: 83, exports_2025: 90, tariff_added: "9%", tariff_year: 2025 },
      { country: "IND", imports_2023: 115, imports_2024: 130, imports_2025: 140, exports_2023: 85, exports_2024: 93, exports_2025: 100, tariff_added: "11%", tariff_year: 2025 },
      { country: "NGA", imports_2023: 70, imports_2024: 78, imports_2025: 85, exports_2023: 45, exports_2024: 53, exports_2025: 60, tariff_added: "4%", tariff_year: 2025 },
      { country: "KOR", imports_2023: 125, imports_2024: 135, imports_2025: 145, exports_2023: 95, exports_2024: 103, exports_2025: 110, tariff_added: "10%", tariff_year: 2025 }
    ],

    // Setup year toggle buttons, robust version
    setupControls: function(p) {
      if (this._controlsSetup) return;

      // Attach container to canvas parent
      const canvasParent = p.canvas.parentNode || document.body;
      const container = p.createDiv();
      container.parent(canvasParent);
      container.style('display', 'flex');
      container.style('gap', '10px');
      container.style('margin-bottom', '10px');

      ['2023', '2024', '2025'].forEach((year) => {
        const btn = p.createButton(year);
        btn.parent(container);
        btn.mousePressed(() => {
          this.selectedYear = year;
          p.redraw();
        });
      });

      this._controlsSetup = true;
    },

    draw: function(p, manager) {
      const margin = { top: 100, right: 50, bottom: 80, left: 60 }; // more top margin for title
      const chartWidth = 900 - margin.left - margin.right;
      const chartHeight = 500 - margin.top - margin.bottom;

      p.push();
      p.background(255);
      p.textFont('Arial');
      p.textAlign(p.CENTER, p.CENTER);

      // --- Title ---
      p.fill(0);
      p.textSize(20);
      p.text("Imports and Exports of Different Countries 2023-2025", margin.left + chartWidth/2, 30);

      // --- Tariff note for 2025 ---
      if (this.selectedYear === '2025') {
        p.fill('#d62728'); // red
        p.textSize(16);
        p.text("Tariffs have been placed", margin.left + chartWidth/2, 60);
      }

      const data = this.data;
      const selectedYear = this.selectedYear;

      const barCount = data.length;
      const xStep = chartWidth / barCount;
      const barWidth = xStep * 0.6;

      const maxValue = p.max(data.map(d => d['imports_' + selectedYear] + d['exports_' + selectedYear]));

      // Draw stacked bars
      data.forEach((d, i) => {
        const x = margin.left + i * xStep + xStep * 0.2;
        const y = margin.top + chartHeight;

        const importsVal = d['imports_' + selectedYear];
        const exportsVal = d['exports_' + selectedYear];

        const importsHeight = (importsVal / maxValue) * chartHeight;
        p.fill('#1f77b4');
        p.rect(x, y - importsHeight, barWidth, importsHeight);
        p.fill(255);
        p.text(importsVal, x + barWidth / 2, y - importsHeight / 2);

        const exportsHeight = (exportsVal / maxValue) * chartHeight;
        p.fill('#ff7f0e');
        p.rect(x, y - importsHeight - exportsHeight, barWidth, exportsHeight);
        p.fill(255);
        p.text(exportsVal, x + barWidth / 2, y - importsHeight - exportsHeight / 2);

        // Country labels
        p.fill(0);
        p.text(d.country, x + barWidth / 2, y + 15);
      });

      // Y axis lines and labels
      p.stroke(200);
      p.strokeWeight(1);
      for (let i = 0; i <= 5; i++) {
        const yPos = margin.top + (chartHeight / 5) * i;
        p.line(margin.left, yPos, 900 - margin.right, yPos);
        p.noStroke();
        p.fill(0);
        p.text(Math.round(maxValue * (1 - i / 5)), margin.left - 30, yPos);
        p.stroke(200);
      }

      // Legend
      const legendX = margin.left;
      const legendY = 70;

      p.fill('#1f77b4');
      p.rect(legendX, legendY, 20, 20);
      p.fill(0);
      p.textAlign(p.LEFT, p.CENTER);
      p.text('imports', legendX + 25, legendY + 10);

      p.fill('#ff7f0e');
      p.rect(legendX + 120, legendY, 20, 20);
      p.fill(0);
      p.text('exports', legendX + 145, legendY + 10);

      p.pop();
    }
  };
})();






