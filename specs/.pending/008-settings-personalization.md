# 008: Settings & Personalization

**Priority**: P3  
**Effort**: Medium  
**Status**: Pending  
**Dependencies**: 001-window-manager-foundation, 002-tab-bar-lifecycle

## Overview

Extend existing appearance controls to provide comprehensive global and per-tab personalization options, including window appearance, layout spacing, and background imagery/gradients.

## Context from PRD

From `specs/window-manager-prd.md:L91-L95`:

> Window appearance settings (opacity, blur, transparency) apply globally; users can tailor backgrounds per tab via presets.
> Tile gap size and other layout spacings respect stored preferences, leading to consistent look across sessions.
> Background imagery or gradients drawn from tab metadata influence overall workspace mood.

**Note**: Basic appearance settings (opacity, blur, transparency) are implemented in 001-window-manager-foundation. Tab background presets are partially implemented in 002-tab-bar-lifecycle (T042).

## Key Capabilities

### Global Window Appearance (Existing, Extend)

- **Opacity**: Window transparency level (0-100%)
- **Blur**: Background blur effect (macOS vibrancy)
- **Transparency**: Enable/disable transparency
- **Zoom**: Window zoom level
- Live updates as settings change
- Platform-specific handling (macOS vs. Linux/Windows)

### Layout Spacing Preferences

- **Tile gap size**: Space between blocks in layout
- **Panel spacing**: Padding around side panel
- **Tab spacing**: Tab bar padding and margins
- **Widget spacing**: Widget rail item spacing
- Preset options (compact, comfortable, spacious)
- Custom values for advanced users

### Per-Tab Background Customization

- **Background presets**: Curated color schemes, gradients, images
- **Custom backgrounds**: User-uploaded images
- **Dynamic backgrounds**: Based on tab metadata (project, branch, status)
- **Background effects**: Overlay tints, blur, opacity
- **Preview**: Live preview before applying
- **Persistence**: Backgrounds save with tab configuration

### Theme System Integration

- Light/dark/auto theme modes
- Custom theme creation and sharing
- CSS custom property override system
- Syntax highlighting theme coordination
- Icon theme selection

### Settings UI

- Settings modal or dedicated panel
- Organized sections (Appearance, Layout, Themes, Advanced)
- Live preview of changes
- Reset to defaults option
- Import/export settings

## Technical Considerations

### State Management

- Global settings (window appearance, default spacing)
- Per-tab settings (background, custom spacing)
- Settings persistence (host backend or local storage)
- Settings sync across windows/devices (optional)

### CSS Architecture

- CSS custom properties for all themeable values
- Runtime CSS variable updates
- Scoped styling for per-tab customization
- Performance of dynamic style changes

### Background Imagery

- Image loading and caching
- Image size/format optimization
- Fallback for failed loads
- Accessibility (contrast with foreground content)

### Platform Integration

- macOS vibrancy API (if applicable)
- Window transparency on Linux/Windows
- High DPI/Retina display support
- Performance on lower-end hardware

## Component Architecture

```
SettingsModal (or SettingsPanel)
├── SettingsNav (sidebar sections)
├── SettingsContent (scrollable)
│   ├── AppearanceSettings
│   │   ├── OpacitySlider
│   │   ├── BlurToggle
│   │   ├── TransparencyToggle
│   │   └── ZoomControl
│   ├── LayoutSettings
│   │   ├── TileGapSlider
│   │   ├── SpacingPresets
│   │   └── CustomSpacingInputs
│   ├── ThemeSettings
│   │   ├── ThemeModeToggle (light/dark/auto)
│   │   ├── ThemeSelector
│   │   └── CustomThemeEditor
│   └── TabBackgroundSettings
│       ├── PresetGallery
│       ├── CustomImageUpload
│       └── BackgroundEffects
└── SettingsFooter (Save, Cancel, Reset)

BackgroundPresetMenu (in tab context menu, existing)
└── PresetList (quick access to presets)
```

## Related Files

- **Foundation**: `src/lib/WindowManagerShell.svelte` (appearance application)
- **Tab Bar**: `src/lib/components/TabBar.svelte` (background presets, T042)
- **New Components**: `src/lib/components/Settings*.svelte` (to be created)
- **Types**: `src/lib/types.ts` (settings definitions)
- **Styles**: Global CSS variables for theming

## Success Criteria

### Functional

- Global appearance settings (opacity, blur, transparency, zoom) update live
- Layout spacing preferences apply consistently across all views
- Per-tab backgrounds can be set via presets or custom images
- Settings persist and restore across sessions
- Theme mode (light/dark/auto) works correctly
- Settings modal is accessible and easy to navigate

### Non-Functional

- Settings changes apply within ≤100ms
- Background image loading doesn't block UI
- Dynamic CSS variable updates don't cause reflow jank
- Settings modal is keyboard navigable

### Accessibility

- Sufficient contrast in all themes
- High-contrast mode support
- Screen reader announces setting changes
- Keyboard navigation in settings UI
- Focus indicators visible in all themes

## User Stories (to be detailed)

### US1: Global Appearance Settings

Users can adjust window opacity, blur, transparency, and zoom from a settings panel, with live preview.

### US2: Layout Spacing Preferences

Users can select preset spacing options (compact, comfortable, spacious) or customize individual spacing values.

### US3: Per-Tab Backgrounds

Users can apply background presets or upload custom images for individual tabs, with effects and preview.

### US4: Theme System

Users can switch between light/dark/auto theme modes and select from curated themes.

### US5: Settings Persistence

All settings persist across sessions and apply immediately on startup.

## Partially Implemented

From 002-tab-bar-lifecycle:

- **T042**: Background Presets submenu in tab context menu (emit selection for host to apply)

This task provides the UI for selecting presets but doesn't implement:

- The preset gallery itself
- Custom background uploads
- Background effects (overlay, blur, opacity)
- Settings persistence integration

## Next Steps

1. Complete T042 integration: wire preset selection to actual background application
2. Design settings data model and persistence contract
3. Create detailed specification following 001/002 pattern
4. Plan settings UI component hierarchy
5. Define CSS custom property architecture
6. Define testing strategy for settings application
7. Create plan.md with task breakdown
