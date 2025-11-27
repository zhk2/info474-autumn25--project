// sketch_global_trade_forecast.js
// Story: "Where Are We Headed? Global Trade Over Time"

(function () {
  var sketch = function (p) {
    var table;
    var years = [];
    var values = [];          // trillions USD
    var forecastYears = [];
    var forecastValues = [];  // trillions USD
    var growthSummary = "";

    p.preload = function () {
      table = p.loadTable("data/datasets/Improved_Dataset/trade_master_full.csv", "csv", "header");
    };

    p.setup = function () {
      var w = Math.min(1200, Math.max(900, window.innerWidth - 60));
      var h = Math.min(900, Math.max(650, window.innerHeight - 80));
      var c = p.createCanvas(w, h);
      var mount = document.getElementById("forecast-canvas");
      if (mount) c.parent("forecast-canvas");
      p.textFont("sans-serif");
      processGlobalTrade();
      computeForecast();
      computeSummary();
    };

    function processGlobalTrade() {
      var seen = {};
      for (var r = 0; r < table.getRowCount(); r++) {
        var year = parseInt(table.getString(r, "year"), 10);
        var tradeVal = table.getNum(r, "global_total_trade");
        if (!year || isNaN(tradeVal)) continue;
        if (seen[year]) continue;
        seen[year] = tradeVal;
      }
      var sortedYears = Object.keys(seen)
        .map(function (y) { return parseInt(y, 10); })
        .sort(function (a, b) { return a - b; });

      years = [];
      values = [];
      for (var i = 0; i < sortedYears.length; i++) {
        var y = sortedYears[i];
        years.push(y);
        values.push(seen[y] / 1e12); // trillions USD
      }
    }

    function computeForecast() {
      var n = years.length;
      if (n < 2) return;

      var sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (var i = 0; i < n; i++) {
        var x = years[i];
        var y = values[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      }

      var denom = n * sumXX - sumX * sumX;
      if (denom === 0) return;

      var slope = (n * sumXY - sumX * sumY) / denom;
      var intercept = (sumY - slope * sumX) / n;

      var lastYear = years[years.length - 1];
      var endYear = 2030;

      forecastYears = [];
      forecastValues = [];
      for (var y = lastYear + 1; y <= endYear; y++) {
        var pred = slope * y + intercept;
        forecastYears.push(y);
        forecastValues.push(pred);
      }
    }

    function computeSummary() {
      if (years.length === 0 || values.length === 0) {
        growthSummary = "";
        return;
      }
      var startYear = years[0];
      var endYear = years[years.length - 1];
      var startVal = values[0];
      var endVal = values[values.length - 1];
      if (startVal <= 0) {
        growthSummary = "";
        return;
      }
      var pct = ((endVal - startVal) / startVal) * 100;
      growthSummary =
        "From " + startYear + " to " + endYear +
        ", total global trade grew about " + pct.toFixed(0) + "%.";
    }

    p.draw = function () {
      // --- drawing logic remains unchanged ---
      // ... your entire draw function here ...
    };

    function drawLegend(x, y) {
      // ... legend function unchanged ...
    }
  };

  new p5(sketch); // instantiate the sketch
})();

