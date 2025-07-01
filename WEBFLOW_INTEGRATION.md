# Webflow Integration Guide

## jsDelivr CDN URLs

### Latest Version (Recommended for Development)
```html
<script type="module">
  import FormLib from 'https://cdn.jsdelivr.net/gh/CorporateDirect/Forms@latest/dist/index.js';
  console.log('FormLib loaded:', FormLib);
</script>
```

### Specific Version (Recommended for Production)
```html
<script type="module">
  import FormLib from 'https://cdn.jsdelivr.net/gh/CorporateDirect/Forms@v1.0.0/dist/index.js';
  console.log('FormLib loaded:', FormLib);
</script>
```

### Non-Module Version (For older browsers)
```html
<script src="https://cdn.jsdelivr.net/gh/CorporateDirect/Forms@v1.0.0/dist/index.js"></script>
<script>
  // FormLib will be available as window.FormLib
  console.log('FormLib loaded:', window.FormLib);
</script>
```

## Webflow Implementation Steps

### 1. Add the Script to Your Webflow Project

In Webflow Designer:
1. Go to **Project Settings** > **Custom Code**
2. Add this to the **Footer Code** section:

```html
<script type="module">
  import FormLib from 'https://cdn.jsdelivr.net/gh/CorporateDirect/Forms@v1.0.0/dist/index.js';
  
  // The library auto-initializes, but you can also manually control it
  document.addEventListener('DOMContentLoaded', function() {
    console.log('FormLib loaded and initialized');
    
    // Optional: Log current state for debugging
    if (window.FormLib) {
      window.FormLib.logCurrentState();
    }
  });
</script>
```

### 2. Set Up Your Form Structure

#### Basic Multi-Step Form
```html
<form data-form="multistep">
  <!-- Step 1 -->
  <div data-form="step" data-answer="step-1">
    <h2>Personal Information</h2>
    <input type="text" name="firstName" data-step-field-name="firstName" placeholder="First Name" required>
    <input type="text" name="lastName" data-step-field-name="lastName" placeholder="Last Name" required>
    <input type="email" name="email" data-step-field-name="email" placeholder="Email" required>
  </div>
  
  <!-- Step 2 -->
  <div data-form="step" data-answer="step-2">
    <h2>Additional Details</h2>
    <input type="tel" name="phone" data-step-field-name="phone" placeholder="Phone Number">
    <textarea name="message" data-step-field-name="message" placeholder="Your message"></textarea>
  </div>
  
  <!-- Navigation Buttons -->
  <button type="button" data-form="back-btn">← Back</button>
  <button type="button" data-form="next-btn">Next →</button>
  <button type="submit" data-form="submit" style="display: none;">Submit</button>
</form>
```

#### Form with Branching Logic
```html
<form data-form="multistep" data-logic="true">
  <!-- Step 1: Choose User Type -->
  <div data-form="step" data-answer="step-1">
    <h2>What type of user are you?</h2>
    <select name="userType" data-step-field-name="userType" data-go-to="business-step" required>
      <option value="">Select...</option>
      <option value="individual">Individual</option>
      <option value="business">Business</option>
    </select>
  </div>
  
  <!-- Step 2: Business Details (only shows if userType = "business") -->
  <div data-form="step" data-answer="business-step">
    <h2>Business Information</h2>
    <input type="text" name="companyName" data-step-field-name="companyName" placeholder="Company Name" required>
    <input type="text" name="industry" data-step-field-name="industry" placeholder="Industry">
  </div>
  
  <!-- Step 3: Contact Information -->
  <div data-form="step" data-answer="step-3">
    <h2>Contact Information</h2>
    <input type="text" name="name" data-step-field-name="name" placeholder="Full Name" required>
    <input type="email" name="email" data-step-field-name="email" placeholder="Email" required>
  </div>
  
  <!-- Navigation -->
  <button type="button" data-form="back-btn">← Back</button>
  <button type="button" data-form="next-btn">Next →</button>
  <button type="submit" data-form="submit" style="display: none;">Submit</button>
</form>
```

### 3. Add Summary Display (Optional)

```html
<!-- Summary Section -->
<div class="form-summary">
  <h3>Summary</h3>
  <p><strong>Name:</strong> <span data-summary-field="firstName|lastName" data-join="space">Not provided</span></p>
  <p><strong>Email:</strong> <span data-summary-field="email">Not provided</span></p>
  <p><strong>Company:</strong> <span data-summary-field="companyName">Not applicable</span></p>
</div>
```

### 4. Add Custom Styling

Add this CSS to your Webflow project (in **Project Settings** > **Custom Code** > **Head Code**):

```html
<style>
/* Hide all steps by default */
[data-form="step"] {
  display: none;
}

/* Show active step */
[data-form="step"].active-step {
  display: block;
}

/* Error styling */
.error-field {
  border-color: #e74c3c !important;
  background-color: #fdf2f2 !important;
}

.error-message {
  color: #e74c3c;
  font-size: 0.875em;
  margin-top: 0.25rem;
  display: block;
}

/* Button states */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Summary styling */
.summary-empty {
  color: #6c757d;
  font-style: italic;
}

.summary-filled {
  color: #333;
  font-weight: bold;
}
</style>
```

## Advanced Features

### Custom Validation Messages
```html
<input type="email" 
       name="email" 
       data-step-field-name="email" 
       data-error-message="Please enter a valid email address" 
       required>
```

### Skip Buttons
```html
<button type="button" data-skip="final-step">Skip to Final Step</button>
```

### Step Categorization
```html
<div data-form="step" 
     data-answer="manager-details"
     data-step-type="manager" 
     data-step-subtype="information" 
     data-step-number="1">
  <!-- Manager-specific fields -->
</div>
```

## Debugging

### Enable Debug Mode
The library logs everything to the browser console by default. To check what's happening:

1. Open browser Developer Tools (F12)
2. Go to the Console tab
3. Interact with your form
4. Check the detailed logs

### Manual Control
```html
<script>
// Access the library manually
const formLib = window.FormLib;

// Check current state
formLib.logCurrentState();

// Validate form
const isValid = formLib.validateForm();

// Reset form
formLib.resetForm();

// Get form data
const data = formLib.getFormData();
</script>
```

## Troubleshooting

### Common Issues

1. **Library not loading**: Check browser console for import errors
2. **Forms not initializing**: Ensure you have `data-form="multistep"` on your form
3. **Branching not working**: Make sure you have `data-logic="true"` on your form
4. **Steps not showing**: Check that you have `data-form="step"` on step containers

### Webflow-Specific Notes

- The library works with Webflow's native form submission
- Make sure to test in Webflow's preview mode or on the published site
- Custom code only runs on published sites, not in the Designer

## Version Management

### Creating New Versions

When you want to update the library:

1. Make your changes
2. Commit to git: `git commit -m "feat: your changes"`
3. Create a new tag: `git tag v1.0.1`
4. Push: `git push origin main && git push origin v1.0.1`
5. Update your Webflow code to use the new version

### URL Patterns

- **Latest**: `https://cdn.jsdelivr.net/gh/CorporateDirect/Forms@latest/dist/index.js`
- **Specific version**: `https://cdn.jsdelivr.net/gh/CorporateDirect/Forms@v1.0.0/dist/index.js`
- **Specific commit**: `https://cdn.jsdelivr.net/gh/CorporateDirect/Forms@9aff6a7/dist/index.js` 