# Form Functionality Library

A **modular, flexible form functionality library** designed to add advanced functionality to **Webflow forms**, supporting single-step forms, multi-step forms, and multi-step forms with logic branching.

## Features

- ✅ **Single-step forms** - Enhanced validation and error handling
- ✅ **Multi-step forms** - Step-by-step navigation with progress tracking
- ✅ **Multi-step forms with logic branching** - Conditional step display based on user input
- ✅ **Real-time validation** - Field validation with custom error messages
- ✅ **Summary generation** - Automatic summary display with flexible formatting
- ✅ **State management** - In-memory state management for performance
- ✅ **Data-attribute driven** - No binding to classes or IDs
- ✅ **TypeScript** - Fully typed with comprehensive JSDoc documentation
- ✅ **Verbose logging** - Detailed console output for debugging

## Quick Start

### 1. Include the Library

```html
<!-- Load from jsDelivr (when published) -->
<script type="module">
  import FormLib from 'https://cdn.jsdelivr.net/npm/form-functionality-library@latest/dist/index.js';
</script>
```

### 2. Set Up Your HTML

```html
<form data-form="multistep" data-logic="true">
  <!-- Step 1 -->
  <div data-form="step" data-answer="step-1">
    <input type="text" name="firstName" data-step-field-name="firstName" required>
    <select name="role" data-step-field-name="role" data-go-to="manager-step">
      <option value="Manager">Manager</option>
      <option value="Employee">Employee</option>
    </select>
  </div>
  
  <!-- Conditional Step (only shows if role = Manager) -->
  <div data-form="step" data-answer="manager-step">
    <input type="text" name="department" data-step-field-name="department" required>
  </div>
  
  <!-- Summary -->
  <div data-summary-field="firstName" data-join="space"></div>
  
  <!-- Navigation -->
  <button data-form="back-btn">Back</button>
  <button data-form="next-btn">Next</button>
  <button data-form="submit">Submit</button>
</form>
```

### 3. Initialize (Optional)

The library auto-initializes when it detects compatible forms. For manual control:

```javascript
// Manual initialization
FormLib.init();

// Check current state
FormLib.logCurrentState();

// Validate form
const isValid = FormLib.validateForm();

// Reset form
FormLib.resetForm();
```

## Data Attributes Reference

### Form Configuration

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-form="multistep"` | Marks form as multi-step | `<form data-form="multistep">` |
| `data-logic="true"` | Enables branching logic | `<form data-logic="true">` |

### Steps

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-form="step"` | Marks element as a step | `<div data-form="step">` |
| `data-answer="step-id"` | Step identifier for branching | `<div data-answer="manager-step">` |
| `data-step-type="type"` | Step categorization | `<div data-step-type="manager">` |
| `data-step-subtype="subtype"` | Step sub-categorization | `<div data-step-subtype="details">` |
| `data-step-number="1"` | Step numbering | `<div data-step-number="1">` |

### Navigation

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-form="next-btn"` | Next button | `<button data-form="next-btn">` |
| `data-form="back-btn"` | Back button | `<button data-form="back-btn">` |
| `data-form="submit"` | Submit button | `<button data-form="submit">` |
| `data-skip="step-id"` | Skip to specific step | `<button data-skip="summary">` |

### Branching Logic

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-go-to="step-id"` | Defines branch target | `<input data-go-to="manager-step">` |

### Field Configuration

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-step-field-name="name"` | Field identifier for state management | `<input data-step-field-name="firstName">` |
| `data-error-message="text"` | Custom error message | `<input data-error-message="Name is required">` |

### Summary Display

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-summary-field="field1\|field2"` | Fields to display (pipe-separated) | `<div data-summary-field="firstName\|lastName">` |
| `data-join="type"` | How to join multiple values | `<div data-join="space">` |
| `data-summary-type="type"` | Summary categorization | `<div data-summary-type="manager">` |

#### Join Types

