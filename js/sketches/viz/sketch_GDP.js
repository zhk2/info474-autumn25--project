function preload() {
  table = loadTable("./data/datasets/Improved_Dataset/trade_master_full.csv", "csv", "header");
}

let table;
let countries = [];
let dataMapGDP = {};

function setup() {
  let cnv = createCanvas(900, 500);
  cnv.parent("vis2");

  // Extract countries and organize data
  for (let r = 0; r < table.getRowCount(); r++) {
    let row = table.getRow(r);
    let country = row.getString("country_name");
    let year = row.getNum("year");

    if (year !== 2022 && year !== 2024) continue;

    if (!dataMapGDP[country]) dataMapGDP[country] = {};

    dataMapGDP[country][year] = {
      gdp: row.getNum("gdp_usd"),
      tariff_prev: row.getNum("tariff_prev_year"),
      direction: row.getString("tariff_change_direction")
    };

    if (!countries.includes(country)) countries.push(country);
  }

  countries.sort();

  dropdownGDP = createSelect();
  dropdownGDP.parent("vis2");
  dropdownGDP.style("width", "250px");
  dropdownGDP.option("-- Select a Country --");
  for (let c of countries) dropdownGDP.option(c);

  dropdownGDP.changed(() => redraw());

  noLoop();
}

function draw() {
  background(255);
  textSize(18);
  fill(0);

  let country = dropdownGDP.value();
  if (!country || country === "-- Select a Country --") {
    text("Select a country to view GDP", 20, 40);
    return;
  }

  let before = dataMapGDP[country][2022];
  let after = dataMapGDP[country][2024];

  if (!before || !after) {
    text("GDP data for 2022 and 2024 is incomplete.", 20, 40);
    return;
  }

  textAlign(CENTER);
  text("GDP of " + country + " Before and After Tariff", width / 2, 30);

  let maxGDP = max(before.gdp, after.gdp);
  let barWidth = 120;

  let x1 = width / 3;

  fill("#113EA7");
  let h1 = map(before.gdp, 0, maxGDP, 0, 300);
  rect(x1 - barWidth / 2, height - 80 - h1, barWidth, h1);

  fill(0);
  text("GDP 2022", x1, height - 40);

  fill(before.direction === "increase" ? "#5DD548" : "#FC3640");
  text("Tariff: " + before.tariff_prev + "%", x1, height - 350);

  let x2 = (2 * width) / 3;

  fill("#F57A00");
  let h2 = map(after.gdp, 0, maxGDP, 0, 300);
  rect(x2 - barWidth / 2, height - 80 - h2, barWidth, h2);

  fill(0);
  text("GDP 2024", x2, height - 40);

  fill(after.direction === "increase" ? "#5DD548" : "#FC3640");
  text("Tariff: " + after.tariff_prev + "%", x2, height - 350);
}
