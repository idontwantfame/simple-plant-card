import { LovelaceCardConfig } from "custom-card-helpers";
import { html, LitElement } from 'lit';
import { CARD_TYPE, INTEGRATION } from "./consts"
import { styles } from "./styles";

import { HomeAssistant2, Dictionary, Entity, relativeDate, relativeDays } from "./helpers"


export interface SimplePlantCardConfig extends LovelaceCardConfig {
  device: string;
  sensor_layout?: "grid" | "list";
}

export class SimplePlantCard extends LitElement {

    // properties
    private _hass : HomeAssistant2;

    // reactive
    private _device_id: string;
    private _sensor_layout: string = "grid";
    private _confirming: boolean = false;
    private _translations_loaded: boolean = false;
    private _states_updated: boolean = true ;

    private _confirmTimeout: number | null = null;

    // other private
    private _device_name: string;
    private _entity_ids: Dictionary<string> = {} ;
    private _entity_states: Map<string, Entity> = new Map() ;
    private _config_updated: boolean = true ;
    private _translations : Dictionary<string> = {
        "button": "Mark as Watered !",
        "mark_watered": "Mark as watered",
        "water_day_detail": "It's water day",
        "last_watered_detail": "Last watered",
        "cancel": "Cancel",
        "today": "today"
    }

    static keys : Array<string> = [
        "mark_watered",
        "todo",
        "problem",
        "last_watered",
        "picture",
        "days_between_waterings",
        "health",
        "next_watering",
        "moisture_problem",
        "temperature_problem",
        "illuminance_problem",
        "conductivity_problem",
        "battery_problem",
        "moisture_min",
        "moisture_max",
        "temperature_min",
        "temperature_max",
        "illuminance_min",
        "conductivity_min",
        "conductivity_max",
        "battery_min",
        "moisture",
        "temperature",
        "illuminance",
        "conductivity",
        "battery",
    ]

    static metrics = [
        { key: "moisture",     problem_key: "moisture_problem",     icon: "mdi:water-percent" },
        { key: "temperature",  problem_key: "temperature_problem",  icon: "mdi:thermometer" },
        { key: "illuminance",  problem_key: "illuminance_problem",  icon: "mdi:weather-sunny" },
        { key: "conductivity", problem_key: "conductivity_problem", icon: "mdi:sprout" },
        { key: "battery",      problem_key: "battery_problem",      icon: "mdi:battery" },
        { key: "health",       problem_key: "problem",              icon: "mdi:heart-pulse" },
    ]

    set hass(hass : HomeAssistant2) {
        // Triggered everytime a state change and more
        this._hass = hass
        this._update_entites()
    }

    // Reactive properties, a change on one of those triggers a re-render
    static properties = {
        _device_id: { type: String, state: true },
        _sensor_layout: { type: String, state: true },
        _confirming: { type: Boolean, state: true },
        _translations_loaded: { type: Boolean, state: true },
        _states_updated: {
            type: Boolean,
            state: true,
            hasChanged(newVal: boolean, _oldVal: boolean){
                return newVal // Only re-render if _states_updated is true
            }
        }
    };

    static styles =  styles;

    setConfig(config : SimplePlantCardConfig) {
        // Triggers everytime the config of the card change
        if (!config.device) {
            throw new Error("You need to define a name");
        }
        this._device_id = config.device;
        this._sensor_layout = config.sensor_layout ?? "grid";
        // while editing the entity in the card editor
        if (this._hass) {
            this.hass = this._hass
        }
        this._config_updated = true;
    }

    _moreInfo(entity_key: string){
        const event = new CustomEvent("hass-more-info", {
            bubbles: true,
            composed: true,
            detail: {
                entityId: this._entity_ids[entity_key],
                view: 'info',
            }
        });


        this.dispatchEvent(event);
    }

    _navigateToDevice(deviceId: string) {
        window.history.pushState(null, "", `/config/devices/device/${deviceId}`);
        window.dispatchEvent(new Event("location-changed"));
    }

