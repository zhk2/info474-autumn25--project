// Deprecated

(function() {
  let GDPBar = function(p) {
    // Declare all variables at the top
    let selectedYear = 2023;
    let yearSelect;
    let data = [
      { country: "CHN", gdp_2023: 18000, gdp_2024: 18800, gdp_2025: 19500 },
      { country: "MEX", gdp_2023: 1300, gdp_2024: 1380, gdp_2025: 1450 },
      { country: "CAN", gdp_2023: 2200, gdp_2024: 2300, gdp_2025: 2400 },
      { country: "DEU", gdp_2023: 4200, gdp_2024: 4350, gdp_2025: 4500 },
      { country: "JPN", gdp_2023: 5000, gdp_2024: 5100, gdp_2025: 5250 },
      { country: "BRA", gdp_2023: 1900, gdp_2024: 2000, gdp_2025: 2100 },
      { country: "GBR", gdp_2023: 3100, gdp_2024: 3200, gdp_2025: 3300 },
      { country: "IND", gdp_2023: 3500, gdp_2024: 3800, gdp_2025: 4100 },
      { country: "NGA", gdp_2023: 500, gdp_2024: 540, gdp_2025: 580 },
      { country: "KOR", gdp_2023: 1800, gdp_2024: 1900, gdp_2025: 2000 }
    ];

    p.setup = function() {
      let canvas = p.createCanvas(900, 500);
      
      // Year selector
      yearSelect = p.createSelect();
      yearSelect.position(50, 50);
      for (let y = 2023; y <= 2025; y++) {
        yearSelect.option(y);
      }
      yearSelect.changed(() => {
        selectedYear = p.int(yearSelect.value());
      });

      canvas.parent('viz-container-0'); // or whatever container you want
    };
    
    p.draw = function() {
      const margin = { top: 90, right: 50, bottom: 80, left: 70 };
      const chartWidth = p.width - margin.left - margin.right;
      const chartHeight = p.height - margin.top - margin.bottom;

      p.background(255);
      p.textFont("Arial");
      p.textAlign(p.CENTER, p.CENTER);

      p.fill(0);
      p.textSize(20);
      p.text("GDP of Different Countries 2023–2025", margin.left + chartWidth/2, 30);

      const barCount = data.length;
      const xStep = chartWidth / barCount;
      const barWidth = xStep * 0.55;

      const maxValue = p.max(data.map(d => d["gdp_" + selectedYear]));

      p.textSize(12);
      data.forEach((d, i) => {
        const x = margin.left + i * xStep + xStep * 0.2;
        const y = margin.top + chartHeight;

        const gdp = d["gdp_" + selectedYear];
        const barHeight = (gdp / maxValue) * chartHeight;

        p.fill("#2ca02c");
        p.rect(x, y - barHeight, barWidth, barHeight);

        p.fill(255);
        p.text(gdp.toLocaleString(), x + barWidth / 2, y - barHeight / 2);

        p.fill(0);
        p.text(d.country, x + barWidth / 2, y + 15);
      });

      p.stroke(200);
      for (let i = 0; i <= 5; i++) {
        const yPos = margin.top + (chartHeight / 5) * i;
        p.line(margin.left, yPos, p.width - margin.right, yPos);

        p.noStroke();
        p.fill(0);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(
          Math.round(maxValue * (1 - i / 5)).toLocaleString(),
          margin.left - 10,
          yPos
        );
        p.stroke(200);
      }
    };
  };
  
  window.GDPBar = GDPBar;
})();