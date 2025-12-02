(function() {
  var GDPStackedBar = function(p) {
    // ------------------------------
    // Variables
    // -----------------------------
    p.top10CountriesByYear = {
      "2024": {
        "United States": {
          imports: 3966000000000,
          exports: 2080000000000,
          totalTrade: 6046000000000
        },
        "China": {
          imports: 3127000000000,
          exports: 3580000000000,
          totalTrade: 6707000000000
        },
        "Germany": {
          imports: 1914000000000,
          exports: 1684000000000,
          totalTrade: 3598000000000
        },
        "Netherlands": {
          imports: 825000000000,
          exports: 850000000000,
          totalTrade: 1675000000000
        },
        "Japan": {
          imports: 786000000000,
          exports: 707390000000,
          totalTrade: 1493390000000
        },
        "United Kingdom": {
          imports: 791000000000,
          exports: 650000000000,
          totalTrade: 1441000000000
        },
        "France": {
          imports: 786000000000,
          exports: 640000000000,
          totalTrade: 1426000000000
        },
        "South Korea": {
          imports: 643000000000,
          exports: 683800000000,
          totalTrade: 1326800000000
        },
        "India": {
          imports: 718000000000,
          exports: 550000000000,
          totalTrade: 1268000000000
        },
        "Italy": {
          imports: 760000000000,
          exports: 500000000000,
          totalTrade: 1260000000000
        }
      },
      "2023": {
        "United States": {
          imports: 3170000000000,
          exports: 3050000000000,
          totalTrade: 6220000000000
        },
        "China": {
          imports: 2900000000000,
          exports: 3510000000000,
          totalTrade: 6410000000000
        },
        "Germany": {
          imports: 1800000000000,
          exports: 1600000000000,
          totalTrade: 3400000000000
        },
        "Netherlands": {
          imports: 800000000000,
          exports: 820000000000,
          totalTrade: 1620000000000
        },
        "Japan": {
          imports: 750000000000,
          exports: 700000000000,
          totalTrade: 1450000000000
        },
        "United Kingdom": {
          imports: 770000000000,
          exports: 1070000000000,
          totalTrade: 1840000000000
        },
        "France": {
          imports: 750000000000,
          exports: 1050000000000,
          totalTrade: 1800000000000
        },
        "South Korea": {
          imports: 630000000000,
          exports: 650000000000,
          totalTrade: 1280000000000
        },
        "India": {
          imports: 700000000000,
          exports: 530000000000,
          totalTrade: 1230000000000
        },
        "Italy": {
          imports: 720000000000,
          exports: 480000000000,
          totalTrade: 1200000000000
        }
      },
      "2022": {
        "United States": {
          imports: 3200000000000,
          exports: 2100000000000,
          totalTrade: 5300000000000
        },
        "China": {
          imports: 2700000000000,
          exports: 3590000000000,
          totalTrade: 6290000000000
        },
        "Germany": {
          imports: 1750000000000,
          exports: 1550000000000,
          totalTrade: 3300000000000
        },
        "Netherlands": {
          imports: 780000000000,
          exports: 800000000000,
          totalTrade: 1580000000000
        },
        "Japan": {
          imports: 730000000000,
          exports: 680000000000,
          totalTrade: 1410000000000
        },
        "United Kingdom": {
          imports: 750000000000,
          exports: 620000000000,
          totalTrade: 1370000000000
        },
        "France": {
          imports: 720000000000,
          exports: 600000000000,
          totalTrade: 1320000000000
        },
        "South Korea": {
          imports: 615000000000,
          exports: 635000000000,
          totalTrade: 1250000000000
        },
        "India": {
          imports: 650000000000,
          exports: 500000000000,
          totalTrade: 1150000000000
        },
        "Italy": {
          imports: 690000000000,
          exports: 460000000000,
          totalTrade: 1150000000000
        }
      }
    }; 
    p.countries = [];
    p.years = [2022, 2023, 2024];
    p.selectedYear = 2024;
    p.showing = "imports"; // "imports" or "exports"
    p.yearSelect = null;
    p.toggleButton = null;
    p._controlsSetup = false;

    // Colors
    p.importColor = '#113EA7'; // Blue
    p.exportColor = '#F57A00'; // Orange

    // ------------------------------
    // Helper Functions
    // ------------------------------
    p.toggleData = function() {
      if (p.showing === "imports") {
        p.showing = "exports";
        p.toggleButton.html('Switch to Imports');
      } else {
        p.showing = "imports";
        p.toggleButton.html('Switch to Exports');
      }
      p.redraw();
    };

    p.getTop10ForYear = function(year) {
      const yearData = p.top10CountriesByYear[year.toString()];
      if (!yearData) return [];

      const countries = [];
      for (const country in yearData) {
        const data = yearData[country];
        countries.push({
          country: country,
          imports: data.imports,
          exports: data.exports,
          totalTrade: data.totalTrade
        });
      }

      // Sort by total trade
      countries.sort((a, b) => b.totalTrade - a.totalTrade);
      return countries.slice(0, 10);
    };

    p.setupControls = function() {
      if (p._controlsSetup) return;

      const container = document.getElementById("viz-container-3");
      if (!container) {
        console.error("viz-container-3 not found");
        return;
      }

      // Create controls wrapper below canvas
      const controlsWrapper = document.createElement("div");
      controlsWrapper.style.textAlign = "center";
      controlsWrapper.style.marginTop = "16px";
      controlsWrapper.style.display = "flex";
      controlsWrapper.style.justifyContent = "center";
      controlsWrapper.style.gap = "16px";
      container.appendChild(controlsWrapper);

      // Year selector
      p.yearSelect = p.createSelect();
      p.years.forEach((y) => p.yearSelect.option(y));
      p.yearSelect.selected(p.selectedYear);
      p.yearSelect.parent(controlsWrapper);
      p.yearSelect.addClass("form-select");
      p.yearSelect.style("width", "120px");
      p.yearSelect.changed(() => {
        p.selectedYear = parseInt(p.yearSelect.value());
        p.redraw();
      });

      // Toggle button
      p.toggleButton = p.createButton('Switch to Exports');
      p.toggleButton.parent(controlsWrapper);
      p.toggleButton.addClass("btn");
      p.toggleButton.mousePressed(p.toggleData);

      p._controlsSetup = true;
    };

    p.formatValue = function(value) {
      if (value >= 1e12) {
        return "$" + (value / 1e12).toFixed(2) + "T";
      } else if (value >= 1e9) {
        return "$" + (value / 1e9).toFixed(2) + "B";
      } else if (value >= 1e6) {
        return "$" + (value / 1e6).toFixed(2) + "M";
      }
      return "$" + value.toFixed(0);
    };

    p.drawYAxis = function(maxVal, margin, chartHeight) {
      const yAxisX = margin - 60;
      const chartBottom = p.height - margin;
      const chartTop = margin + 60;

      // Y-axis line
      p.stroke(200);
      p.strokeWeight(2);
      p.line(yAxisX, chartTop, yAxisX, chartBottom);

      // Ticks and labels
      p.textFont('Inter');
      p.textSize(11);
      p.fill(102, 102, 102);
      p.textAlign(p.RIGHT, p.CENTER);
      p.textStyle(p.NORMAL);

      const numTicks = 5;
      for (let i = 0; i <= numTicks; i++) {
        const tickValue = (maxVal / numTicks) * i;
        const yPos = p.map(tickValue, 0, maxVal, chartBottom, chartTop);
        
        // Tick mark
        p.stroke(200);
        p.line(yAxisX - 5, yPos, yAxisX, yPos);
        
        // Label
        p.noStroke();
        p.text(p.formatValue(tickValue), yAxisX - 10, yPos);
      }
    };

    // ------------------------------
    // p5 Setup & Draw
    // ------------------------------
    p.setup = function() {
      const canvas = p.createCanvas(1200, 600);
      canvas.parent("viz-container-3");
      canvas.style("position", "relative");
      canvas.style("display", "block");
      canvas.style("margin", "0 auto");
      
      p.setupControls();
    };

    p.draw = function() {
      p.background("#fafafa");

      if (!p._controlsSetup) p.setupControls();

      // Get data for selected year
      const top10 = p.getTop10ForYear(p.selectedYear);
      if (top10.length === 0) {
        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Inter');
        p.textSize(16);
        p.text("No data available for " + p.selectedYear, p.width / 2, p.height / 2);
        return;
      }

      const margin = 120;
      const chartWidth = p.width - 2 * margin;
      const chartHeight = p.height - 2 * margin - 60;
      const barWidth = (chartWidth / top10.length) * 0.6;

      // Set max value to 4 trillion
      const maxVal = 4000000000000; // 4 trillion

      // Title
      p.textFont('Spectral');
      p.textSize(28);
      p.textStyle(p.BOLD);
      p.fill(26, 26, 26);
      p.textAlign(p.LEFT, p.TOP);
      const title = p.showing === "imports" 
        ? `Top 10 Countries by Imports (${p.selectedYear})`
        : `Top 10 Countries by Exports (${p.selectedYear})`;
      p.text(title, margin, 30);

      // Draw Y-axis
      p.drawYAxis(maxVal, margin, chartHeight);

      // Draw bars
      const chartBottom = p.height - margin;
      const chartTop = margin + 60;
      const barColor = p.showing === "imports" ? p.importColor : p.exportColor;

      for (let i = 0; i < top10.length; i++) {
        const d = top10[i];
        const value = p.showing === "imports" ? d.imports : d.exports;
        const x = margin + i * (chartWidth / top10.length) + (chartWidth / top10.length - barWidth) / 2;
        const barHeight = p.map(value, 0, maxVal, 0, chartHeight);

        // Draw bar
        p.fill(barColor);
        p.noStroke();
        p.rect(x, chartBottom - barHeight, barWidth, barHeight);

        // Value on top of bar
        p.fill(26, 26, 26);
        p.textFont('Inter');
        p.textSize(10);
        p.textStyle(p.NORMAL);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text(p.formatValue(value), x + barWidth / 2, chartBottom - barHeight - 5);

        // Country label
        p.fill(0);
        p.textSize(12);
        p.textAlign(p.CENTER, p.TOP);
        p.push();
        p.translate(x + barWidth / 2, chartBottom + 10);
        p.rotate(-p.PI / 6); // Angle labels for better fit
        p.text(d.country, 0, 0);
        p.pop();
      }

      // Legend
      const legendX = margin;
      const legendY = 70;
      
      p.fill(barColor);
      p.rect(legendX, legendY, 20, 12);
      
      p.fill(26, 26, 26);
      p.textFont('Inter');
      p.textSize(13);
      p.textStyle(p.NORMAL);
      p.textAlign(p.LEFT, p.CENTER);
      const legendText = p.showing === "imports" ? "Imports" : "Exports";
      p.text(legendText, legendX + 26, legendY + 6);
    };
  };

  // Export to window
  window.GDPStackedBar = GDPStackedBar;
})();
