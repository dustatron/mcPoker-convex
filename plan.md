# Hotkey Implementation Plan

This document outlines the plan for implementing hotkeys in the mcPoker application.

## NPM Package Installation

We will use the `react-hotkeys-hook` library to manage hotkeys. To install it, run the following command:

```bash
npm install react-hotkeys-hook
```

## Hotkey Mapping

The following hotkeys will be implemented, all requiring the `shift` modifier to avoid conflicts with browser shortcuts:

### Voting Cards
*   `shift+0`: Select "0" card
*   `shift+1`: Select "1" card  
*   `shift+2`: Select "2" card
*   `shift+3`: Select "3" card
*   `shift+5`: Select "5" card
*   `shift+8`: Select "8" card
*   `shift+q`: Select "?" (question/unsure) card
*   `shift+i`: Select "∞" (infinity/too big) card

### Vote Control
*   `shift+r`: Reveal or hide the votes
*   `shift+c`: Clear all votes
*   `shift+n`: Start new round/reset votes
*   `shift+v`: Toggle vote visibility (if different from reveal)

### Navigation & Utility
*   `shift+e`: Exit/leave room (with confirmation)
*   `shift+?`: Open hotkey help modal

## Implementation Details

### Registration Location
- Hotkeys will be registered in the main room page component
- Use `useHotkeys` hook from `react-hotkeys-hook`
- Hotkeys should be scoped to the room page only

### State Management
- Hotkeys should respect current room state (e.g., voting phase vs. results phase)
- Disable voting hotkeys when votes are revealed (unless user is moderator)
- Disable all hotkeys when user is typing in input fields

### Conflict Prevention
- Use `preventDefault: true` for all hotkeys to prevent browser defaults
- Add `enableOnContentEditable: false` to prevent interference with text editing
- Consider `enableOnFormTags: false` to disable in form inputs

### Error Handling
- Gracefully handle cases where the selected card doesn't exist
- Provide visual feedback when hotkeys are pressed
- Show toast notifications for successful actions

## Hotkey Help Modal

A new component will be created to display the list of available hotkeys:

### Features
- Triggered by `shift+?` hotkey and a help button in the UI
- Organized by category (Voting, Controls, Navigation)
- Show current room state context (what hotkeys are currently available)
- Include visual keyboard representations
- Responsive design for mobile devices

### Modal Content Structure
```
Hotkeys Help
├── Voting Cards
│   ├── shift+0 through shift+8
│   ├── shift+q (?)
│   └── shift+i (∞)
├── Vote Controls  
│   ├── shift+r (Reveal/Hide)
│   ├── shift+c (Clear votes)
│   └── shift+n (New round)
└── Navigation
    ├── shift+e (Exit room)
    └── shift+? (This help)
```

## Accessibility Considerations

- Ensure hotkeys work with screen readers
- Provide alternative ways to access all hotkey functionality via UI buttons
- Add `aria-label` attributes to indicate available shortcuts
- Consider adding visual indicators when hotkeys are pressed
- Test with keyboard-only navigation

## Visual Feedback

- Brief highlight animation on selected cards
- Toast notifications for successful actions
- Loading states for async operations (like revealing votes)
- Error messages for failed operations

## Testing Strategy

- Unit tests for hotkey registration and cleanup
- Integration tests for hotkey functionality in different room states
- Accessibility testing with screen readers
- Cross-browser compatibility testing
- Mobile device testing (hotkeys may not work on touch devices)

## Future Enhancements

- Consider adding customizable hotkey preferences
- Add hotkey hints as tooltips on buttons
- Implement hotkey training/tutorial mode
- Consider adding vim-style key combinations for power users