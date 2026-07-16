const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");

const cardSource = readFileSync("src/card.ts", "utf8");
const editorSource = readFileSync("src/editor.ts", "utf8");
const stylesSource = readFileSync("src/styles.ts", "utf8");

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

test("health metric is hidden when health is not set", () => {
    assert.match(cardSource, /const normalized_health_state = health_state\.trim\(\)\.toLowerCase\(\)/);
    assert.match(cardSource, /const unset_health_states = \["unknown", "unavailable", "", "notset"\]/);
    assert.match(cardSource, /const health = this\._hass\.localize\(health_key\) \|\| health_state/);
    assert.match(cardSource, /const health_set = !unset_health_states\.includes\(normalized_health_state\)/);
    assert.equal(cardSource.includes("not_set"), false);
    assert.match(cardSource, /const visible_metrics = configured_metrics\.filter\(\(\{key\}\) => key !== "health" \|\| health_set\)/);
    assert.match(cardSource, /visible_metrics\.length === 0 \? html``/);
    assert.match(cardSource, /--metric-columns: \$\{visible_metrics\.length\};/);
    assert.match(cardSource, /visible_metrics\.map/);
});

test("watering action button separates due timing from action detail", () => {
    assert.match(cardSource, /water_day/);
    assert.match(cardSource, /Water \$\{next_watering\}/);
    assert.match(cardSource, /mark_watered/);
    assert.match(cardSource, /water_day_detail/);
    assert.match(cardSource, /class="button-label"/);
});

test("cancel action includes last watered timing as button detail", () => {
    assert.match(cardSource, /last_watered_detail/);
    assert.match(cardSource, /\$\{this\._translations\["last_watered_detail"\]\} \$\{last_watered\}/);
    assert.doesNotMatch(cardSource, /is_cancel\s*\?\s*""/);
});

test("watering action button has a distinct water-day colour", () => {
    assert.match(cardSource, /water_day && !late \? 'water-day' : ''/);
    assert.match(stylesSource, /\.progress-button\.water-day/);
    assert.match(stylesSource, /--rgb-warning-color/);
});
