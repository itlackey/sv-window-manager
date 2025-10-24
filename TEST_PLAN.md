# SV Window Manager - Comprehensive Test Plan for /test Page

## Application Overview

The `/test` page (located at `/home/founder3/code/github/itlackey/sv-window-manager/src/routes/test/+page.svelte`) is a comprehensive testing interface for the SV Window Manager's `BinaryWindow` component, which provides declarative Svelte 5-based tiling window management. The page demonstrates the core functionality of the window manager with an interactive interface for adding panes dynamically and testing various layout configurations.

### Key Features

- **BinaryWindow Component**: A declarative Svelte 5 component that manages a binary tree of panes and muntins (dividers)
- **Pre-configured Layouts**: Simple (2 panes) and Complex (3 nested panes) configurations
- **Dynamic Pane Addition**: Real-time pane creation with configurable position, title, and target
- **Interactive Controls**: Layout switcher, debug mode, and form-based pane management
- **Position System**: Support for Top, Right, Bottom, and Left positioning relative to target panes
- **Resizable Muntins**: Drag dividers to resize panes dynamically
- **Debug Mode**: Shows sash IDs and internal metrics for development

### Technical Stack

- **Framework**: Svelte 5 with modern runes ($state, $derived, $props, $effect)
- **Architecture**: Binary tree structure with Frame, Pane, Muntin, and Glass components
- **Positioning**: Declarative positioning using Position enum (Top, Right, Bottom, Left, Center)
- **Rendering**: Key-based reactivity with automatic re-renders on tree mutations

---

## Test Scenarios

### 1. Initial Page Load and Rendering

#### 1.1 Page Loads Successfully
**Steps:**
1. Navigate to `http://localhost:5173/test` (or the appropriate dev server URL)
2. Wait for page to fully load

**Expected Results:**
- Page title displays "Frame Component Test - SV BWIN"
- Header shows "Frame Component Test" with subtitle
- Control panel with radio buttons (Simple Layout, Complex Layout) is visible
- Debug Mode checkbox is visible and unchecked
- "Add Pane Dynamically" section is visible with form controls
- Window manager container (frame-container) is visible with 800x800px dimensions
- Information sections at the bottom are visible and readable

#### 1.2 Simple Layout Renders by Default
**Steps:**
1. Load the /test page
2. Observe the frame container

