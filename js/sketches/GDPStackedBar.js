(function() {
  var GDPStackedBar = function(p) {
    // Variables
    var importsData;
    var exportsData;
    var top10Data = [];
    var sectors = [];
    var colors = [];
    var showing = "imports";
    var selectedYear = 2018;
    var yearSelect;
    var toggleButton;
    
    // Helper function: Toggle between imports and exports
    var toggleData = function() {
      if (showing === "imports") {
        showing = "exports";
        toggleButton.html('Switch to Imports');
      } else {
        showing = "imports";
        toggleButton.html('Switch to Exports');
      }
      processData();
    };
    
    // Helper function: Process and aggregate data
    var processData = function() {
      var table = showing === "imports" ? importsData : exportsData;
    
      var rows = [];
      for (var r = 0; r < table.getRowCount(); r++) {
        if (p.int(table.getString(r, "Year")) === selectedYear) {
          rows.push(table.getRow(r));
        }
      }
    
      // Aggregate totals per country
      var totals = {};
      var sectorSet = [];
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var country = row.get("Reporting Economy");
        var sector = row.get("Product/Sector");
        var value = parseFloat(row.get("Value"));
        
        if (sectorSet.indexOf(sector) === -1) {
          sectorSet.push(sector);
        }
    
        if (!totals[country]) totals[country] = {};
        if (!totals[country][sector]) totals[country][sector] = 0;
        totals[country][sector] += value;
      }
    
      sectors = sectorSet;
    
      // Generate colors for sectors
      colors = [];
      for (var i = 0; i < sectors.length; i++) {
        var r, g, b;
      
        if (showing === "imports") {
          r = (255 / 2) + (10 * i);
          g = (i * (255 / 11));
          b = 255;
        } else {
          r = 255;
          g = (i * (255 / 11));
          b = (i * (255 / 11));
        }
        colors.push(p.color(r, g, b)); 
      }
    
      // Compute total per country for top 10
      var totalsArr = [];
      for (var country in totals) {
        var data = totals[country];
        var total = 0;
        for (var sector in data) {
          total += data[sector];
        }
        totalsArr.push({ country: country, data: data, total: total });
      }
    
      totalsArr.sort(function(a, b) { return b.total - a.total; });
      
      top10Data = [];
      for (var i = 0; i < Math.min(10, totalsArr.length); i++) {
        var entry = { country: totalsArr[i].country };
        for (var sector in totalsArr[i].data) {
          entry[sector] = totalsArr[i].data[sector];
        }
        top10Data.push(entry);
      }
    };
    
    p.preload = function() {
      importsData = p.loadTable('data/gunner/import_types.csv', 'csv', 'header');
      exportsData = p.loadTable('data/gunner/import_types.csv', 'csv', 'header');
    };
    
    p.setup = function() {
      var canvas = p.createCanvas(1200, 600);
      canvas.parent('viz-container-3');
    
      // Year selector
      yearSelect = p.createSelect();
      yearSelect.parent('viz-container-3');
      for (var y = 2018; y <= 2024; y++) {
        yearSelect.option(y);
      }
      yearSelect.changed(function() {
        selectedYear = p.int(yearSelect.value());
        processData();
      });
    
      // Toggle button
      toggleButton = p.createButton('Switch to Exports');
      toggleButton.parent('viz-container-3');
      toggleButton.mousePressed(toggleData);
    
      processData();
    };
    
    p.draw = function() {
      p.background(255);
      p.fill(0);
      p.textSize(18);
      p.textAlign(p.CENTER);
      var title = showing.charAt(0).toUpperCase() + showing.slice(1);
      p.text("Top 10 Countries by " + title + " (" + selectedYear + ")", p.width / 2, 50);
    
      if (top10Data.length === 0) return;
    
      var margin = 120;
      var chartWidth = p.width - 200 - 2 * margin;
      var chartHeight = p.height - 2 * margin;
      var barWidth = chartWidth / top10Data.length * 0.6;
    
      // Find maximum total value for scaling
      var maxVal = 0;
      for (var i = 0; i < top10Data.length; i++) {
        var total = 0;
        for (var j = 0; j < sectors.length; j++) {
          total += top10Data[i][sectors[j]] || 0;
        }
        if (total > maxVal) maxVal = total;
      }
    
      p.textSize(12);
      for (var i = 0; i < top10Data.length; i++) {
        var d = top10Data[i];
        var x = margin + i * (chartWidth / top10Data.length) + (chartWidth / top10Data.length - barWidth) / 2;
    
        var yBottom = p.height - margin;
        for (var j = 0; j < sectors.length; j++) {
          var val = d[sectors[j]] || 0;
          var barHeight = p.map(val, 0, maxVal, 0, chartHeight);
          p.fill(colors[j]);
          p.noStroke();
          p.rect(x, yBottom - barHeight, barWidth, barHeight);
          yBottom -= barHeight;
        }
    
        p.fill(0);
        p.textAlign(p.CENTER);
        p.text(d.country, x + barWidth / 2, p.height - margin + 15);
      }
    
      // Legend
      var lx = 900;
      var ly = 60;
      p.textAlign(p.LEFT);
      for (var i = 0; i < sectors.length; i++) {
        p.fill(colors[i]);
        p.rect(lx, ly, 15, 15);
        p.fill(0);
        p.text(sectors[i], lx + 20, ly + 12);
        ly += 20;
      }
    };
  };
  
  window.GDPStackedBar = GDPStackedBar;
})();