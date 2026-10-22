# Accessibility Features

This document outlines the accessibility features implemented in the Travelo application to ensure it's usable by everyone, including people with disabilities.

## Overview

The application follows WCAG 2.1 Level AA guidelines and implements various accessibility features to ensure an inclusive user experience.

## Key Features

### 1. Keyboard Navigation

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Focus Indicators**: Clear visual focus indicators on all interactive elements
- **Skip to Main Content**: Skip link at the top of the page for keyboard users to bypass navigation
- **Modal Focus Trapping**: Focus is trapped within modals when open
- **Escape Key Support**: Modals can be closed with the Escape key

### 2. Screen Reader Support

- **ARIA Labels**: Proper ARIA labels on all interactive elements
- **ARIA Roles**: Semantic roles for navigation, dialogs, menus, and status messages
- **ARIA Live Regions**: Dynamic content updates are announced to screen readers
- **Alt Text**: All images have descriptive alternative text
- **Hidden Decorative Elements**: Decorative icons are hidden from screen readers with `aria-hidden="true"`

### 3. Visual Accessibility

- **Color Contrast**: All text meets WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- **Focus Indicators**: 2px solid blue outline on focused elements
- **Loading States**: Clear loading indicators with skeleton screens
- **Empty States**: Informative empty state messages with clear calls to action
- **Error Messages**: Error messages are clearly visible and associated with form fields

### 4. Form Accessibility

- **Labels**: All form inputs have associated labels
- **Required Fields**: Required fields are marked with asterisks and `aria-required`
- **Error States**: Form errors are announced with `aria-invalid` and `aria-describedby`
- **Input Validation**: Real-time validation feedback
- **Placeholder Text**: Used as supplementary, not primary, information

### 5. Responsive Design

- **Mobile Friendly**: Fully responsive design works on all screen sizes
- **Touch Targets**: Minimum 44x44px touch targets for mobile users
- **Zoom Support**: Content remains usable at 200% zoom

### 6. Motion and Animation

- **Reduced Motion**: Respects `prefers-reduced-motion` user preference
- **Optional Animations**: Animations can be disabled for users who prefer reduced motion

## Component-Specific Features

### Button Component
- `aria-label` support for icon-only buttons
- `aria-busy` state for loading buttons
- `aria-disabled` for disabled buttons
- Focus-visible styles

### Input Component
- Associated labels with `htmlFor`
- `aria-invalid` for error states
- `aria-describedby` for error messages
- `aria-required` for required fields

### Modal Component
- `role="dialog"` and `aria-modal="true"`
- Focus management (trap and restore)
- Keyboard navigation (Tab and Shift+Tab)
- Escape key to close
- `aria-labelledby` for modal title

### Navigation Component
- `<nav>` with `aria-label`, links in plain lists (no menu roles, so Tab works as expected)
- `aria-current="page"` and a visible highlight on the current page's link
- Account and mobile menus are disclosure buttons with `aria-expanded` and `aria-controls`
- Escape closes an open menu and returns focus to its button

### Tabs (trip sections, saved items)
- `role="tablist"`, `role="tab"` with `aria-selected`, and a labelled `role="tabpanel"`
- Arrow keys (plus Home and End on the trip page) move between tabs; only the selected tab is in the Tab order

### Clickable cards and rows
- Trip cards are links; notification rows and photo tiles open through a real button, so they work with Enter and Space
- Photo tile actions (download, delete) appear on keyboard focus as well as on hover

### Empty State Component
- `role="status"` for status messages
- `aria-live="polite"` for dynamic updates
- Decorative icons hidden with `aria-hidden`

### Loader Component
- `role="status"` for loading indicators
- `aria-live="polite"` for updates
- Screen reader text with `.sr-only` class

## Dark Mode

- Follows the device's light or dark setting by default and updates live when it changes
- The theme button in the navigation cycles System, Light and Dark; the choice is saved in `localStorage` (`travelo-theme`)
- `public/theme-init.js` applies the saved theme before the first paint, so there is no flash of the light theme
- Dark styles are Tailwind `dark:` classes driven by a `.dark` class on `<html>`; both themes meet WCAG AA contrast

## Automated Checks

- `client/src/__tests__/accessibility.test.jsx` runs axe-core (WCAG 2.1 A/AA) on the sign-in, registration and explore pages, the navigation, modals and the FAQ, and tests keyboard behaviour (menus, focus trap, current page)
- `e2e/tests/accessibility.spec.js` runs axe, including colour contrast, on every page and every trip tab in both the light and dark themes, and checks the theme switch and keyboard tabs
- When adding UI, add `dark:` variants next to light colours and run `npm test` in `client/`

## Testing Recommendations

### Manual Testing
1. **Keyboard Navigation**: Navigate the entire app using only the keyboard
2. **Screen Reader**: Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac/iOS)
3. **Zoom**: Test at 200% zoom level
4. **Color Contrast**: Use browser DevTools to check contrast ratios

### Automated Testing Tools
- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools

### Screen Readers
- **NVDA** (Windows): Free and open-source
- **JAWS** (Windows): Industry standard (paid)
- **VoiceOver** (Mac/iOS): Built into Apple devices
- **TalkBack** (Android): Built into Android devices

## Known Limitations

1. **Third-party Components**: Some third-party libraries may have accessibility limitations
2. **Dynamic Content**: Some dynamically loaded content may need additional ARIA live regions
3. **Complex Interactions**: Some complex interactions may require additional keyboard shortcuts

## Future Improvements

1. Add keyboard shortcuts for common actions
2. Implement high contrast mode support
3. Add more comprehensive ARIA landmarks
4. Improve focus management in complex components
5. Add more descriptive error messages
6. Implement better support for screen magnification

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

## Reporting Issues

If you encounter any accessibility issues, please report them by:
1. Creating an issue in the project repository
2. Including details about the issue and how to reproduce it
3. Specifying the assistive technology you're using (if applicable)
