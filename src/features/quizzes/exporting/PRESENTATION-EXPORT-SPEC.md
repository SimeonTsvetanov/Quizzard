# Presentation Export Specification

## Overview

This document specifies the presentation export functionality for Quizzard quizzes, ensuring consistent presentation layouts and interactive features across multiple export formats.

## Supported Export Formats

### Google Slides (Coming Soon)

- Web-based presentation platform
- Real-time collaboration support
- Cloud storage and sharing
- Interactive elements via Google Apps Script

### JSON Export (Coming Soon)

- Structured data format
- Quiz data preservation
- Import/export compatibility
- Developer-friendly format

## Global Layout Elements

### Header Layout

- Logo (left) - Timer/QUIZZARD (center) - Buy Me Coffee (right)
- Timer replaces "QUIZZARD" text when active
- Timer features:
  - Digital countdown format (mm:ss)
  - Color changes: normal → yellow at 10s → red at 5s
  - Subtle animations between seconds

### Content Area

- Question area: 10% vertical space
- Content area: 90% vertical space
- Consistent padding and margins
- Aspect ratio preservation for media

## Slide Types (18 Total)

### 1. Master Slides

- Quiz Title Slide
  - Quiz name
  - Category and difficulty
  - Total rounds and questions
  - Estimated duration

### 2. Round Management

- Round Opening Slide

  - Round number and name
  - Question count
  - Total points available
  - Time allocation

- Break Slide
  - "Break Time" display
  - Duration countdown
  - Progress to next round
  - Optional round summary

### 3. Question Types

#### Basic Question Slides

- Single Answer

  - Question text
  - Timer display
  - Points value
  - Answer reveal on click

- Multiple Choice
  - Question text
  - Options (A, B, C, D format)
  - Timer display
  - Points value
  - Answer reveal on click

#### Media Question Slides

- Picture Questions

  - Question text
  - Image display (preserved aspect ratio)
  - Timer display
  - Points value
  - Answer reveal on click

- Audio Questions

  - Question text
  - Audio player controls
  - Timer display
  - Points value
  - Answer reveal on click

- Video Questions
  - Question text
  - Video player controls
  - Timer display
  - Points value
  - Answer reveal on click

### 4. Golden Pyramid Format

- Opening Slide

  - Pyramid visual
  - Total points
  - Round timer

- Question Slides (4 levels)
  - Level-specific styling
  - Progressive difficulty
  - Multiple correct answers
  - Points per level

### 5. Answer Slides

- Answer Display
  - Correct answer(s)
  - Explanation (if provided)
  - Points awarded
  - Progress to next question

## Interaction Flow

### Navigation

- Everything controlled by clicks
- No automatic transitions
- Click sequence for questions:
  1. Show question
  2. Show media (if present)
  3. Show choices (if present)
  4. Start timer
- Timer can be interrupted by click to proceed

### Timer Integration

- Uses quiz question's timeLimit value
- Decimal support (e.g., 0.5 = 30 seconds)
- Breaking time between rounds
- Special handling for Golden Pyramid round timer

### Points System

- Display points available
- Support for decimal points
- Round total calculations
- Special handling for Golden Pyramid points

## Visual Design

### Colors

- From Material 3 Light Theme:
  - Primary: #6750A4
  - Secondary: #625B71
  - Surface: #FFFBFE
  - Error: #B3261E
  - Warning: #F9A825

### Typography

- Font Family: "Poppins" with system fallbacks
- Sizes (using clamp() for fluid scaling):
  - Title: clamp(1.8rem, 4vw, 2.5rem)
  - Question: clamp(1.1rem, 2.5vw, 1.4rem)
  - Options: clamp(0.95rem, 2vw, 1.1rem)
  - Timer: clamp(1.5rem, 3vw, 2rem)

### Media Handling

- Images: Preserve aspect ratio, max 10MB
- Audio: Controls visible on hover, max 20MB
- Video: Standard player controls, max 100MB

## Technical Requirements

### Data Sources

- Quiz structure from IndexedDB/localStorage
- Media files from storage
- Theme colors from Material 3 config
- Typography from theme settings

### Error Handling

- Missing media fallbacks
- Network connectivity issues
- Export service limitations
- User permission requirements

### Performance

- Efficient data processing
- Progress feedback during export
- Cancellation support
- Memory optimization

### Accessibility

- High contrast text
- Clear reading order
- Alt text for images
- Keyboard navigation support
- Screen reader compatibility

## Future Export Formats

### PowerPoint Integration

- Desktop application compatibility
- VBA macro support for advanced interactivity
- Offline presentation capabilities

### PDF Export

- Static presentation format
- Print-friendly layouts
- Universal compatibility

### HTML Presentation

- Web-based presentation
- Responsive design
- Progressive Web App support

## Implementation Notes

This specification serves as a foundation for implementing various presentation export formats while maintaining consistency across platforms and ensuring excellent user experience.
