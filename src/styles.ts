import { css } from "lit";

export const styles = css`
    .hidden {
        display: none;
    }

    /* ── Card shell ─────────────────────────────────────────────────── */

    .card-content {
        padding: 0;
        position: relative;
        overflow: hidden;
        border-radius: var(--ha-card-border-radius, 12px);
    }

    /* ── Background image ───────────────────────────────────────────── */

    hui-image {
        display: none; /* only shown via .has-image */
    }

    .has-image hui-image {
        display: block;
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
    }

    /* ── Content overlay ────────────────────────────────────────────── */

    .info {
        padding: 16px;
        position: relative;
        z-index: 1;
    }

    /* Push content down so the top of the photo shows through */
    .has-image .info {
        padding-top: 96px;
        background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.85) 0%,
            rgba(0, 0, 0, 0.6)  35%,
            rgba(0, 0, 0, 0.15) 65%,
            transparent         100%
        );
        color: rgba(255, 255, 255, 0.95);
    }

    .has-image h1,
    .has-image .content p,
    .has-image .metric-tile span {
        color: rgba(255, 255, 255, 0.95);
    }

    /* ── Typography ─────────────────────────────────────────────────── */

    h1 {
        font-weight: normal;
        font-size: 24px;
        margin-top: 8px;
        margin-bottom: 0;
        line-height: 24px;
        height: 48px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    /* ── Rows ───────────────────────────────────────────────────────── */

    .row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 16px;
    }

    .content {
        position: relative;
        overflow: hidden;
        flex: 1;
        min-width: 0;
    }

    .content p {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .sub {
        position: absolute;
        top: 0;
        left: 0;
        transform: translateY(100%);
        color: var(--secondary-text-color);
        font-size: 12px;
    }

    /* ── Buttons ────────────────────────────────────────────────────── */

    .progress-button {
        width: 100%;
        margin-top: 8px;
        padding: 10px 16px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: inherit;
        transition: filter 0.15s;
        /*
         * --rgb-primary-color and --rgb-error-color are exposed by HA themes
         * as raw "R, G, B" values, letting us use rgba() for opacity control
         * while staying on-theme. Fallbacks cover themes that don't export them.
         */
        background: linear-gradient(
            to right,
            rgba(var(--rgb-primary-color, 3, 169, 244), 0.85) var(--progress, 0%),
            rgba(var(--rgb-primary-color, 3, 169, 244), 0.12) var(--progress, 0%)
        );
    }

    .progress-button.overdue {
        background: linear-gradient(
            to right,
            rgba(var(--rgb-error-color, 176, 0, 32), 0.85) var(--progress, 100%),
            rgba(var(--rgb-error-color, 176, 0, 32), 0.15) var(--progress, 100%)
        );
    }

    .progress-button.confirming {
        animation: confirm-pulse 0.7s ease-in-out infinite;
    }

    @keyframes confirm-pulse {
        0%, 100% { filter: brightness(1); }
        50%       { filter: brightness(1.25); }
    }

    .progress-button:hover  { filter: brightness(1.1); }
    .progress-button:active { filter: brightness(0.9); }

    ha-icon-button {
        position: absolute;
        top: 8px;
        right: 8px;
        background-color: rgba(var(--rgb-card-background-color), 0.2);
        border-radius: 48px;
        z-index: 2;
    }

    /* ── Icons ──────────────────────────────────────────────────────── */

    ha-icon {
        display: flex;
        position: relative;
    }

    ha-icon[data-color] {
        color: var(--color);
    }

    ha-icon-button ha-icon::after {
        content: attr(data-days, "");
        position: absolute;
        top: calc(50% + 1px);
        left: 0;
        transform: translateY(-50%);
        width: 100%;
        font-size: 10px;
    }

    /* ── Metrics ────────────────────────────────────────────────────── */

    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(var(--sensor-columns, 5), 1fr);
        gap: 8px;
        margin-top: 8px;
    }

    .metric-tile {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        gap: 2px;
    }

    .metric-tile span {
        font-size: 11px;
        color: var(--secondary-text-color);
        text-align: center;
        white-space: nowrap;
    }
`
