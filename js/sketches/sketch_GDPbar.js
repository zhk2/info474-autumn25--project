// Stacked bar chart showing top ten importers and exports by country and year.
// Author: Gunner Dohrenwend
(function() {

  let StackedTopTenGDPGraph = function(p) {
    let top10Data = [];
    let sectors = [];
    let selectedYear = 2023;
    let colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'];
    let myTable;

    const tradeData = [
      { "Reporting Economy": "Argentina", "Year": 2023, "Product/Sector": "Agricultural products", "Value": 18500 },
      { "Reporting Economy": "Argentina", "Year": 2023, "Product/Sector": "Manufactures", "Value": 12100 },
      { "Reporting Economy": "Brazil", "Year": 2023, "Product/Sector": "Agricultural products", "Value": 45000 },
      { "Reporting Economy": "Brazil", "Year": 2023, "Product/Sector": "Fuels and mining products", "Value": 32000 },
      { "Reporting Economy": "Canada", "Year": 2023, "Product/Sector": "Fuels and mining products", "Value": 65200 },
      { "Reporting Economy": "Canada", "Year": 2023, "Product/Sector": "Machinery and transport equipment", "Value": 41800 },
      { "Reporting Economy": "China", "Year": 2023, "Product/Sector": "Manufactures", "Value": 189000 },
      { "Reporting Economy": "China", "Year": 2023, "Product/Sector": "Textiles", "Value": 55000 },
      { "Reporting Economy": "Egypt", "Year": 2023, "Product/Sector": "Fuels and mining products", "Value": 9100 },
      { "Reporting Economy": "Egypt", "Year": 2023, "Product/Sector": "Food", "Value": 7800 },
      { "Reporting Economy": "France", "Year": 2023, "Product/Sector": "Machinery and transport equipment", "Value": 88400 },
      { "Reporting Economy": "France", "Year": 2023, "Product/Sector": "Manufactures", "Value": 61500 },
      { "Reporting Economy": "Germany", "Year": 2023, "Product/Sector": "Machinery and transport equipment", "Value": 115000 },
      { "Reporting Economy": "Germany", "Year": 2023, "Product/Sector": "Automotive products", "Value": 95000 },
      { "Reporting Economy": "India", "Year": 2023, "Product/Sector": "Manufactures", "Value": 72300 },
      { "Reporting Economy": "India", "Year": 2023, "Product/Sector": "Textiles", "Value": 38900 },
      { "Reporting Economy": "Japan", "Year": 2023, "Product/Sector": "Automotive products", "Value": 102100 },
      { "Reporting Economy": "Japan", "Year": 2023, "Product/Sector": "Machinery and transport equipment", "Value": 75000 },
      { "Reporting Economy": "Mexico", "Year": 2023, "Product/Sector": "Automotive products", "Value": 44200 },
      { "Reporting Economy": "Mexico", "Year": 2023, "Product/Sector": "Manufactures", "Value": 31600 },
      { "Reporting Economy": "Nigeria", "Year": 2023, "Product/Sector": "Fuels and mining products", "Value": 19700 },
      { "Reporting Economy": "Nigeria", "Year": 2023, "Product/Sector": "Agricultural products", "Value": 6400 }
    ];

    p.preload = function() {
      myTable = p.makeTable(tradeData);
      console.log(myTable.getRowCount());
      console.log("hi")
    }

    // Builds a table from a JS object
    p.makeTable = function(myData) {
      myTable = new p5.Table();
    
      // Add columns
      const columns = Object.keys(myData[0]);
      columns.forEach(col => {
        myTable.addColumn(col);
      });
      
      // Add rows
      myData.forEach(obj => {
        let newRow = myTable.addRow();
        columns.forEach(col => {
          newRow.set(col, obj[col]);
        });
      });
      
      return myTable;
    }

    // Recieves a p5 map object and returns the top ten p5 countries. 
    p.getTop10Data = function() {
      // Group data by country
      let countryTotals = {};
      
      for (let i = 0; i < myTable.getRowCount(); i++) {
        let row = myTable.getRow(i);
        let country = row.getString('Reporting Economy');
        let sector = row.getString('Product/Sector');
        let value = row.getNum('Value');
        let year = row.getNum('Year');
        
        if (year !== selectedYear) continue;
        
        // Initialize country if not exists
        if (!countryTotals[country]) {
          countryTotals[country] = { country: country, total: 0 };
        }
        
        // Add sector value
        if (!countryTotals[country][sector]) {
          countryTotals[country][sector] = 0;
        }
        countryTotals[country][sector] += value;
        countryTotals[country].total += value;
        
        // Track unique sectors
        if (!sectors.includes(sector)) {
          sectors.push(sector);
        }
      }
      
      // Convert to array and sort by total
      let countriesArray = Object.values(countryTotals);
      countriesArray.sort((a, b) => b.total - a.total);
      
      // Take top 10
      top10Data = countriesArray.slice(0, 10);
    }

    p.setup = function() {
      let canvas = p.createCanvas(1200, 600);
      p.getTop10Data();

      // Year selector
      yearSelect = p.createSelect();
      yearSelect.position(50, 50);
      for (let y = 2023; y <= 2023; y++) {
        yearSelect.option(y);
      }
      yearSelect.changed(() => {
        selectedYear = p.int(yearSelect.value());
        p.getTop10Data(); 
      });

      canvas.parent('viz-container-1');
    }

    p.draw = function() {
      p.background(255);
      p.fill(0);
      p.textSize(18);
      p.text(`Top 10 Countries`);

      let margin = 120;
      let chartWidth = p.width - 200 - 2 * margin;
      let chartHeight = p.height - 2 * margin;
      let barWidth = chartWidth / top10Data.length * 0.6;

      // Find maximum total value for scaling
      let maxVal = p.max(top10Data.map(d => sectors.reduce((sum, s) => sum + (d[s] || 0), 0)));

      p.textSize(12);
      for (let i = 0; i < top10Data.length; i++) {
        let d = top10Data[i];
        let x = margin + i * (chartWidth / top10Data.length) + (chartWidth / top10Data.length - barWidth) / 2;

        let yBottom = p.height - margin;
        for (let j = 0; j < sectors.length; j++) {
          let val = d[sectors[j]] || 0;
          let barHeight = p.map(val, 0, maxVal, 0, chartHeight);
          p.fill(colors[j]);
          p.rect(x, yBottom - barHeight, barWidth, barHeight);
          yBottom -= barHeight;
        }

        p.fill(0);
        p.text(d.country, x + barWidth / 2, p.height - margin + 15);
      }

      // Legend
      let lx = 900;
      let ly = 60;
      for (let i = 0; i < sectors.length; i++) {
        p.fill(colors[i]);
        p.rect(lx, ly, 15, 15);
        p.fill(0);
        p.text(sectors[i], lx + 20, ly + 12);
        ly += 20;
      }
    }
  }
  window.StackedTopTenGDPGraph = StackedTopTenGDPGraph;
})();

