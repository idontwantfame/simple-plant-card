const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");

const cardSource = readFileSync("src/card.ts", "utf8");
const editorSource = readFileSync("src/editor.ts", "utf8");

test("editor does not expose manual metric grid columns", () => {
    assert.equal(editorSource.includes("sensor_columns"), false);
    assert.equal(editorSource.includes("Grid columns"), false);
});

test("health appears as a metric tile instead of a separate status row", () => {
    assert.match(cardSource, /metrics = \[/);
    assert.match(cardSource, /key: "health"/);
    assert.equal(cardSource.includes("status-grid"), false);
    assert.equal(cardSource.includes("status-tile"), false);
    assert.equal(cardSource.includes("_sensor_columns"), false);
    assert.equal(cardSource.includes("--sensor-columns"), false);
});

test("watering action button separates due timing from action detail", () => {
    assert.match(cardSource, /water_day/);
    assert.match(cardSource, /Water \$\{next_watering\}/);
    assert.match(cardSource, /mark_watered/);
    assert.match(cardSource, /water_day_detail/);
    assert.match(cardSource, /class="button-label"/);
});