- `space` - Join with spaces: "John Doe"
- `comma` - Join with commas: "John, Doe"
- `dash` - Join with dashes: "John - Doe"
- `pipe` - Join with pipes: "John | Doe"
- `newline` - Join with line breaks

## API Reference

### Main FormLib Object

```javascript
// Initialize library
FormLib.init(rootElement?)

// Check initialization status
FormLib.isInitialized()

// Get current state
FormLib.getState()

// Log current state to console
FormLib.logCurrentState()

// Validate entire form
FormLib.validateForm()

// Reset form to initial state
FormLib.resetForm()

// Get form data
FormLib.getFormData()

// Set form data
FormLib.setFormData(data)

// Destroy library
FormLib.destroy()
```

### Individual Modules

```javascript
// Import individual modules for advanced usage
import { 
  FormState,
  initBranching,
  initMultiStep,
  initValidation,
  initErrors,
  initSummary
} from 'form-functionality-library';

// FormState management
FormState.setField('fieldName', 'value');
FormState.getField('fieldName');
FormState.getAll();
FormState.clear();

// Validation
validateField('fieldName');
validateStep('stepId');
validateAllVisibleFields();

// Errors
showError('fieldName', 'Error message');
clearError('fieldName');
clearAllErrors();

// Summary
updateSummary();
clearSummary();
```

## Examples

### Basic Multi-Step Form

```html
<form data-form="multistep">
  <div data-form="step">
    <h2>Step 1</h2>
    <input type="text" name="name" data-step-field-name="name" required>
  </div>
  
  <div data-form="step">
    <h2>Step 2</h2>
    <input type="email" name="email" data-step-field-name="email" required>
  </div>
  
  <button data-form="back-btn">Back</button>
  <button data-form="next-btn">Next</button>
  <button data-form="submit">Submit</button>
</form>
```

### Branching Logic Form

```html
<form data-form="multistep" data-logic="true">
  <div data-form="step">
    <select name="userType" data-step-field-name="userType" data-go-to="business-step">
      <option value="personal">Personal</option>
      <option value="business">Business</option>
    </select>
  </div>
  
  <!-- Only shows when userType = "business" -->
  <div data-form="step" data-answer="business-step">
    <input type="text" name="company" data-step-field-name="company" required>
  </div>
</form>
```

### Summary Display

```html
<!-- Display first name and last name joined with space -->
<div data-summary-field="firstName|lastName" data-join="space"></div>

<!-- Display manager-specific fields with comma separation -->
<div data-summary-field="department|teamSize" 
     data-join="comma" 
     data-summary-type="manager"></div>
```

## Browser Support

- Chrome 80+
- Firefox 72+
- Safari 13+
- Edge 80+

## Development

### Building

```bash
# Install dependencies (if using npm)
npm install typescript

# Compile TypeScript
npx tsc

# Output will be in ./dist/
```

### Project Structure

```
/
├── config.ts              # Configuration constants
├── index.ts               # Main entry point
├── tsconfig.json          # TypeScript configuration
├── /modules/
│   ├── utils.ts           # Shared utilities
│   ├── formState.ts       # State management
│   ├── branching.ts       # Branching logic
│   ├── multiStep.ts       # Multi-step navigation
│   ├── validation.ts      # Form validation
│   ├── errors.ts          # Error handling
│   └── summary.ts         # Summary generation
├── index.html             # Test/demo page
└── README.md
```

## Debugging

The library provides verbose console logging when `DEBUG` is enabled (default):

```javascript
// Enable/disable debug logging
DEFAULTS.DEBUG = true; // or false

// Log current state
FormLib.logCurrentState();

// Get detailed state information
const state = FormLib.getState();
console.log(state);
```

## License

MIT License - feel free to use in commercial and personal projects.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the console for detailed logging
- Use `FormLib.logCurrentState()` to debug
- Review the data attributes in your HTML
- Ensure proper TypeScript compilation

