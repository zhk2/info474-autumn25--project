/* This file routes all of the different visualizations to a single place and 
initializes them so that they can be properly displayed in the html */ 

// Stacked bar (imports / exports)
new p5(GDPStackedBar)

// Consumer impact
new p5(GDPComps)

// Map
new p5(TradeMap)

new p5(TariffViz)

// Last Viz
new p5(Forecast)