    // Create card and its content
    render() {
        if(this._config_updated) {
            // Re fetching device specific information
            this._get_friendly_name();
            this._fetch_entities();
            this._config_updated = false;
        }
        // Updating states
        if(!this._entity_states.size)
            this._update_entites()
        this._states_updated = false; // resetting for future use
        this._loadTranslations()
        // compute strings
        const health_key_prefix = "component.simple_plant.entity.select.health.state"
        const health_key = `${health_key_prefix}.${this._entity_states.get("health").state}`
        const health = this._hass.localize(health_key)

        const days_between_label = this._entity_states.get("days_between_waterings").attributes.friendly_name
        const days_between_value = parseInt(this._entity_states.get("days_between_waterings").state)

        const local = this._hass.language
        const next_date = this._entity_states.get("next_watering").state;
        const today = this._translations["today"];
        const next_watering = relativeDate(next_date, local, today);

        const water_day = this._entity_states.get("todo").state === "on";
        const late = this._entity_states.get("problem").state === "on";

        const last_date = this._entity_states.get("last_watered").state;
        const last_watered = relativeDate(last_date, local, today)
        const is_cancel = last_watered === today
        const button_label = this._confirming
            ? "Are you sure?"
            : is_cancel
                ? this._translations["cancel"]
                : water_day
                    ? this._translations["button"]
                    : `Water ${next_watering}`
        const button_detail = this._confirming
            ? ""
            : is_cancel
                ? `${this._translations["last_watered_detail"]} ${last_watered}`
                : water_day
                    ? this._translations["water_day_detail"]
                    : this._translations["mark_watered"]

        const days_since_watered = Math.max(-relativeDays(last_date), 0)
        const progress = Math.min(days_since_watered / days_between_value, 1)

        const configured_metrics = SimplePlantCard.metrics.filter(({key}) => this._entity_ids[key])
        const metrics_section = configured_metrics.length === 0 ? html`` :
            this._sensor_layout === "list"
            ? html`${configured_metrics.map(({key, problem_key, icon}) => {
                const entity = this._entity_states.get(key)
                if (!entity) return html``
                const value = key === "health" ? health : entity.state
                const unit = entity.attributes.unit_of_measurement ?? ""
                const problem = this._entity_states.get(problem_key)?.state === "on"
                const hasColor = problem || key === "health"
                const color = key === "health" ? entity.attributes.color : "var(--error-color, Tomato)"
                return html`
                    <div class="row">
                        <ha-icon
                            .icon=${icon}
                            ?data-color=${hasColor}
                            style="${hasColor ? `--color: ${color};` : ""}"
                            @click="${() => this._moreInfo(key)}"
                        ></ha-icon>
                        <div class="content" @click="${() => this._moreInfo(key)}">
                            <p>${value} ${unit}</p>
                        </div>
                    </div>
                `
            })}`
            : html`
                <div class="metrics-grid" style="--metric-columns: ${configured_metrics.length};">
                    ${configured_metrics.map(({key, problem_key, icon}) => {
                        const entity = this._entity_states.get(key)
                        if (!entity) return html``
                        const value = key === "health" ? health : entity.state
                        const unit = entity.attributes.unit_of_measurement ?? ""
                        const problem = this._entity_states.get(problem_key)?.state === "on"
                        const hasColor = problem || key === "health"
                        const color = key === "health" ? entity.attributes.color : "var(--error-color, Tomato)"
                        return html`
                            <div class="metric-tile" @click="${() => this._moreInfo(key)}">
                                <ha-icon
                                    .icon=${icon}
                                    ?data-color=${hasColor}
                                    style="${hasColor ? `--color: ${color};` : ""}"
                                ></ha-icon>
                                <span>${value} ${unit}</span>
                            </div>
                        `
                    })}
                </div>
            `

        // return card
        return html`
            <ha-card>
                <div class="card-content ${this._entity_ids['picture'] ? 'has-image' : ''}">
                    ${this._entity_ids["picture"] ? html`
                        <hui-image
                            .hass=${this._hass}
                            .entity=${this._entity_ids["picture"]}
                            .fitMode=${"cover"}
                            @click="${() => this._moreInfo("picture")}"
                        ></hui-image>
                    ` : html``}
                    <ha-icon-button
                        .label=${days_between_label}
                        @click="${() => this._moreInfo("days_between_waterings")}"
                    >
                        <ha-icon
                            data-days="${days_between_value}"
                            .icon=${"mdi:calendar-blank"}
                        ></ha-icon>
                    </ha-icon-button>
                    <div class="info">
                        <h1 @click="${() => this._navigateToDevice(this._device_id)}">
                            ${this._device_name}
                        </h1>

                        ${metrics_section}

                        <button
                            class="progress-button ${late ? 'overdue' : ''} ${water_day && !late ? 'water-day' : ''} ${this._confirming ? 'confirming' : ''}"
                            style="--progress: ${Math.round(progress * 100)}%"
                            @click="${() => this._handleButton()}"
                        >
                            <span class="button-label">${button_label}</span>
                            ${button_detail ? html`<span class="button-detail">${button_detail}</span>` : html``}
                        </button>
                    </div>
                </div>
            </ha-card>
        `;
    }