**Expected Results:**
- Simple Layout radio button is selected by default
- Two panes are visible in the container
- Left pane displays: "This is the left pane content. The Frame component positions this pane on the left side."
- Right pane displays: "This is the right pane content. Frame handles the layout declaratively using Svelte 5 runes."
- Both panes have title bars with "Left Pane" and "Right Pane" labels
- Panes occupy equal width (approximately 400px each)
- A vertical muntin (divider) separates the two panes
- Container background is gray (#e0e0e0)

#### 1.3 Window Chrome Renders Correctly
**Steps:**
1. Load the /test page with simple layout
2. Examine each pane's title bar

**Expected Results:**
- Each pane has a title bar (Glass component header)
- Title text is visible and matches configuration ("Left Pane", "Right Pane")
- Action buttons are visible in title bars (close, minimize, maximize if implemented)
- Title bars are styled according to CSS custom properties
- Content area is distinct from title bar

---

### 2. Layout Configuration Switching

#### 2.1 Switch to Complex Layout
**Steps:**
1. Load the /test page (defaults to Simple Layout)
2. Click the "Complex Layout (3 panes, nested)" radio button
3. Observe the frame container

**Expected Results:**
- Complex Layout radio button becomes selected
- Layout changes immediately (using Svelte key block reactivity)
- Three panes are now visible:
  - **Top Pane**: Full width at the top, displaying "Top Pane" heading and "This is a top pane with nested children below."
  - **Bottom Left Pane**: Lower left quadrant, displaying "Bottom Left" heading and "Nested pane demonstrating complex layouts."
  - **Bottom Right Pane**: Lower right quadrant, displaying "Bottom Right" heading and "Try dragging the muntins (dividers) to resize!"
- Top pane occupies approximately 200px height
- Bottom area is split 50/50 between left and right panes
- Two muntins are visible: one horizontal (between top and bottom) and one vertical (between bottom left and bottom right)

#### 2.2 Switch Back to Simple Layout
**Steps:**
1. Start with Complex Layout active
2. Click the "Simple Layout (2 panes)" radio button
3. Observe the frame container

**Expected Results:**
- Simple Layout radio button becomes selected
- Layout reverts to two-pane configuration
- All three panes from complex layout are removed
- Original two panes (Left and Right) are rendered
- Form controls update to reflect available panes

#### 2.3 Rapid Layout Switching
**Steps:**
1. Click "Simple Layout" radio button
2. Immediately click "Complex Layout" radio button
3. Repeat 5-10 times quickly
4. Wait 2 seconds for final render

**Expected Results:**
- No JavaScript errors in console
- Final layout matches the selected radio button
- No visual glitches or broken layouts
- Frame container remains properly sized
- All panes render with correct content

---

### 3. Debug Mode Functionality

#### 3.1 Enable Debug Mode
**Steps:**
1. Load the /test page with any layout
2. Check the "Debug Mode" checkbox
3. Examine the panes

**Expected Results:**
- Debug Mode checkbox is checked
- Sash IDs become visible in each pane's content area
- IDs are prepended to existing content
- IDs follow pattern like "sash-1", "sash-2", etc.
- Metrics or additional debug information may be visible (if implemented)

#### 3.2 Disable Debug Mode
**Steps:**
1. Start with Debug Mode enabled
2. Uncheck the "Debug Mode" checkbox
3. Examine the panes

**Expected Results:**
- Debug Mode checkbox is unchecked
- Sash IDs are no longer visible
- Panes display only their regular content
- Layout remains unchanged

#### 3.3 Debug Mode Persists with Layout Switch
**Steps:**
1. Enable Debug Mode
2. Switch from Simple to Complex layout
3. Observe panes

**Expected Results:**
- Debug Mode remains enabled
- Sash IDs are visible in all panes of the new layout
- IDs are unique for each pane in the new configuration

---

### 4. Dynamic Pane Addition

#### 4.1 View Available Target Panes
**Steps:**
1. Load the /test page with Simple Layout
2. Examine the "Target Pane" dropdown in the Add Pane form

**Expected Results:**
- Dropdown displays available panes
- Each option shows: "Title (sash-id)" format (e.g., "Left Pane (sash-1)")
- At least 2 options are available for Simple Layout
- Dropdown has a default selection (first available pane)
- Options update when layout changes

#### 4.2 Add Pane to the Right
**Steps:**
1. Load Simple Layout
2. In the Add Pane form:
   - Target Pane: Select "Right Pane"
   - Position: Select "Right"
   - Title: Enter "Test Right Pane"
3. Click "Add Pane" button
4. Observe the layout

**Expected Results:**
- A new pane appears to the right of the Right Pane
- New pane displays:
  - Heading: "Test Right Pane"
  - Text: "This is a dynamically added pane at position **Right**."
  - Timestamp: Current time (e.g., "Added at 2:45:30 PM")
- Layout adjusts to accommodate 3 panes horizontally
- Each pane's width decreases proportionally
- New pane is approximately 300px wide (as configured)
- Vertical muntins separate all panes
- Form resets: Title field updates to "New Pane 2", counter increments

#### 4.3 Add Pane to the Top
**Steps:**
1. Start with Simple Layout
2. In the Add Pane form:
   - Target Pane: Select "Left Pane"
   - Position: Select "Top"
   - Title: Enter "Top Header"
3. Click "Add Pane" button

**Expected Results:**
- A new pane appears above the Left Pane
- New pane displays: "Top Header" heading and "at position **Top**" text
- New pane is approximately 200px tall (as configured for top/bottom positions)
- Horizontal muntin separates the new pane from the pane below
- Right Pane remains unchanged (only Left Pane's area is split)
- Layout shows nested structure: Top Header above Left Pane, with Right Pane still occupying right half

#### 4.4 Add Pane to the Bottom
**Steps:**
1. Load Simple Layout
2. Add a pane to the Bottom of Right Pane with title "Footer Pane"
3. Click "Add Pane"

**Expected Results:**
- New pane appears below the Right Pane
- Pane displays "Footer Pane" heading
- Horizontal muntin separates Footer Pane from pane above
- Height is approximately 200px
- Left Pane remains full height on the left

#### 4.5 Add Pane to the Left
**Steps:**
1. Start with Simple Layout
2. Add a pane to the Left of Left Pane with title "Sidebar"
3. Click "Add Pane"

**Expected Results:**
- New pane appears to the left of the existing Left Pane
- Sidebar pane is created with title "Sidebar"
- Width is approximately 300px
- Vertical muntin separates Sidebar from other panes
- Now three panes exist: Sidebar | Left Pane | Right Pane

#### 4.6 Add Multiple Panes Sequentially
**Steps:**
1. Start with Simple Layout (2 panes)
2. Add pane to Right of Right Pane → Title: "Pane 3"
3. Add pane to Bottom of "Pane 3" → Title: "Pane 4"
4. Add pane to Top of Left Pane → Title: "Pane 5"
5. Add pane to Left of Left Pane → Title: "Pane 6"
6. Observe the final layout

**Expected Results:**
- All 6 panes are visible (original 2 + 4 new ones)
- Each pane displays its configured title
- Panes are positioned correctly relative to their targets
- Muntins separate all adjacent panes
- No overlapping content
- Layout is visually coherent and organized
- Dropdown now shows 6 available target panes
- Counter shows "New Pane 7" in the title field

#### 4.7 Add Pane with Empty Title
**Steps:**
1. Load Simple Layout
2. Clear the "Title" input field (delete all text)
3. Select any target and position
4. Click "Add Pane"

**Expected Results:**
- Pane is added successfully
- Title defaults to "Pane X" where X is the counter value (e.g., "Pane 1")
- Pane content shows the default title in the heading
- No error messages appear

#### 4.8 Add Pane with Special Characters in Title
**Steps:**
1. Load Simple Layout
2. Enter title: `Test <Pane> & "Quotes" 'Single' 123 !@#$%`
3. Select position: Right
4. Click "Add Pane"

**Expected Results:**
- Pane is added successfully
- Title is properly escaped and rendered (HTML entities handled)
- Special characters display correctly without breaking layout
- No XSS vulnerabilities (HTML tags are escaped)

---

### 5. Error Handling and Validation

#### 5.1 No Target Pane Selected (Edge Case)
**Steps:**
1. Load the page
2. Use browser DevTools to clear the dropdown value (if possible)
3. Click "Add Pane"

**Expected Results:**
- Error message appears: "Please select a target pane"
- Message is displayed in red error box with border
- No pane is added
- Layout remains unchanged
- Error message is dismissible or clears on next interaction

#### 5.2 Invalid Position Value (Edge Case)
**Note**: This requires manual manipulation or code change to test

**Expected Results:**
- If an invalid position is somehow provided, graceful error handling occurs
- Error message indicates the problem
- System does not crash

#### 5.3 Add Pane When Container is Missing (Edge Case)
**Note**: This tests internal error handling

**Expected Results:**
- If BinaryWindow component is not initialized, error message shows: "BinaryWindow component not initialized"
- No pane is added
- Console may log additional error details

---

### 6. Muntin (Divider) Interactions

#### 6.1 Identify Muntins
**Steps:**
1. Load Simple Layout
2. Locate the divider between Left and Right panes

**Expected Results:**
- Vertical muntin (divider) is visible between panes
- Muntin has distinct styling (color, width)
- Muntin is centered between panes with 8px width (muntinSize)
- Muntin extends full height of the panes
- Muntin is visually distinguishable from pane content

#### 6.2 Hover Over Muntin
**Steps:**
1. Load Simple Layout
2. Move mouse cursor over the vertical muntin

**Expected Results:**
- Cursor changes to resize cursor (e.g., col-resize for vertical, row-resize for horizontal)
- Muntin may change color or show hover state (if styled)
- Visual feedback indicates interactivity

#### 6.3 Drag Muntin to Resize Panes (Vertical)
**Steps:**
1. Load Simple Layout
2. Click and hold on the vertical muntin between Left and Right panes
3. Drag muntin 100px to the right
4. Release mouse button
5. Observe pane sizes

**Expected Results:**
- While dragging, visual feedback shows muntin moving
- Left Pane width increases by ~100px
- Right Pane width decreases by ~100px
- Total container width remains constant
- Pane content reflows to fit new dimensions
- Smooth visual transition (no flickering)

#### 6.4 Drag Muntin to Resize Panes (Horizontal)
**Steps:**
1. Load Complex Layout
2. Drag the horizontal muntin (between Top and Bottom panes) down by 50px
3. Release

**Expected Results:**
- Top Pane height increases by ~50px
- Bottom section height decreases by ~50px
- Vertical muntin in bottom section adjusts to new height
- All pane content reflows correctly

#### 6.5 Drag Muntin to Minimum Width/Height
**Steps:**
1. Load Simple Layout
2. Drag vertical muntin all the way to the left (attempt to collapse Left Pane)
3. Observe behavior

**Expected Results:**
- Pane resizing stops at minimum width threshold
- Left Pane does not disappear or collapse to 0px
- Minimum width is enforced (likely defined in Sash configuration)
- Muntin cannot be dragged beyond the minimum
- Dragging resistance or visual indicator may appear

#### 6.6 Drag Muntin to Maximum Width/Height
**Steps:**
1. Load Simple Layout
2. Drag vertical muntin all the way to the right (attempt to collapse Right Pane)
3. Observe behavior

**Expected Results:**
- Right Pane maintains minimum width
- Muntin stops at the maximum drag position
- Left Pane does not exceed maximum allowed width
- Layout constraints are respected

#### 6.7 Rapid Muntin Dragging
**Steps:**
1. Load Complex Layout
2. Quickly drag vertical muntin left and right multiple times
3. Quickly drag horizontal muntin up and down multiple times
4. Observe performance and stability

**Expected Results:**
- No lag or performance issues
- Smooth dragging experience
- No visual artifacts or broken layouts
- Frame rate remains stable
- All panes update correctly

---

### 7. Window Chrome and Glass Components

#### 7.1 Examine Glass Component Structure
**Steps:**
1. Load Simple Layout
2. Inspect a pane using DevTools

**Expected Results:**
- Each pane contains a Glass component
- Glass includes:
  - Header section (title bar)
  - Content area (pane content)
  - Optional action buttons (close, minimize, maximize)
- Glass is styled with CSS custom properties (--bw-glass-*)
- Glass fills the pane completely

#### 7.2 Title Bar Display
**Steps:**
1. Load any layout
2. Examine title bars of all panes

**Expected Results:**
- Each pane displays its configured title in the title bar
- Title text is readable and styled appropriately
- Title bar has distinct background color (--bw-glass-header-bg-color)
- Title bar height is consistent (--bw-glass-header-height: 30px)

#### 7.3 Action Buttons Visibility
**Steps:**
1. Load Simple Layout
2. Examine title bar action buttons

**Expected Results:**
- Action buttons (if implemented) are visible in title bar
- Buttons may include: close (×), minimize (_), maximize (□)
- Buttons are styled and positioned correctly
- Hover states work (if implemented)

#### 7.4 Glass Border and Styling
**Steps:**
1. Load any layout
2. Examine pane borders

**Expected Results:**
- Glass components have borders defined by --bw-glass-border-color
- Border radius is applied (--bw-glass-border-radius: 5px)
- Clearance/gap between glass and pane edge (--bw-glass-clearance: 2px)
- Background color is consistent (--bw-glass-bg-color)

---

### 8. Drag and Drop Functionality

**Note**: The test page uses a declarative configuration approach. Drag-and-drop of panes/glasses may be implemented in the BinaryWindow component but is not directly exposed in the test page interface. These tests apply to the underlying component if drag-and-drop is supported.

#### 8.1 Identify Draggable Elements
**Steps:**
1. Load any layout
2. Move cursor over pane title bars
3. Observe cursor changes and visual hints

**Expected Results:**
- If drag-and-drop is implemented, cursor changes to grab/move cursor over title bars
- Draggable attribute or visual indicator is present
- Non-draggable areas (content) show default cursor

#### 8.2 Drag Pane to Center Position (Swap)
**Steps:**
1. Load Simple Layout
2. Click and drag Left Pane's title bar
3. Drop it over the center of Right Pane
4. Observe behavior

**Expected Results:**
- If center-drop is implemented, panes swap positions
- Left Pane content now appears in right position
- Right Pane content appears in left position
- Layout structure remains intact
- Muntins remain in place

#### 8.3 Drag Pane to Edge (Create Split)
**Steps:**
1. Load Simple Layout
2. Drag Left Pane title bar
3. Drop it over the right edge of Right Pane
4. Observe behavior

**Expected Results:**
- If edge-drop is implemented, a new pane is created to the right
- Original pane is removed from left position
- Pane appears in new position with original content
- New muntin is created to separate panes
- Layout adjusts to accommodate new structure

#### 8.4 Drag Pane Outside Container
**Steps:**
1. Load any layout
2. Drag a pane title bar outside the container bounds
3. Release mouse button

**Expected Results:**
- Pane returns to original position (drag is cancelled)
- No error occurs
- Layout remains unchanged
- Visual feedback indicates invalid drop zone

---

### 9. CSS Custom Properties and Theming

#### 9.1 Verify Default Theme
**Steps:**
1. Load the /test page
2. Examine colors and spacing

**Expected Results:**
- Window manager uses default CSS custom properties
- Colors match documentation (e.g., --bw-pane-bg-color: hsla(0, 0%, 20%, 1))
- Muntins have correct background color (--bw-muntin-bg-color)
- Glass components use configured colors
- Spacing is consistent (gaps, clearance, border radius)

#### 9.2 Test Container Dimensions
**Steps:**
1. Load the page
2. Measure the frame-container element

**Expected Results:**
- Container has fixed dimensions in test page: 500px height, 100% width
- Container has 2px solid border (#333)
- Background color is #e0e0e0
- Container is properly contained within the page layout

#### 9.3 Verify Typography
**Steps:**
1. Examine text in panes, titles, and controls

**Expected Results:**
- Font family inherits from page (--bw-font-family: inherit)
- Font size is consistent and readable
- Titles in panes use appropriate heading styles
- Content text is legible

---

### 10. Accessibility Testing

#### 10.1 Keyboard Navigation - Controls
**Steps:**
1. Load the page
2. Press Tab key repeatedly to navigate through controls
3. Test:
   - Radio buttons (Simple/Complex Layout)
   - Debug Mode checkbox
   - Target Pane dropdown
   - Position dropdown
   - Title input
   - Add Pane button

**Expected Results:**
- All interactive controls are keyboard accessible
- Focus indicators are visible (browser default or custom)
- Tab order is logical (top to bottom, left to right)
- Radio buttons can be selected with arrow keys
- Checkbox can be toggled with Space key
- Dropdowns can be opened and navigated with arrow keys
- Button can be activated with Enter/Space key

#### 10.2 Keyboard Navigation - Panes
**Steps:**
1. Load any layout
2. Tab through the page to reach panes
3. Attempt to focus on pane content

**Expected Results:**
- If panes contain focusable content, Tab reaches it
- Pane titles may be focusable (if implemented)
- Action buttons in title bars are keyboard accessible
- Logical focus order through all panes

#### 10.3 Screen Reader Compatibility (Manual Test)
**Steps:**
1. Enable screen reader (NVDA, JAWS, VoiceOver)
2. Navigate through the page
3. Listen to announcements

**Expected Results:**
- Page title is announced
- Control labels are announced correctly
- Form fields have associated labels
- Buttons announce their purpose
- Pane content is accessible and announced
- Layout changes announce updates (if ARIA live regions are implemented)

#### 10.4 ARIA Roles and Attributes
**Steps:**
1. Inspect HTML with DevTools
2. Check for ARIA attributes

**Expected Results:**
- Form controls have proper labels (for/id association or aria-label)
- Radio buttons are grouped with role="radiogroup" or fieldset
- Panes may have role="region" or role="article" with aria-label
- Action buttons have aria-label if icon-only
- Error messages use aria-live or aria-describedby

#### 10.5 Color Contrast
**Steps:**
1. Use a contrast checker tool (e.g., browser DevTools, WAVE)
2. Check text/background contrast ratios

**Expected Results:**
- All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Title text on colored backgrounds is readable
- Form labels and instructions have sufficient contrast
- Error messages have high contrast

#### 10.6 Focus Management on Layout Switch
**Steps:**
1. Focus on a pane or control
2. Switch layout (Simple ↔ Complex)
3. Observe focus behavior

**Expected Results:**
- Focus is not lost when layout changes
- Focus moves to a logical element (e.g., first pane, or remains on control)
- No focus trap occurs

---

### 11. Responsive Behavior and Viewport Changes

#### 11.1 Horizontal Viewport Resize
**Steps:**
1. Load the page in full-width browser window
2. Slowly resize browser window narrower
3. Observe layout behavior down to 768px width

**Expected Results:**
- Page layout remains functional
- Control panels stack or adjust on smaller screens (see CSS @media query at 768px)
- Form fields in Add Pane section switch to single-column grid on mobile
- Frame container width adjusts (100% width)
- Pane content remains visible and readable
- No horizontal scrolling within panes (unless content requires it)

#### 11.2 Vertical Viewport Resize
**Steps:**
1. Load the page
2. Resize browser window shorter
3. Observe scrolling behavior

**Expected Results:**
- Page becomes vertically scrollable
- Frame container remains 500px height (fixed)
- Header, controls, and info sections scroll naturally
- Frame container position remains stable during scroll

#### 11.3 Mobile Device Simulation (< 768px)
**Steps:**
1. Open DevTools and enable device emulation (e.g., iPhone 12)
2. Load the page
3. Navigate and interact with controls

**Expected Results:**
- Layout is functional on mobile viewport
- Radio buttons remain usable
- Form inputs stack vertically (single column grid)
- Buttons are tappable with appropriate touch target size
- Frame container adjusts to screen width
- Panes remain visible (may be very small)
- Text remains legible

#### 11.4 Test Container Resize with Multiple Panes
**Steps:**
1. Load Simple Layout
2. Add 3 additional panes to create a complex layout
3. Resize browser window horizontally

**Expected Results:**
- All panes scale proportionally
- Muntins remain functional and draggable
- Minimum pane sizes are respected
- No pane disappears or becomes invisible
- Layout integrity is maintained

---

### 12. State Management and Reactivity

#### 12.1 State Persistence During Interaction
**Steps:**
1. Load Simple Layout
2. Add 2 panes dynamically
3. Switch to Complex Layout
4. Switch back to Simple Layout

**Expected Results:**
- After switching back to Simple, original 2 panes are restored (dynamically added panes are lost)
- This is expected behavior due to key block reactivity
- Layout is clean and reset to initial configuration
- No ghost panes or broken state

#### 12.2 Pane Counter Incrementation
**Steps:**
1. Load the page
2. Note the counter value in Title field (starts at "New Pane 1")
3. Add 5 panes sequentially
4. Observe title field after each addition

**Expected Results:**
- Counter increments correctly: New Pane 2, New Pane 3, ... New Pane 6
- Counter persists across pane additions
- Counter does not reset when changing target or position
- Counter reflects total number of panes added during session

#### 12.3 Dropdown Updates Dynamically
**Steps:**
1. Load Simple Layout (2 panes available)
2. Note dropdown shows 2 options
3. Add a pane to the Right
4. Check dropdown again

**Expected Results:**
- Dropdown now shows 3 pane options
- New pane is included in the list with correct title and ID
- Dropdown options are sorted or ordered logically
- Selection remains on current target (or updates to new default)

#### 12.4 Error Message Clears on Success
**Steps:**
1. Trigger an error (e.g., manipulate page to cause "Please select a target pane" error)
2. Note error message appears
3. Correct the issue and add a pane successfully
4. Observe error message

**Expected Results:**
- Error message clears when `addNewPane()` succeeds
- No stale error messages persist
- Success is indicated by new pane appearing

---

### 13. Performance and Stress Testing

#### 13.1 Add Many Panes (10+ panes)
**Steps:**
1. Load Simple Layout
2. Repeatedly add panes (10-15 times) with varying positions
3. Observe performance and layout

**Expected Results:**
- Page remains responsive
- No significant lag when adding panes
- All panes are rendered correctly
- Dropdown still functions with many options
- Layout is complex but coherent
- No memory leaks (check DevTools Memory tab)

#### 13.2 Rapid Clicking Add Pane Button
**Steps:**
1. Load Simple Layout
2. Click "Add Pane" button rapidly 10 times in quick succession
3. Wait for operations to complete
4. Observe results

**Expected Results:**
- All panes are added (or duplicate additions are prevented)
- No race conditions or broken state
- Layout remains stable
- Counter increments correctly
- No JavaScript errors

#### 13.3 Resize Muntins Rapidly with Many Panes
**Steps:**
1. Create layout with 8+ panes
2. Rapidly drag multiple muntins back and forth
3. Observe rendering performance

**Expected Results:**
- Smooth dragging experience (no jank)
- Panes update in real-time
- No rendering artifacts
- Frame rate remains acceptable (>30 FPS ideally)

#### 13.4 Long Session Usage
**Steps:**
1. Load the page
2. Perform various operations for 5+ minutes:
   - Switch layouts multiple times
   - Add/remove panes
   - Resize muntins
   - Toggle debug mode
3. Monitor browser performance

**Expected Results:**
- No memory leaks (memory usage remains stable)
- Performance does not degrade over time
- Page remains responsive
- No console errors accumulate

---

### 14. Browser Compatibility

**Note**: These tests should be performed across different browsers to ensure compatibility.

#### 14.1 Chrome/Chromium-based Browsers
**Steps:**
1. Open page in Chrome, Edge, Brave, or Opera
2. Execute key test scenarios (1.1, 2.1, 4.2, 6.3)

**Expected Results:**
- All functionality works as expected
- Styles render correctly
- No browser-specific bugs

#### 14.2 Firefox
**Steps:**
1. Open page in Firefox
2. Execute key test scenarios

**Expected Results:**
- Full compatibility with Firefox
- CSS custom properties work correctly
- Dragging and resizing function properly
- No console warnings or errors

#### 14.3 Safari (macOS/iOS)
**Steps:**
1. Open page in Safari
2. Execute key test scenarios

**Expected Results:**
- Layout renders correctly
- Svelte 5 runes work in Safari
- Webkit-specific styles (scrollbars) function
- Touch interactions work on iOS Safari

---

### 15. Edge Cases and Boundary Conditions

#### 15.1 Switching Layout While Dragging Muntin
**Steps:**
1. Load Simple Layout
2. Start dragging a muntin (click and hold)
3. While holding, switch to Complex Layout using free hand
4. Release mouse button

**Expected Results:**
- Drag operation is cancelled gracefully
- Layout switches to Complex configuration
- No broken state or JavaScript errors
- New layout renders correctly

#### 15.2 Very Long Pane Title (100+ characters)
**Steps:**
1. Load Simple Layout
2. Enter a title with 150 characters: `This is a very long pane title that exceeds normal expectations and should test how the UI handles overflow text in title bars and form inputs across multiple lines if needed for comprehensive testing purposes`
3. Add pane

**Expected Results:**
- Title is accepted and pane is created
- Title in pane heading wraps or truncates gracefully
- Form input handles long text (scrollable or wraps)
- Layout is not broken by long title

#### 15.3 Special Position Values (Invalid)
**Note**: Requires manual code manipulation

**Expected Results:**
- If invalid position is provided (not Top/Right/Bottom/Left), error is caught
- Graceful error message or fallback to default position
- System does not crash

#### 15.4 Zero or Negative Size Values
**Note**: Requires manual code manipulation in addNewPane() function

**Expected Results:**
- If size is set to 0 or negative, minimum size constraints apply
- Pane is created with minimum viable size
- No layout breakage

#### 15.5 Add Pane to Non-existent Target ID
**Steps:**
1. Use DevTools to modify dropdown option value to "non-existent-id"
2. Click Add Pane

**Expected Results:**
- Error is caught and handled gracefully
- Error message displays: "Failed to add pane" or similar
- Console logs detailed error
- Page does not crash

---

### 16. Information Sections and Documentation

#### 16.1 Component Features List
**Steps:**
1. Scroll to "Component Features" section
2. Read through the list

**Expected Results:**
- List is visible and readable
- Features accurately describe the page functionality:
  - Declarative Rendering (runes)
  - Regular HTML Elements
  - Automatic Updates
  - Resizable Muntins
  - Window Chrome
  - Debug Mode
- Formatting is clean with strong/bold keywords

#### 16.2 Architecture Description
**Steps:**
1. Scroll to "Architecture" section
2. Review component descriptions

**Expected Results:**
- Lists all key components:
  - BinaryWindow.svelte
  - Frame.svelte
  - Pane.svelte
  - Muntin.svelte
  - Glass.svelte
- Descriptions accurately explain each component's role
- Clear hierarchy and relationships described

#### 16.3 How It Works Section
**Steps:**
1. Scroll to "How It Works" section
2. Read the ordered list

**Expected Results:**
- Step-by-step process is described clearly
- Technical details are accurate:
  1. Configuration passing
  2. Tree building with ConfigRoot
  3. Derived panes/muntins using $derived.by()
  4. Declarative rendering with #each blocks
  5. Glass component creation
  6. Key blocks for reactivity
- Information aids understanding of the architecture

---

## Test Environment Requirements

### Prerequisites
- **Node.js**: Version 18+ (for SvelteKit development)
- **Development Server**: Running on `http://localhost:5173` or custom port
  - Start with: `npm run dev`
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Screen Resolution**: Minimum 1280x720 for optimal testing experience

### Setup Steps
1. Clone repository: `git clone [repository-url]`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Navigate to: `http://localhost:5173/test`

### Testing Tools (Optional)
- **Browser DevTools**: For inspecting elements, console logs, network activity
- **Accessibility Tools**: WAVE, axe DevTools, Lighthouse
- **Screen Readers**: NVDA (Windows), JAWS (Windows), VoiceOver (macOS)
- **Performance Tools**: Chrome DevTools Performance/Memory tabs
- **Responsive Testing**: Browser device emulation or physical devices

---

## Test Execution Guidelines

### Test Priority Levels

**P0 - Critical (Must Pass)**
- 1.1, 1.2, 1.3 (Initial Load)
- 2.1, 2.2 (Layout Switching)
- 4.2, 4.3, 4.4, 4.5 (Basic Pane Addition)
- 6.3, 6.4 (Muntin Resizing)

**P1 - High (Should Pass)**
- 3.1, 3.2 (Debug Mode)
- 4.6 (Multiple Panes)
- 5.1, 5.3 (Error Handling)
- 7.1, 7.2 (Window Chrome)
- 11.1, 11.2 (Responsive)

**P2 - Medium (Nice to Have)**
- 4.7, 4.8 (Edge Cases)
- 6.5, 6.6, 6.7 (Advanced Muntin)
- 8.1-8.4 (Drag and Drop - if implemented)
- 10.1-10.6 (Accessibility)

**P3 - Low (Optional)**
- 9.1-9.3 (CSS Theming)
- 13.1-13.4 (Performance)
- 15.1-15.5 (Edge Cases)

### Recommended Test Sequence
1. Run all P0 tests first to validate core functionality
2. Execute P1 tests to ensure feature completeness
3. Perform P2 tests for quality and accessibility
4. Optional: Run P3 tests for edge cases and performance validation

### Bug Reporting
When issues are found, report with:
- **Test Scenario ID** (e.g., 4.2)
- **Steps to Reproduce**
- **Expected vs. Actual Results**
- **Browser/OS** information
- **Screenshots/Videos** if applicable
- **Console Errors** if present

---

## Conclusion

This test plan provides comprehensive coverage of the `/test` page functionality for the SV Window Manager. The scenarios test core features, user interactions, error handling, accessibility, performance, and edge cases. By executing these tests systematically, QA teams can ensure the BinaryWindow component and its declarative Svelte 5 implementation are robust, user-friendly, and production-ready.

**Total Test Scenarios**: 71 detailed test cases across 16 major categories

**Estimated Testing Time**:
- Quick smoke test (P0 only): 15-20 minutes
- Full test suite (P0-P2): 2-3 hours
- Complete testing (all scenarios): 4-6 hours
