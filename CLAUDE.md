# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Building and Development
```bash
# Build TypeScript to JavaScript
npm run build

# Build for browser with bundling and minification
npm run build:prod

# Watch mode for development
npm run dev

# Clean build artifacts
npm run clean

# Lint TypeScript files
npm run lint

# Start local development server
npm run serve
```

### Testing
This project currently uses manual testing via the local development server. Run `npm run serve` and test with the included HTML files.

## Architecture Overview

This is a **Form Functionality Library** designed specifically for **Webflow forms**. It provides modular, data-attribute-driven functionality for single-step, multi-step, and branching forms.

### Key Design Principles
- **Data-attribute driven**: Uses HTML data attributes instead of CSS classes or IDs
- **Modular architecture**: Each feature is a separate module in `/modules/`
- **Singleton pattern**: FormState manages all form data in memory
- **Event-driven**: Modules communicate via a custom event system
- **Auto-initialization**: Library detects compatible forms and initializes automatically

### Core Architecture Components

#### 1. Main Entry Point (`index.ts`)
- Singleton FormLibrary class that orchestrates all modules
- Auto-initializes when compatible forms are detected
- Provides public API for manual control

#### 2. Configuration (`config.ts`)
- Centralizes all data attribute definitions, selectors, and constants
- Defines the navigation system: source → destination pattern
- Contains CSS class names and default settings

#### 3. Form State Management (`modules/formState.ts`)
- Singleton FormStateManager handles all form data
- Tracks step visibility, visit history, and branching paths
- Enhanced skip functionality with history and undo capabilities
- Manages step categorization (type, subtype, number)

#### 4. Module System (`modules/`)
Each module is self-contained with init, reset, and state functions:

- **`multiStep.ts`**: Handles step navigation with parent steps and branching step_items
- **`branching.ts`**: Manages conditional logic and step routing
- **`validation.ts`**: Real-time field validation with custom error messages
- **`errors.ts`**: Error display and management
- **`summary.ts`**: Dynamic summary generation with flexible formatting
- **`skip.ts`**: Basic skip functionality for navigation
- **`events.ts`**: Custom event system for module communication
- **`utils.ts`**: Shared utilities for DOM manipulation and query caching

### Data Attribute System

The library uses a comprehensive data attribute system:

#### Form Configuration
- `data-form="multistep"`: Marks form as multi-step
- `data-logic="true"`: Enables branching logic

#### Navigation System
- **Destinations**: `data-answer="step-id"` (identifies steps as targets)
- **Sources**: `data-go-to="step-id"` and `data-skip="step-id"` (navigate to targets)

#### Step Structure
- `data-form="step"`: Main step container
- `data-step-type`, `data-step-subtype`, `data-step-number`: Step categorization
- `data-step-field-name`: Field identifier for state management

#### Skip
- `data-skip="step-id"`: Skip to specific step (must match existing `data-answer` value)

### Multi-Step Architecture

The library supports a two-tier step system:

1. **Parent Steps**: Main form steps with `data-form="step"`
2. **Step Items**: Branching options within steps (`.step_item` with `data-answer`)

Navigation flow:
- Sequential: step-0 → step-1 → step-2
- Branching: step-0 → specific-branch-item → step-2

### Event System

Modules communicate via a custom event bus (`modules/events.ts`):
- `branch:change`: Triggered when branching logic changes active step
- `skip:request`: Triggered when skip button is clicked
- `step:change`: Triggered when step navigation occurs

### Build System

- **TypeScript**: Strict typing with ES2020 target
- **ESLint**: TypeScript-specific linting rules
- **Build outputs**: 
  - `dist/index.js`: ES2020 module format
  - `dist/index.browser.js`: IIFE bundled for browser
  - `dist/index.min.js`: Minified production version

### State Management

The FormState singleton manages:
- Field values and validation states
- Step visibility and visit history
- Branching paths and navigation history
- Step categorization metadata

### CSS Classes

The library applies these CSS classes for styling:
- `active-step`: Currently visible step
- `hidden-step`: Hidden step container
- `error-field`: Field with validation error

## Development Notes

### Module Dependencies
Modules are initialized in dependency order:
1. Errors (required by validation)
2. Validation (required by multi-step)
3. Branching (if logic forms exist)
4. Multi-step (coordinates with branching, includes skip)
5. Summary (listens to field changes)

### Debug Features
- Set `DEFAULTS.DEBUG = true` for verbose console logging
- Use `FormLib.logCurrentState()` to inspect current state
- Use `FormLib.getState()` to get complete state object

### Data Attribute Validation
The library performs extensive validation during initialization:
- Checks for required `data-answer` attributes on steps
- Validates navigation targets exist
- Provides detailed error messages for missing configurations

### Memory Management
- Query results are cached in `utils.ts` for performance
- Cleanup functions are registered for proper teardown
- `FormLib.destroy()` clears all state and event listeners