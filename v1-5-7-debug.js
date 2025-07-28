/**
 * v1.5.7 Validation Debug Script
 * Specifically tests the new visual error detection logic
 */

console.log('🔧 [v1.5.7 DEBUG] Starting validation trace...');

// Check version first
if (typeof FormLib !== 'undefined') {
  console.log('✅ FormLib loaded');
  
  // Check if we have the v1.5.7 version with CACHE_BUST_2025_01_28_22_45_VISUAL_ERROR_FIX
  const scripts = Array.from(document.querySelectorAll('script')).find(s => 
    s.src && s.src.includes('form-functionality-library')
  );
  if (scripts) {
    console.log('📦 Script URL:', scripts.src);
  }
} else {
  console.error('❌ FormLib not found!');
}

// Find fields with error styling
const errorFields = document.querySelectorAll('.error-field');
console.log(`🔍 Found ${errorFields.length} fields with error-field class`);

errorFields.forEach((field, index) => {
  const fieldName = field.name || field.getAttribute('data-step-field-name');
  console.log(`📝 Error Field ${index}:`, {
    fieldName,
    value: field.value,
    hasErrorClass: field.classList.contains('error-field'),
    isEmpty: !field.value || field.value.trim() === '',
    inputType: field.type || field.tagName
  });
});

// Check error messages
const errorMessages = document.querySelectorAll('.form_error-message');
console.log(`💬 Found ${errorMessages.length} error message elements`);

errorMessages.forEach((msg, index) => {
  const hasActiveClass = msg.classList.contains('active-error');
  const computedStyle = getComputedStyle(msg);
  
  console.log(`💬 Error Message ${index}:`, {
    text: msg.textContent.trim(),
    hasActiveClass,
    display: computedStyle.display,
    visibility: computedStyle.visibility,
    opacity: computedStyle.opacity,
    height: computedStyle.height,
    isVisible: msg.offsetParent !== null,
    zIndex: computedStyle.zIndex,
    position: computedStyle.position
  });
});

// Test validation manually on first error field
if (errorFields.length > 0) {
  const testField = errorFields[0];
  const fieldName = testField.name || testField.getAttribute('data-step-field-name');
  
  console.log('🧪 Testing first error field:', fieldName);
  console.log('📊 Before test:', {
    value: testField.value,
    hasErrorClass: testField.classList.contains('error-field')
  });
  
  // Add a value to make it valid
  testField.value = 'Test Value';
  
  // Create input event with detailed logging
  console.log('⌨️ Dispatching input event...');
  
  // Listen for validation events specifically
  const originalConsoleLog = console.log;
  let validationLogs = [];
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('Input event on') || message.includes('Validating field') || message.includes('Clearing error')) {
      validationLogs.push(message);
    }
    originalConsoleLog.apply(console, args);
  };
  
  // Dispatch the event
  const inputEvent = new Event('input', { bubbles: true });
  testField.dispatchEvent(inputEvent);
  
  // Restore console and show validation logs
  console.log = originalConsoleLog;
  
  setTimeout(() => {
    console.log('📋 Validation logs captured:', validationLogs);
    console.log('📊 After input event:', {
      value: testField.value,
      hasErrorClass: testField.classList.contains('error-field'),
      errorRemoved: !testField.classList.contains('error-field')
    });
    
    // Check if the field has validation rules
    if (typeof FormLib !== 'undefined' && FormLib.getState) {
      const state = FormLib.getState();
      console.log('🔍 FormLib validation state:', {
        fieldValidations: state.validation?.fieldValidations,
        errors: state.errors
      });
    }
    
    // Try blur event too
    console.log('👋 Testing blur event...');
    const blurEvent = new Event('blur', { bubbles: true });
    testField.dispatchEvent(blurEvent);
    
    setTimeout(() => {
      console.log('📊 After blur event:', {
        value: testField.value,
        hasErrorClass: testField.classList.contains('error-field'),
        errorRemoved: !testField.classList.contains('error-field')
      });
    }, 100);
  }, 100);
}

// Check CSS injection
const injectedStyles = document.querySelector('style[data-form-lib="error-styles"]');
if (injectedStyles) {
  console.log('✅ Error styles found in DOM');
  const cssText = injectedStyles.textContent;
  const hasVisualErrorFix = cssText.includes('z-index: 1000');
  console.log('🎨 CSS includes v1.5.7 fixes:', hasVisualErrorFix);
} else {
  console.log('❌ Error styles not injected!');
}

console.log('🔧 [v1.5.7 DEBUG] Setup complete. Watch for validation events above.'); 