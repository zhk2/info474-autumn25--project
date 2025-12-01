## Project Flow
Data > Sketches > Routed to *main.js* > HTML
In the HTML make sure main.js is the last JS file called. 
## Basic Structure

1. Wrap everything in an IIFE
2. Declare all variables at the top
3. Write helper functions
5. Setup function creates canvas and UI
6. Draw function renders the visualization
7. Export to window

## File structures

sketch_myviz.js
```javascript
(function() {
    var myViz = function(p) {
        p.helperFunction = function() {
            // code here
        }

        p.setup = function() {
            let canvas = p.createCanvas(1200, 600);
            // other code
            canvas.parent('viz-container-X')
        }

        p.draw = function() {
            p.background(255);
            p.fill(0);
            p.textSize(18);
            p.text(`Title`);
        }
        window.myViz = myViz;
    }
})
```

main.js 
```javascript
// In order they appear
new p5(OtherViz)

new p5(OtherVizTwo)

new p5(myViz)
```