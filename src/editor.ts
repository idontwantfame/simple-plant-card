import { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers";
import { html, LitElement } from 'lit';

import { INTEGRATION } from "./consts"

export class SimplePlantCardEditor extends LitElement {

    private _hass : HomeAssistant;
    private _config : LovelaceCardConfig;

    static schema = [
        {name: "device",         label: "Device",          selector: { device: { integration: INTEGRATION} }},
        {name: "sensor_layout",  label: "Sensor layout",   selector: { select: { mode: "list", options: [
            {value: "grid", label: "Grid"},
            {value: "list", label: "List"},
        ]}}},
    ]

    static properties = {
        _config: { state: true },
    }

    set hass(hass : HomeAssistant) {
        this._hass = hass
    }

    // setConfig works the same way as for the card itself
    setConfig(config: LovelaceCardConfig) {
        this._config = config;
    }

    _valueChanged(ev: CustomEvent) {
        if (!this._config || !this._hass) return;
        const _config = { ...this._config, ...ev.detail.value };
        this._config = _config;
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: _config },
            bubbles: true,
            composed: true,
        }));
    }

    private _computeLabel = (schema: any) => {
        const localized = this.hass?.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
        return localized || schema.label;
    };

    render() {
        if (!this._hass || !this._config) {
        return html`<div>Invalid</div>`;
        }

        return html`
            <ha-form
                .hass=${this._hass}
                .data=${this._config}
                .schema=${SimplePlantCardEditor.schema}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._valueChanged}
            ></ha-form>
        `;
    }
}
