// viz_title.js - IMPROVED VERSION
// Editorial-style title screens with sophisticated design
(function () {
    window.VizTitle = {
        draw: function (p, manager, ai, progress) {
            const w = manager.width || 800;
            const h = manager.height || 600;
            
            p.push();
            
            // Elegant gradient background
            const gradientSteps = 40;
            p.noStroke();
            for (let i = 0; i < gradientSteps; i++) {
                const inter = i / gradientSteps;
                const c = p.lerpColor(
                    p.color(250, 249, 246),
                    p.color(245, 242, 235),
                    inter
                );
                p.fill(c);
                p.rect(0, (h / gradientSteps) * i, w, h / gradientSteps + 1);
            }
            
            const cx = w / 2;
            const cy = h / 2.5;
            
            if (ai === 0) {
                // Main title screen
                p.textFont('Spectral');
                p.textAlign(p.CENTER, p.CENTER);
                
                // Decorative line above
                p.strokeWeight(3);
                p.stroke(37, 99, 168, 200);
                p.line(cx - 100, cy - 100, cx + 100, cy - 100);
                
                // Main title with gradient effect
                p.noStroke();
                p.textSize(72);
                p.textStyle(p.BOLD);
                
                // Shadow layer
                p.fill(0, 0, 0, 30);
                p.text('The Trade War', cx + 2, cy + 2);
                
                // Main text
                const gradient = p.drawingContext.createLinearGradient(
                    cx - 200, cy - 50, cx + 200, cy + 50
                );
                gradient.addColorStop(0, '#2563a8');
                gradient.addColorStop(1, '#d97706');
                p.drawingContext.fillStyle = gradient;
                p.text('The Trade War', cx, cy);
                
                // Subtitle
                p.fill(102, 102, 102);
                p.textSize(20);
                p.textStyle(p.NORMAL);
                p.textFont('Inter');
                p.text('Understanding US Tariffs and Global Impact', cx, cy + 60);
                
                // Decorative line below
                p.strokeWeight(2);
                p.stroke(217, 119, 6, 180);
                p.line(cx - 120, cy + 100, cx + 120, cy + 100);
                
                // Year range
                p.noStroke();
                p.fill(153, 153, 153);
                p.textSize(14);
                p.text('2015 — 2024', cx, cy + 130);
                
            } else if (ai === 1) {
                // Overview screen
                p.textFont('Spectral');
                p.textAlign(p.CENTER, p.CENTER);
                
                // Title
                p.textSize(56);
                p.textStyle(p.BOLD);
                p.fill(26, 26, 26);
                p.text('Overview', cx, cy);
                
                // Content card with elegant border
                const cardY = cy + 60;
                const cardW = 480;
                const cardH = 280;
                
                p.fill(255, 255, 255, 250);
                p.stroke(229, 229, 229);
                p.strokeWeight(1);
                p.rect(cx - cardW/2, cardY, cardW, cardH, 8);
                
                // List items
                p.noStroke();
                p.textFont('Inter');
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(18);
                
                const items = [
                    'What is Trade?',
                    'Introduction to Tariffs',
                    'Tariff Percentages by Country',
                    'GDP Impact Analysis',
                    'Consumer Goods Exposure',
                    'Global Trade Forecast'
                ];
                
                let itemY = cardY + 50;
                items.forEach((item, idx) => {
                    // Bullet point
                    p.fill(37, 99, 168);
                    p.circle(cx - cardW/2 + 40, itemY, 8);
                    
                    // Text
                    p.fill(26, 26, 26);
                    p.text(item, cx - cardW/2 + 60, itemY);
                    
                    itemY += 50;
                });
            }
            
            p.pop();
        }
    };
})();
