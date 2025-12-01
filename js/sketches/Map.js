(function() {
    const pts = []
    const size = 0.6;
    let importer = 'USA';
    let exporter = 'China';
    let tradeTable;
    let tradeData = [];
    let mode = "import"; // "import" or "export"
    let exportBtn = {x: 900, y: 610, w: 120, h: 40};
    let importBtn = {x: 900, y: 660, w: 120, h: 40};
    
    function preload() {
      tradeTable = loadTable("data/gunner/map_data.csv", "csv", "header");
    }
    
    function setup() {
      createCanvas(1200, 800);
    
      data = tradeTable.getRows().map(row => ({
        reporterISO: row.get("reporterDesc"),
        partnerISO: row.get("partnerDesc"),
        fobvalue: Number(row.get("primaryValue"))
      }));
       
      for (var i = 0; i < country.length; i++) {
        country[i].polygons = convertPathToPolygons(country[i].vertexPoint);
      }
    
      const countryNames = Object.values(country).map(c => c.name)
    
    }
    
    function draw() {
    
      fill(100);
      stroke(255);
      strokeWeight(1);
    
      makeChart();
      drawModeButtons();
    
      for (var i = 0; i < country.length; i++) {
        if (country[i].polygons.some(poly => pointInPoly(poly, createVector(mouseX, mouseY)))) {
          fill('#9C27B0');
        } else if (country[i].name == importer) { 
          fill("#113EA7");
        } else if (country[i].name == exporter) { 
          fill("#F57A00");
        } else {
          fill('gray');
        }
    
        var coord_point = [0, 0];
        //For loop to calculate the vertex
        for (var k = 0; k < country[i].vertexPoint.length; k++) {
          
          if (country[i].vertexPoint[k][0] == "m") {
            coord_point[0] += country[i].vertexPoint[k][1] * size;
            coord_point[1] += country[i].vertexPoint[k][2] * size;
            beginShape();
            continue;
          }
    
          if (country[i].vertexPoint[k][0] == "M") {
            coord_point[0] = country[i].vertexPoint[k][1] * size;
            coord_point[1] = country[i].vertexPoint[k][2] * size;
            beginShape();
            continue;
          }
    
          if (country[i].vertexPoint[k] == "z") {
            vertex(coord_point[0], coord_point[1]);
            endShape();
            continue;
          }
    
          vertex(coord_point[0], coord_point[1]);
          coord_point[0] += country[i].vertexPoint[k][0] * size;
          coord_point[1] += country[i].vertexPoint[k][1] * size;
          
        }
    
      }
    
    }
    
    /* This is very similar to your existing drawing code, but instead of actually drawing with beginShape/vertex/endShape 
    this pushes vertices into an array, and then starts a new array each time it sees the "z" command. */ 
    function convertPathToPolygons(path) {
      let coord_point = [0, 0];
      let polygons = [];
      let currentPolygon = [];
      
      //For loop para calcular os pontos do vertex
      for (const node of path) {
        if (node[0] == "m") {
          coord_point[0] += node[1] * size;
          coord_point[1] += node[2] * size;
          currentPolygon = [];
        } else if (node[0] == "M") {
          coord_point[0] = node[1] * size;
          coord_point[1] = node[2] * size;
          currentPolygon = [];
        } else if (node == "z") {
          currentPolygon.push([...coord_point]);
          polygons.push(currentPolygon);
        } else {
          currentPolygon.push([...coord_point]);
          coord_point[0] += node[0] * size;
          coord_point[1] += node[1] * size;
        }
      }
      
      return polygons;
    }
    
    
    
    function pointInPoly(verts, pt) {
      let c = false;
      // for each edge of the polygon
      for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        // Compute the slope of the edge
        let slope = (verts[j][1] - verts[i][1]) / (verts[j][0] - verts[i][0]);
        
        // If the mouse is positioned within the vertical bounds of the edge
        if (((verts[i][1] > pt.y) != (verts[j][1] > pt.y)) &&
            // And it is far enough to the right that a horizontal line from the
            // left edge of the screen to the mouse would cross the edge
            (pt.x > (pt.y - verts[i][1]) / slope + verts[i][0])) {
          
          // Flip the flag
          c = !c;
        }
      }
      return c;
    }
    
    function makeChart() {
      // Clear previous text area completely
      noStroke();
      fill(255);
      rect(250, 600, 800, 200);   // White background
    
      // Optional: Draw border
      stroke(0);
      strokeWeight(4);
      noFill();
      rect(250, 600, 800, 200);
    
      // Draw new text
      noStroke();
      fill(0);
      textSize(22);
      textAlign(LEFT, TOP);
    
      let importerLabel = importer || "—";
      let exporterLabel = exporter || "—";
    
      text(`Importer:  ${importerLabel}`, 275, 620); // slight adjustment
      text(`Exporter:  ${exporterLabel}`, 275, 660);
    
      let tradeValue = (importer && exporter) ? getTradeValue(importer, exporter) : 0;
    
      textSize(26);
      text(`Trade Value:  ${tradeValue.toLocaleString()} USD`, 275, 700);
    }
    
    function getTradeValue(importer, exporter) {
      if (!importer || !exporter) return 0;
    
      if (!Array.isArray(data)) {
        console.error("data is not an array:", data);
        return 0;
      }
    
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const r = row.reporterISO;
        const p = row.partnerISO;
    
        if (r === importer && p === exporter) {
          return Number(row.fobvalue);
        }
      }
    
      return -1;
    }
    
    function drawModeButtons() {
      // IMPORT BUTTON
      if (mode === "import") fill("#113EA7"); else fill(230);
      stroke(0);
      strokeWeight(2);
      rect(importBtn.x, importBtn.y, importBtn.w, importBtn.h, 8);
    
      fill(mode === "import" ? 255 : 0);
      noStroke();
      textSize(18);
      textAlign(CENTER, CENTER);
      text("Import", importBtn.x + importBtn.w/2, importBtn.y + importBtn.h/2);
    
      // EXPORT BUTTON
      if (mode === "export") fill("#F57A00"); else fill(230);
      stroke(0);
      strokeWeight(2);
      rect(exportBtn.x, exportBtn.y, exportBtn.w, exportBtn.h, 8);
    
      fill(mode === "export" ? 255 : 0);
      noStroke();
      text("Export", exportBtn.x + exportBtn.w/2, exportBtn.y + exportBtn.h/2);
    }
    
    
    function mousePressed() {
      // --- BUTTON CLICKS FIRST ---
      if (inside(mouseX, mouseY, importBtn)) {
        mode = "import";
        return;
      }
      if (inside(mouseX, mouseY, exportBtn)) {
        mode = "export";
        return;
      }
    
      // --- COUNTRY CLICK HANDLING ---
      for (let i = 0; i < country.length; i++) {
        let c = country[i];
    
        if (c.polygons.some(poly => pointInPoly(poly, createVector(mouseX, mouseY)))) {
          if (mode === "import") importer = c.name;
          else exporter = c.name;
          return;
        }
      }
    }
    
    function inside(px, py, box) {
      return px > box.x && px < box.x + box.w &&
             py > box.y && py < box.y + box.h;
    }
    
})();