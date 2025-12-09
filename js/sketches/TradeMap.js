(function() {
    var TradeMap = function(p) {
  
      /* ===================== VARIABLES ===================== */
      var size = 0.6;
      var selectedCountry = "USA";
      var selectedYear = 2024;
      var tradeData = {};
      var maxAbsValue2024 = {};
      var dataLoaded = false;
  
      // UI Elements
      var countrySelect;
      var yearSlider;
      var yearLabel;
  
      // Tooltip
      var tooltipCountry = null;
      var tooltipValue = 0;
  
      var tradeTable;
  
      /* ===================== HELPERS ===================== */
      var convertPathToPolygons = function(path) {
        var coord_point = [0, 0];
        var polygons = [];
        var currentPolygon = [];
  
        for (var i = 0; i < path.length; i++) {
          var node = path[i];
          if (node[0] == "m") {
            coord_point[0] += node[1] * size;
            coord_point[1] += node[2] * size;
            currentPolygon = [];
          } else if (node[0] == "M") {
            coord_point[0] = node[1] * size;
            coord_point[1] = node[2] * size;
            currentPolygon = [];
          } else if (node == "z") {
            currentPolygon.push([coord_point[0], coord_point[1]]);
            polygons.push(currentPolygon);
          } else {
            currentPolygon.push([coord_point[0], coord_point[1]]);
            coord_point[0] += node[0] * size;
            coord_point[1] += node[1] * size;
          }
        }
        return polygons;
      };
  
      var pointInPoly = function(verts, pt) {
        var c = false;
        for (var i = 0, j = verts.length - 1; i < verts.length; j = i++) {
          var slope = (verts[j][1] - verts[i][1]) / (verts[j][0] - verts[i][0]);
          if (((verts[i][1] > pt.y) != (verts[j][1] > pt.y)) &&
              (pt.x > (pt.y - verts[i][1]) / slope + verts[i][0])) {
            c = !c;
          }
        }
        return c;
      };
  
      var getTradeValue = function(countryCode) {
        if (!tradeData[selectedCountry]) return 0;
        if (!tradeData[selectedCountry][countryCode]) return 0;
        return tradeData[selectedCountry][countryCode][selectedYear.toString()] || 0;
      };
  
      var getFillColor = function(countryCode) {
        const value = getTradeValue(countryCode);
        const maxVal = maxAbsValue2024[selectedCountry] || 1;
  
        if (value === 0) return [220, 220, 220]; // no data
  
        const ratio = Math.min(Math.abs(value) / maxVal, 1);
        const intensity = Math.pow(ratio, 1);
  
        if (value > 0) {
          // Positive (surplus) - blue gradient
          const minBlue = 200;
          const maxBlue = 0;
          const blue = minBlue + (maxBlue - minBlue) * intensity;
          return [blue * 0.8, blue * 0.9, 255];
        } else {
          // Negative (deficit) - orange gradient
          const minOrange = 200;
          const maxOrange = 0;
          const orange = minOrange + (maxOrange - minOrange) * intensity;
          return [255, orange * 0.7, orange * 0.4];
        }
      };
  
      var isSelectedCountry = function(countryName) {
        const mapping = {
            'United States of America': 'USA',
            'China': 'China',
            'Iran, Islamic Rep.': 'Iran',
            'Chad': 'Chad'
          };
          
        return countryName === mapping[selectedCountry];
      };
  
      /* ===================== TOOLTIP ===================== */
      var drawTooltip = function() {
        if (!tooltipCountry) return;
        var txt = tooltipCountry + ": " + tooltipValue.toLocaleString() + " USD (" + selectedYear + ")";
  
        p.textSize(14);
        p.textAlign(p.LEFT, p.TOP);
        p.noStroke();
        p.fill(0, 0, 0, 200);
        p.rect(p.mouseX + 10, p.mouseY + 10, p.textWidth(txt) + 10, 24, 5);
  
        p.fill(255);
        p.text(txt, p.mouseX + 15, p.mouseY + 12);
      };
  
      /* ===================== TIMELINE ===================== */
      var drawTimeline = function() {
        const chartX = 50, chartY = 520, chartW = 1100, chartH = 100;
        p.fill(250);
        p.stroke(150);
        p.strokeWeight(1);
        p.rect(chartX, chartY, chartW, chartH);
  
        const allValues = [];
        const years = [];
        const countryKey = selectedCountry;
  
        for (let year = 1974; year <= 2024; year++) {
          years.push(year);
          let total = 0;
          if (tradeData[countryKey]) {
            Object.values(tradeData[countryKey]).forEach(yearData => {
              total += yearData[year.toString()] || 0;
            });
          }
          allValues.push(total);
        }
  
        const maxVal = Math.max(...allValues.map(Math.abs), 1);
  
        // zero line
        p.stroke(100);
        p.strokeWeight(1);
        const zeroY = chartY + chartH / 2;
        p.line(chartX, zeroY, chartX + chartW, zeroY);
  
        // line chart
        p.noFill();
        p.stroke(0, 47, 138);
        p.strokeWeight(2);
        p.beginShape();
        for (let i = 0; i < allValues.length; i++) {
          const x = chartX + (i / (allValues.length - 1)) * chartW;
          const normalized = allValues[i] / maxVal;
          const y = zeroY - normalized * (chartH * 0.4);
          p.vertex(x, y);
        }
        p.endShape();
  
        // current year marker
        const currentIndex = selectedYear - 1974;
        const markerX = chartX + (currentIndex / (allValues.length - 1)) * chartW;
        p.fill(255, 100, 100);
        p.noStroke();
        p.circle(markerX, zeroY - (allValues[currentIndex] / maxVal) * (chartH * 0.4), 8);
  
        // labels
        p.fill(0);
        p.noStroke();
        p.textSize(11);
        p.textAlign(p.LEFT, p.TOP);
        p.text('1974', chartX, chartY + chartH + 5);
        p.textAlign(p.RIGHT, p.TOP);
        p.text('2024', chartX + chartW, chartY + chartH + 5);
      };
  
      var drawCountryInfo = function() {
        const infoY = 635;
        p.noStroke();
        p.fill(250);
        p.rect(0, infoY, p.width, 40);
  
        p.fill(0);
        p.textSize(20);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(selectedCountry + ' - ' + selectedYear, p.width / 2, infoY + 20);
      };
  
      /* ===================== PRELOAD ===================== */
      p.preload = function() {
        tradeTable = p.loadTable("data/gunner/map-countries.csv", "csv", "header");
      };
  
      /* ===================== PROCESS DATA ===================== */
      var processAllData = function() {
        const rows = tradeTable.getRows();
        const countries = ['China', 'Guyana', 'India', 'Ireland', 'Korea', 'USA'];
        countries.forEach(c => { tradeData[c] = {}; maxAbsValue2024[c] = 0; });
  
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const country = row.get('country');
          const countryCode = row.get('Country Name');
  
          if (!country || !countryCode) continue;
  
          const yearData = {};
          for (let year = 1974; year <= 2024; year++) {
            const value = parseFloat(row.get(year.toString())) || 0;
            yearData[year.toString()] = value;
            if (year === 2024 && Math.abs(value) > maxAbsValue2024[country]) maxAbsValue2024[country] = Math.abs(value);
          }
  
          tradeData[country][countryCode] = yearData;
        }
  
        dataLoaded = true;
      };
  
      /* ===================== SETUP ===================== */
      p.setup = function() {
        const canvas = p.createCanvas(1200, 700);
        canvas.parent('viz-container-1');
  
        if (typeof country !== 'undefined') {
          for (var i = 0; i < country.length; i++) {
            country[i].polygons = convertPathToPolygons(country[i].vertexPoint);
          }
        }
  
        // controls
        const controlsDiv = p.createDiv('').parent('viz-container-1');
        controlsDiv.style('display','flex'); controlsDiv.style('gap','30px'); controlsDiv.style('align-items','center'); controlsDiv.style('justify-content','center'); controlsDiv.style('margin-bottom','15px');
  
        // year slider
        const sliderGroup = p.createDiv('').parent(controlsDiv);
        yearLabel = p.createDiv('Year: ' + selectedYear).parent(sliderGroup);
        yearSlider = p.createSlider(1974,2024,selectedYear,1).parent(sliderGroup);
        yearSlider.input(() => { selectedYear = yearSlider.value(); yearLabel.html('Year: ' + selectedYear); });
  
        // country dropdown
        const selectGroup = p.createDiv('').parent(controlsDiv);
        const selectLabel = p.createDiv('Select Country:').parent(selectGroup);
        countrySelect = p.createSelect().parent(selectGroup);
        ['USA','China','India','Ireland','Korea','Guyana'].forEach(c => countrySelect.option(c));
        countrySelect.selected('USA');
        countrySelect.changed(() => { selectedCountry = countrySelect.value(); });
  
        processAllData();
        p.textFont('Arial, sans-serif');
      };
  
      /* ===================== DRAW ===================== */
      p.draw = function() {
        p.background('#fafafa');
        if (!dataLoaded) {
          p.fill(0); p.textSize(18); p.textAlign(p.CENTER,CENTER); p.text("Loading trade data...", p.width/2, p.height/2); return;
        }
        if (typeof country === 'undefined') { p.fill(0); p.textSize(18); p.textAlign(p.CENTER,CENTER); p.text("Loading map...", p.width/2, p.height/2); return; }
  
        tooltipCountry = null; tooltipValue = 0;
        p.stroke(0); p.strokeWeight(0.7);
  
        for (var i = 0; i < country.length; i++) {
          var c = country[i];
          var hovered = false;
  
          // detect hover
          for (var j = 0; j < c.polygons.length; j++) {
            if (pointInPoly(c.polygons[j], p.createVector(p.mouseX, p.mouseY))) {
              hovered = true;
              tooltipCountry = c.name;
              // get tooltip value
              if (tradeData[selectedCountry]) {
                for (let code in tradeData[selectedCountry]) {
                  if (code === c.name) {
                    tooltipValue = tradeData[selectedCountry][code][selectedYear] || 0;
                    break;
                  }
                }
              }
              break;
            }
          }
  
          // fill color
          var col = [220,220,220]; // default
          if (isSelectedCountry(c.name)) {
            p.fill('#002f8a');
          } else {
            if (tradeData[selectedCountry]) {
              for (let code in tradeData[selectedCountry]) {
                if (code === c.name) {
                  col = getFillColor(code);
                  break;
                }
              }
            }
            p.fill(col[0],col[1],col[2]);
          }
  
          // draw polygons
          var coord_point=[0,0];
          for (var k=0;k<c.vertexPoint.length;k++){
            var node=c.vertexPoint[k];
            if(node[0]=='m'){coord_point[0]+=node[1]*size;coord_point[1]+=node[2]*size;p.beginShape();continue;}
            if(node[0]=='M'){coord_point[0]=node[1]*size;coord_point[1]=node[2]*size;p.beginShape();continue;}
            if(node=='z'){p.vertex(coord_point[0],coord_point[1]);p.endShape();continue;}
            p.vertex(coord_point[0],coord_point[1]);
            coord_point[0]+=node[0]*size; coord_point[1]+=node[1]*size;
          }
        }
  
        drawTimeline();
        drawCountryInfo();
        drawTooltip();
      };
  
    };
  
    window.TradeMap = TradeMap;
  })();
  