    static getConfigElement() {
        // Create and return an editor element for UI card edition
        return document.createElement(`${CARD_TYPE}-editor`);
    }

    getCardSize() {
        return 10;
    }

    // The rules for sizing your card in the grid in sections view
    // https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/#sizing-in-sections-view
    getGridOptions() {
        return {
            columns: 6,
            min_columns: 4,
            max_columns: 12,
            min_rows: 4,
            max_rows: 16,
        };
    }

    // Specific to Simple Plant

    _handleButton() {
        const due = this._entity_states.get("todo")?.state === "on"
        const watered_today = relativeDays(this._entity_states.get("last_watered")?.state) === 0

        if (!due && !watered_today && !this._confirming) {
            this._confirming = true
            this._confirmTimeout = window.setTimeout(() => {
                this._confirming = false
                this._confirmTimeout = null
            }, 3000)
            return
        }

        if (this._confirmTimeout !== null) {
            window.clearTimeout(this._confirmTimeout)
            this._confirmTimeout = null
        }
        this._confirming = false
        this._hass.callService("button", "press", {}, {entity_id: this._entity_ids["mark_watered"]})
    }

    _update_entites() {
        // Update values of entities that got updated
        var trigger_update = false;
        if (!this._entity_ids || !this._hass)
            return
        for (const [key, id] of Object.entries(this._entity_ids)) {
            const state = this._hass.states[id]
            if (!state) continue
            if (!this._entity_states.has(key) || this._entity_states.get(key).state !== state.state)
                trigger_update = true
            this._entity_states.set(key, state)
        }
        if(trigger_update)
            this._states_updated = true
    }

    _get_friendly_name() {
        if(!this._device_id || !this._hass)
            return
        const device = Object.values(this._hass.devices).find(
            (device) => device.id == this._device_id
        );

        if (device)
            this._device_name = device.name;
        else
            throw new Error("Couldn't find selected device");
    }

    _fetch_entities() {
        // Get entities from given device
        if(!this._device_id || !this._hass)
            return
        const entities = Object.values(this._hass.entities)
        const device_entities = entities.filter((entity) => entity.device_id == this._device_id);
        const entity_ids = device_entities.map(({entity_id}) => (entity_id))
        // Match longest key first so e.g. "moisture_problem" wins over "moisture"
        const sortedKeys = [...SimplePlantCard.keys].sort((a, b) => b.length - a.length)
        entity_ids.forEach(id => {
            for (const key of sortedKeys) {
                if (id.includes(key)) {
                    this._entity_ids[key] = id;
                    break;
                }
            }
        });
    }


    async _loadTranslations(){
        if (!this._entity_states.size || this._translations_loaded)
            return
        const translation_key = `component.${INTEGRATION}.entity.button.mark_watered.name`
        const button_name = this._hass.localize(translation_key)
        if (button_name) {
            this._translations["button"] = `${button_name} !`
            this._translations["mark_watered"] = button_name
        }
        const cancel = this._hass.localize("ui.dialogs.generic.cancel")
        if (cancel) this._translations["cancel"] = cancel
        const today = this._hass.localize("ui.components.calendar.today")
        if (today) this._translations["today"] = today
        const late = this._hass.localize(`component.${INTEGRATION}.entity.binary_sensor.problem.name`)
        if (late) this._translations["late"] = late
        this._translations_loaded = true
    }
}
