# Wave Terminal UI PRD

- Wave Terminal opens with the user’s active workspace restored, tabs and blocks preloaded, title reflecting the current tab, and zoom/visual settings applied so the window feels ready immediately.
- Application surfaces system tools such as notifications, flash errors, and configuration health so users spot issues without leaving the terminal workflow.
- Host environment controls appearance and behavior (platform detection, zoom, transparency, notifications), while the renderer responds instantly to those directives.

## Goals

- Deliver a responsive multi-tab terminal workspace that remembers layout, tab order, and visual preferences.
- Provide AI assistance directly alongside the terminal flow, with smooth focus transitions and optional context sharing.
- Keep users informed about configuration errors, updates, and transient issues through inline UI elements.
- Allow deep window styling (opacity, blur, background imagery) so the terminal fits user aesthetic or accessibility preferences.

## Non-Goals

- Persisting workspace definitions locally; creation, deletion, and naming remain host responsibilities.
- Running or managing terminal commands within the UI; execution continues to rely on backend services.
- Managing OS-level window chrome on macOS beyond respecting drag regions and transparency flags.
- Hosting or executing AI models locally; chat experiences remain cloud-backed.

## User Personas

- Power terminal users juggling many sessions who need quick tab switching and remembered layouts.
- Site reliability and platform engineers who combine terminal output with dashboards or widgets.
- Developers experimenting with AI to interpret command output or summarize code.
- Newcomers who lean on curated widgets and presets to launch tasks quickly.

## Key Scenarios

- Launch terminal → previous workspace reappears with tabs, blocks, and layout intact.
- Drag tab to re-order or pin it; pinned tabs stay visible regardless of workspace scroll.
- Pop open AI panel, drop a log file, and request a summary while continuing work in the main terminal pane.
- Switch workspaces to jump between project environments or save the current tab/layout setup for later reuse.

## Initialization

- App hides startup flicker, loads fonts, applies zoom, and waits until data is ready, then reveals the UI and signals “ready” to the host.
- Global keyboard shortcuts and context menus activate immediately, ensuring platform-consistent behavior.
- Workspace data (client, window, tabs) is fetched and cached before first render to avoid empty states.

## Global Interaction

- Right-click context menu adapts to clipboard contents, enabling quick copy/paste or opening URLs in a web block.
- Keyboard handling supports cross-platform shortcuts (e.g., app-level focus, tab navigation) and integrates with mouse interactions.
- Window-level personalization (transparency, opacity, background color/image) updates live as settings change.
- Flash-error overlay displays transient problems, allows click-to-copy, and auto-cleans expired entries.

## Tab Bar

- Tabs blend pinned and regular sessions, auto-sizing to available width and enabling horizontal scroll when necessary.
- Tab drag-and-drop supports reordering, snapping, and auto-scrolling near edges; changes persist in workspace state.
- New tabs appear with smooth roll-in animation; closing a tab removes it without disrupting focus.
- Tab bar houses AI toggle, workspace switcher, add-tab button, and system banners (updates, config errors).
- Config error indicator highlights issues and provides quick access to detailed messaging.

## Tab Lifecycle & Customization

- Renaming a tab is a direct inline interaction with validation to prevent empties; names persist through backend services.
- Context menu exposes pin/unpin, rename, copy tab ID, background presets, and close actions.
- Pinned tabs show a thumbtack indicator and subtle animation when activated for visual confirmation.
- Tabs maintain references to their block layouts, allowing consistent restoration across sessions.

## Workspace Layout & Blocks

- Each tab renders its saved block layout; “Tab Loading,” “Tab Not Found,” or empty states communicate status clearly.
- Blocks represent views such as terminal, web, preview, AI results, system stats, or quick tips.
- Blocks include headers with icon, name, optional text buttons, connection controls, magnify, and close options.
- Users can magnify a block to focus on one view, add ephemeral blocks to layouts, and manage block-level context menus.

## Wave AI Panel

- AI panel lives in a resizable side pane that remembers preferred width and visibility.
- Chat supports text input, keyboard shortcuts (new chat, focus), file drag/drop with validation, and toggled widget context sharing.
- Welcome state introduces features; subsequent chats show history with rate-limit indicators and error messaging.
- Panel header includes context toggle, options menu (new chat, hide panel), and maintains focus visuals for accessibility.
- Input composer auto-resizes, supports file uploads, and communicates send/stream states clearly.

## Widgets & Auxiliary UI

- Widget rail reflows between standard, compact, and super-compact layouts based on available height.
- Widgets launch predefined blocks (terminal, help, dashboards, etc.) in the active tab; icons and colors reflect intent.
- Context menu offers quick access to edit widget configuration and toggle help/tutorial entries.
- Development builds display a subtle badge so testers know they’re not in production.

## Notifications & Modals

- Modal system overlays the workspace for confirmations, editors, or large dialogs without leaving context.
- Notification bubbles (dev builds) summarize events or background tasks.
- Flash errors and configuration banners share space with core UI but remain dismissible.

## Settings & Personalization

- Window appearance settings (opacity, blur, transparency) apply globally; users can tailor backgrounds per tab via presets.
- Tile gap size and other layout spacings respect stored preferences, leading to consistent look across sessions.
- Background imagery or gradients drawn from tab metadata influence overall workspace mood.

## Non-Functional Requirements

- Reinitialization should refresh data caches and restore focus without visible flicker.
- Layout must respond to window resize, AI panel toggles, and tab changes quickly, keeping transitions smooth.
- Drag interactions and animations need to feel fluid, with debounced calculations preventing jank.
- Accessibility preferences (reduced motion, focus outlines) propagate throughout the UI.

## Open Questions & Risks

- Document title still relies on manual updates; ensure tab renames flow through without delay.
- Widget gallery may need search/filter if configurations grow large; evaluate user feedback.
- AI panel file-size/error messaging should align with backend limits and be documented clearly.
- Startup “nohover” hack mitigates hover flicker; consider a permanent styling solution in future iterations.

## Next Steps

1. Circulate this functionality-focused PRD with product/design to confirm scope and identify UX validation needs.
2. Translate requirements into roadmap items (tab personalization, AI panel polish, widget UX enhancements) with sizing and ownership.
