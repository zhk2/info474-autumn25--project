// combined_viz_title.js

(function () {
    window.VizTitle = {
        overviewImg: null, // property to hold the overview image

        // Draw function
        draw: function (p, manager, ai, progress) {
            const w = manager.width || 800;
            const h = manager.height || 600;
            const cx = w / 2;
            const cy = h / 2.5;

            p.push();

            if (ai === 0) {
                // Main title screen with gradient + text
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

                // Gradient fill for main text
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
                // Overview screen: draw image
                if (this.overviewImg) {
                    p.image(this.overviewImg, 0, 0, w, h);
                } else {
                    p.fill(0);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(32);
                    p.text("Loading image...", cx, cy);
                }
            }

            p.pop();
        }
    };
})();

// --- Main p5.js sketch using VizTitle ---
let ai = 0; // 0 = main title, 1 = overview image

function preload() {
    // Preload the image for overview screen
    VizTitle.overviewImg = loadImage("js/sketches/viz/Trade.png");
}

function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(255);
    // Draw current screen using VizTitle
    if (ai === 0 || ai === 1) {
        VizTitle.draw(this, { width: width, height: height }, ai, 0);
    }
}

