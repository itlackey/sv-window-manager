# 005: Wave AI Panel

**Priority**: P2  
**Effort**: Large  
**Status**: Pending  
**Dependencies**: 001-window-manager-foundation (side panel container exists)

## Overview

Implement the Wave AI chat interface in the existing side panel container, with conversation history, file upload, context sharing, and keyboard-driven interaction.

## Context from PRD

From `specs/window-manager-prd.md:L70-L76`:

> AI panel lives in a resizable side pane that remembers preferred width and visibility.
> Chat supports text input, keyboard shortcuts (new chat, focus), file drag/drop with validation, and toggled widget context sharing.
> Welcome state introduces features; subsequent chats show history with rate-limit indicators and error messaging.
> Panel header includes context toggle, options menu (new chat, hide panel), and maintains focus visuals for accessibility.
> Input composer auto-resizes, supports file uploads, and communicates send/stream states clearly.

## Key Capabilities

### Panel Infrastructure

- Uses existing side panel from 001-window-manager-foundation
- Remembers width and visibility preferences
- Smooth resize with drag handle
- Keyboard shortcut to show/hide (already implemented)

### Chat Interface

- Conversation history display
- Message bubbles (user vs. AI)
- Streaming response animation
- Rate-limit indicators
- Error message display
- Auto-scroll to latest message

### Input Composer

- Multi-line text input
- Auto-resize based on content (max 5-6 lines)
- File drag-and-drop zone
- File upload validation (size, type)
- Send button with state indication (idle, sending, streaming)
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)

### Context Sharing

- Toggle to include widget/workspace context with queries
- Visual indication when context is enabled
- Context preview/summary in UI
- Clear communication about what's shared

### Keyboard Shortcuts

- **Focus chat input**: Global shortcut (e.g., Cmd+Shift+K)
- **New chat**: Clear history and start fresh (e.g., Cmd+Shift+N)
- **Send message**: Enter (configurable)
- **Insert newline**: Shift+Enter
- **Navigate history**: Up/Down arrows when input empty (optional)

### Welcome State

- First-time user onboarding
- Feature introduction
- Example queries/prompts
- Call-to-action to start first chat

### Panel Header

- **Context toggle**: Button to enable/disable context sharing
- **Options menu**: New chat, hide panel, settings
- **Title/status**: Current chat title or "Wave AI"
- **Focus indicators**: Clear visual focus state for accessibility

## Technical Considerations

### AI Backend Integration

- HTTP API for chat completions (likely streaming)
- Authentication/authorization handling
- Rate limiting and quota management
- Error handling and retry logic
- Network status indication

### State Management

- Chat history persistence (per session or cross-session?)
- Input state (draft messages)
- File upload state
- Context configuration
- Panel preferences (width, visibility)

### Streaming

- Server-Sent Events (SSE) or WebSocket for streaming
- Incremental UI updates as tokens arrive
- Cancellation handling
- Error recovery mid-stream

### File Upload

- File selection via input or drag-and-drop
- Size limits and validation
- Preview of attached files
- Upload progress indication
- File removal before send

### Accessibility

- Screen reader announcements for AI responses
- Keyboard navigation within chat history
- Focus management (input ↔ history ↔ header controls)
- ARIA roles for chat messages (role="log" or similar)
- High-contrast mode support

## Component Architecture

```
AIPanel (main container, replaces ExamplePanel in side panel)
├── AIPanelHeader
│   ├── ContextToggle
│   ├── OptionsMenu
│   └── PanelTitle
├── ChatHistory (scrollable message list)
│   ├── WelcomeState (first-time only)
│   ├── ChatMessage (user message)
│   ├── ChatMessage (AI response)
│   ├── StreamingIndicator (while AI responds)
│   ├── RateLimitIndicator
│   └── ErrorMessage
└── InputComposer
    ├── FileAttachmentZone
    ├── TextArea (auto-resize)
    ├── FilePreview
    └── SendButton
```

## Related Files

- **Container**: `src/lib/WindowManagerShell.svelte` (side panel mounting)
- **New Components**: `src/lib/components/AIPanel*.svelte` (to be created)
- **Types**: `src/lib/types.ts` (AI message, context config)
- **Demo**: `src/routes/+page.svelte` (showcase AI panel)
- **Stories**: `src/stories/AIPanel.stories.svelte` (Storybook)

## Success Criteria

### Functional

- Chat messages send and receive successfully
- Streaming responses render incrementally
- File upload works with validation
- Context toggle affects request payload
- Keyboard shortcuts function as expected
- Welcome state shows on first use
- Rate limits display clearly
- Error messages are actionable

### Non-Functional

- Input composer resizes smoothly
- Streaming updates at ≥30 FPS
- Large chat histories scroll without jank
- File uploads handle up to 10MB gracefully
- Panel resize feels responsive

### Accessibility

- Screen reader announces AI responses
- Full keyboard navigation support
- Focus indicators always visible
- Chat history has semantic structure
- High-contrast mode works well

## User Stories (to be detailed)

### US1: Basic Chat Interface

Users can send text messages and receive AI responses in a clean chat interface.

### US2: Streaming Responses

AI responses stream token-by-token with visual indication and smooth rendering.

### US3: File Upload

Users can drag-and-drop or select files to attach to queries, with validation and preview.

### US4: Context Sharing

Users can toggle context sharing to include workspace/widget information in AI queries.

### US5: Keyboard Shortcuts

Users can focus, send, and start new chats entirely via keyboard.

### US6: Welcome & Onboarding

First-time users see a welcome state introducing AI capabilities and example use cases.

## Open Questions

From `specs/window-manager-prd.md:L104-L109`:

- **AI panel file-size/error messaging**: Need to align with backend limits and document clearly
  - What are the actual size limits?
  - What file types are supported?
  - How should we handle unsupported types?

## Next Steps

1. Define AI backend API contract (request/response schemas, streaming format)
2. Create detailed specification following 001/002 pattern
3. Design chat message data model and persistence strategy
4. Plan component hierarchy and state management
5. Define testing strategy (mock AI backend for tests)
6. Create plan.md with task breakdown
