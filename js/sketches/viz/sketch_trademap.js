// sketch_trademap.js
// Interactive trade map: select importer/exporter and see trade value
(function () {
  window.sketch_trademap = {
    _controlsSetup: false,
    // base polygon scale (replaced by responsive scaling in draw)
    size: 1,
    importer: "USA",
    exporter: "China",
    mode: "import",
    tradeRows: [],
    polygonsReady: false,
    exportBtn: { x: 0, y: 0, w: 120, h: 40 },
    importBtn: { x: 0, y: 0, w: 120, h: 40 },
    bounds: null,

    preload: function (p) {
      if (this._preloaded) return;
      this._preloaded = true;
      this.tradeTable = p.loadTable(
        "data/datasets/gunner/map_data.csv",
        "csv",
        "header",
        () => {
          this.tradeRows = this.tradeTable.getRows().map(row => ({
            reporter: row.get("reporterDesc"),
            partner: row.get("partnerDesc"),
            value: Number(row.get("primaryValue")) || 0
          }));
        }
      );
    },

    convertPathToPolygons: function (path, scale) {
      const coord = [0, 0];
      const polys = [];
      let current = [];
      const s = scale || 1;
      for (let i = 0; i < path.length; i++) {
        const node = path[i];
        if (node[0] === "m") {
          coord[0] += node[1] * s;
          coord[1] += node[2] * s;
          current = [];
        } else if (node[0] === "M") {
          coord[0] = node[1] * s;
          coord[1] = node[2] * s;
          current = [];
        } else if (node === "z") {
          current.push([coord[0], coord[1]]);
          polys.push(current);
        } else {
          current.push([coord[0], coord[1]]);
          coord[0] += node[0] * s;
          coord[1] += node[1] * s;
        }
      }
      return polys;
    },

    ensurePolygons: function () {
      if (this.polygonsReady) return;
      if (typeof country === "undefined") return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < country.length; i++) {
        const basePolys = this.convertPathToPolygons(country[i].vertexPoint, 1);
        country[i].polygonsBase = basePolys;
        // track bounds
        basePolys.forEach(poly => {
          poly.forEach(pt => {
            if (pt[0] < minX) minX = pt[0];
            if (pt[0] > maxX) maxX = pt[0];
            if (pt[1] < minY) minY = pt[1];
            if (pt[1] > maxY) maxY = pt[1];
          });
        });
      }
      this.bounds = { minX, minY, maxX, maxY };
      this.polygonsReady = true;
    },

    setupControls: function (p) {
      if (this._controlsSetup) return;
      this._controlsSetup = true;
      p.textFont("sans-serif");
      this.preload(p);
    },

    pointInPoly: function (verts, pt) {
      let c = false;
      for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        const slope = (verts[j][1] - verts[i][1]) / (verts[j][0] - verts[i][0]);
        if (((verts[i][1] > pt.y) !== (verts[j][1] > pt.y)) &&
            (pt.x > (pt.y - verts[i][1]) / slope + verts[i][0])) {
          c = !c;
        }
      }
      return c;
    },

    inside: function (px, py, box) {
      return px > box.x && px < box.x + box.w && py > box.y && py < box.y + box.h;
    },

    getTradeValue: function (imp, exp) {
      if (!imp || !exp) return 0;
      for (let i = 0; i < this.tradeRows.length; i++) {
        const row = this.tradeRows[i];
        if (row.reporter === imp && row.partner === exp) return row.value;
      }
      return 0;
    },

    drawModeButtons: function (p) {
      // Import button
      p.fill(this.mode === "import" ? "#113EA7" : 230);
      p.stroke(0);
      p.strokeWeight(2);
      p.rect(this.importBtn.x, this.importBtn.y, this.importBtn.w, this.importBtn.h, 8);
      p.fill(this.mode === "import" ? 255 : 0);
      p.noStroke();
      p.textSize(18);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Import", this.importBtn.x + this.importBtn.w / 2, this.importBtn.y + this.importBtn.h / 2);

      // Export button
      p.fill(this.mode === "export" ? "#F57A00" : 230);
      p.stroke(0);
      p.strokeWeight(2);
      p.rect(this.exportBtn.x, this.exportBtn.y, this.exportBtn.w, this.exportBtn.h, 8);
      p.fill(this.mode === "export" ? 255 : 0);
      p.noStroke();
      p.text("Export", this.exportBtn.x + this.exportBtn.w / 2, this.exportBtn.y + this.exportBtn.h / 2);
    },

    draw: function (p) {
      if (!this._controlsSetup) this.setupControls(p);
      this.ensurePolygons();

      p.background(255);

      if (typeof country === "undefined" || !this.polygonsReady) {
        p.fill(0);
        p.textSize(16);
        p.text("Loading country shapes…", 20, 40);
        return;
      }

      // Responsive map scaling and centering
      const b = this.bounds;
      const mapW = b.maxX - b.minX;
      const mapH = b.maxY - b.minY;
      const targetW = p.width - 40;   // almost full width
      const targetH = p.height - 60;  // keep a little breathing room
      const scale = Math.min(targetW / mapW, targetH / mapH);
      const offsetX = (p.width - mapW * scale) / 2 - b.minX * scale;
      const offsetY = (p.height - mapH * scale) / 2 - b.minY * scale;

      // Map
      p.fill(100);
      p.stroke(255);
      p.strokeWeight(1);
      for (let i = 0; i < country.length; i++) {
        const isHovered = country[i].polygonsBase.some(poly =>
          this.pointInPoly(poly.map(pt => [pt[0] * scale + offsetX, pt[1] * scale + offsetY]), p.createVector(p.mouseX, p.mouseY))
        );
        if (isHovered) {
          p.fill("#9C27B0");
        } else if (country[i].name === this.importer) {
          p.fill("#113EA7");
        } else if (country[i].name === this.exporter) {
          p.fill("#F57A00");
        } else {
          p.fill("gray");
        }

        const polys = country[i].polygonsBase;
        for (let k = 0; k < polys.length; k++) {
          p.beginShape();
          const poly = polys[k];
          for (let v = 0; v < poly.length; v++) {
            const vx = poly[v][0] * scale + offsetX;
            const vy = poly[v][1] * scale + offsetY;
            p.vertex(vx, vy);
          }
          p.endShape();
        }
      }

      // Position buttons near top-right
      this.importBtn.x = p.width - 170;
      this.importBtn.y = 24;
      this.exportBtn.x = p.width - 170;
      this.exportBtn.y = 78;
      this.drawModeButtons(p);

      // Info box (top-left overlay)
      const boxX = 20, boxY = 20, boxW = 410, boxH = 100;
      p.noStroke();
      p.fill(255, 235);
      p.rect(boxX, boxY, boxW, boxH, 8);
      p.fill(0);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(15);
      const impLabel = this.importer || "—";
      const expLabel = this.exporter || "—";
      p.text("Importer: " + impLabel, boxX + 12, boxY + 12);
      p.text("Exporter: " + expLabel, boxX + 12, boxY + 40);
      const tradeValue = this.getTradeValue(this.importer, this.exporter);
      p.textSize(17);
      p.text("Trade Value: " + tradeValue.toLocaleString() + " USD", boxX + 12, boxY + 66);
    },

    mousePressed: function (p) {
      if (this.inside(p.mouseX, p.mouseY, this.importBtn)) {
        this.mode = "import";
        return;
      }
      if (this.inside(p.mouseX, p.mouseY, this.exportBtn)) {
        this.mode = "export";
        return;
      }
      if (typeof country === "undefined" || !this.polygonsReady) return;

      for (let i = 0; i < country.length; i++) {
        const isClicked = country[i].polygons.some(poly =>
          this.pointInPoly(poly, p.createVector(p.mouseX, p.mouseY))
        );
        if (isClicked) {
          if (this.mode === "import") this.importer = country[i].name;
          else this.exporter = country[i].name;
          return;
        }
      }
    }
  };
})();
