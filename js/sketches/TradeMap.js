(function() {
    var TradeMap = function(p) {
        // Variables
        var pts = [];
        var size = 0.6;
        var importer = 'USA';
        var exporter = 'China';
        var tradeTable;
        var tradeData = [];
        var data = [];
        var mode = "import";
        var exportBtn = {x: 900, y: 610, w: 120, h: 40};
        var importBtn = {x: 900, y: 660, w: 120, h: 40};
        
        // Helper functions
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
        
        var makeChart = function() {
            p.noStroke();
            p.fill(255);
            p.rect(250, 600, 800, 200);
            
            p.stroke(0);
            p.strokeWeight(4);
            p.noFill();
            p.rect(250, 600, 800, 200);
            
            p.noStroke();
            p.fill(0);
            p.textSize(22);
            p.textAlign(p.LEFT, p.TOP);
            
            var importerLabel = importer || "—";
            var exporterLabel = exporter || "—";
            
            p.text("Importer:  " + importerLabel, 275, 620);
            p.text("Exporter:  " + exporterLabel, 275, 660);
            
            var tradeValue = (importer && exporter) ? getTradeValue(importer, exporter) : 0;
            
            p.textSize(26);
            p.text("Trade Value:  " + tradeValue.toLocaleString() + " USD", 275, 700);
        };
        
        var getTradeValue = function(imp, exp) {
            if (!imp || !exp) return 0;
            
            if (!Array.isArray(data)) {
                console.error("data is not an array:", data);
                return 0;
            }
            
            for (var i = 0; i < data.length; i++) {
                var row = data[i];
                var r = row.reporterISO;
                var p_iso = row.partnerISO;
            
                if (r === imp && p_iso === exp) {
                    return Number(row.fobvalue);
                }
            }
            
            return -1;
        };
        
        var drawModeButtons = function() {
            // IMPORT BUTTON
            if (mode === "import") p.fill("#113EA7"); 
            else p.fill(230);
            p.stroke(0);
            p.strokeWeight(2);
            p.rect(importBtn.x, importBtn.y, importBtn.w, importBtn.h, 8);
            
            p.fill(mode === "import" ? 255 : 0);
            p.noStroke();
            p.textSize(18);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("Import", importBtn.x + importBtn.w/2, importBtn.y + importBtn.h/2);
            
            // EXPORT BUTTON
            if (mode === "export") p.fill("#F57A00"); 
            else p.fill(230);
            p.stroke(0);
            p.strokeWeight(2);
            p.rect(exportBtn.x, exportBtn.y, exportBtn.w, exportBtn.h, 8);
            
            p.fill(mode === "export" ? 255 : 0);
            p.noStroke();
            p.text("Export", exportBtn.x + exportBtn.w/2, exportBtn.y + exportBtn.h/2);
        };
        
        var inside = function(px, py, box) {
            return px > box.x && px < box.x + box.w &&
                   py > box.y && py < box.y + box.h;
        };
        
        p.preload = function() {
            tradeTable = p.loadTable("data/gunner/map_data.csv", "csv", "header");
        };
        
        p.setup = function() {
            var canvas = p.createCanvas(1200, 800);
            canvas.parent('viz-container-1'); 
            
            data = tradeTable.getRows().map(function(row) {
                return {
                    reporterISO: row.get("reporterDesc"),
                    partnerISO: row.get("partnerDesc"),
                    fobvalue: Number(row.get("primaryValue"))
                };
            });
            
            // Assumes 'country' is globally available from country.js
            if (typeof country !== 'undefined') {
                for (var i = 0; i < country.length; i++) {
                    country[i].polygons = convertPathToPolygons(country[i].vertexPoint);
                }
            } else {
                console.error("'country' array not found. Make sure country.js is loaded first.");
            }
        };
        
        p.draw = function() {
            p.background(255);
            
            if (typeof country === 'undefined') {
                p.fill(0);
                p.textSize(18);
                p.text("Loading country data...", 20, 40);
                return;
            }
            
            p.fill(100);
            p.stroke(255);
            p.strokeWeight(1);
            
            makeChart();
            drawModeButtons();
            
            for (var i = 0; i < country.length; i++) {
                var isHovered = country[i].polygons.some(function(poly) {
                    return pointInPoly(poly, p.createVector(p.mouseX, p.mouseY));
                });
                
                if (isHovered) {
                    p.fill('#9C27B0');
                } else if (country[i].name == importer) { 
                    p.fill("#113EA7");
                } else if (country[i].name == exporter) { 
                    p.fill("#F57A00");
                } else {
                    p.fill('gray');
                }
            
                var coord_point = [0, 0];
                for (var k = 0; k < country[i].vertexPoint.length; k++) {
                    var node = country[i].vertexPoint[k];
                    
                    if (node[0] == "m") {
                        coord_point[0] += node[1] * size;
                        coord_point[1] += node[2] * size;
                        p.beginShape();
                        continue;
                    }
                
                    if (node[0] == "M") {
                        coord_point[0] = node[1] * size;
                        coord_point[1] = node[2] * size;
                        p.beginShape();
                        continue;
                    }
                
                    if (node == "z") {
                        p.vertex(coord_point[0], coord_point[1]);
                        p.endShape();
                        continue;
                    }
                
                    p.vertex(coord_point[0], coord_point[1]);
                    coord_point[0] += node[0] * size;
                    coord_point[1] += node[1] * size;
                }
            }
        };
        
        p.mousePressed = function() {
            // Button clicks first
            if (inside(p.mouseX, p.mouseY, importBtn)) {
                mode = "import";
                return;
            }
            if (inside(p.mouseX, p.mouseY, exportBtn)) {
                mode = "export";
                return;
            }
            
            // Country click handling
            if (typeof country !== 'undefined') {
                for (var i = 0; i < country.length; i++) {
                    var c = country[i];
                    var isClicked = c.polygons.some(function(poly) {
                        return pointInPoly(poly, p.createVector(p.mouseX, p.mouseY));
                    });
                    
                    if (isClicked) {
                        if (mode === "import") importer = c.name;
                        else exporter = c.name;
                        return;
                    }
                }
            }
        };
    };
    window.TradeMap = TradeMap;
})();