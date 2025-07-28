/**
 * Error Clearing Debug Script v1.5.6
 * Run this in the browser console to debug why error borders aren't clearing
 */

console.log('🔧 [ERROR CLEARING DEBUG] Starting comprehensive analysis...');

// Test if FormLib is loaded and working
if (typeof FormLib === 'undefined') {
  console.error('❌ FormLib not found! Make sure the library is loaded.');
} else {
  console.log('✅ FormLib found:', FormLib);
  console.log('📊 FormLib State:', FormLib.getState());
}

// Find all form fields and their current states
const allInputs = document.querySelectorAll('input, select, textarea');
console.log(`🔍 Found ${allInputs.length} form inputs`);

// Analyze each input field
allInputs.forEach((input, index) => {
  const fieldName = input.name || input.getAttribute('data-step-field-name');
  const hasErrorClass = input.classList.contains('error-field');
  const hasValue = input.value && input.value.trim().length > 0;
  const hasRequired = input.hasAttribute('required') || input.hasAttribute('data-required');
  const stepWrapper = input.closest('.step_wrapper[data-answer]');
  const stepId = stepWrapper ? stepWrapper.getAttribute('data-answer') : 'no-step';
  
  if (hasRequired) {
    console.log(`📝 Field ${index}: ${fieldName || 'unnamed'}`, {
      stepId,
      fieldName,
      hasValue,
      hasErrorClass,
      hasRequired,
      value: input.value,
      inputType: input.type || input.tagName,
      inputId: input.id,
      inputClasses: input.className
    });
  }
});

// Test validation events manually
console.log('🧪 Testing manual validation events...');

// Find the first field with errors
const errorFields = document.querySelectorAll('input.error-field, select.error-field, textarea.error-field');
if (errorFields.length > 0) {
  const firstErrorField = errorFields[0];
  const fieldName = firstErrorField.name || firstErrorField.getAttribute('data-step-field-name');
  
  console.log('🎯 Testing first error field:', {
    element: firstErrorField,
    fieldName,
    currentValue: firstErrorField.value,
    hasErrorClass: firstErrorField.classList.contains('error-field')
  });
  
  // Simulate typing in the field
  console.log('⌨️ Simulating input event...');
  firstErrorField.value = 'Test Value';
  
  // Trigger input event
  const inputEvent = new Event('input', { bubbles: true });
  firstErrorField.dispatchEvent(inputEvent);
  
  setTimeout(() => {
    console.log('📋 After input event:', {
      fieldName,
      value: firstErrorField.value,
      hasErrorClass: firstErrorField.classList.contains('error-field'),
      errorClassRemoved: !firstErrorField.classList.contains('error-field')
    });
    
    // Also trigger blur event
    console.log('👋 Simulating blur event...');
    const blurEvent = new Event('blur', { bubbles: true });
    firstErrorField.dispatchEvent(blurEvent);
    
    setTimeout(() => {
      console.log('📋 After blur event:', {
        fieldName,
        value: firstErrorField.value,
        hasErrorClass: firstErrorField.classList.contains('error-field'),
        errorClassRemoved: !firstErrorField.classList.contains('error-field')
      });
    }, 100);
  }, 100);
}

// Check for error messages
console.log('💬 Checking error messages...');
const errorMessages = document.querySelectorAll('.form_error-message');
errorMessages.forEach((msg, index) => {
  console.log(`💬 Error Message ${index}:`, {
    text: msg.textContent,
    hasActiveClass: msg.classList.contains('active-error'),
    isVisible: msg.offsetParent !== null,
    display: getComputedStyle(msg).display,
    opacity: getComputedStyle(msg).opacity,
    visibility: getComputedStyle(msg).visibility
  });
});

// Debug the validation system
if (typeof FormLib !== 'undefined' && FormLib.getState) {
  const state = FormLib.getState();
  console.log('🔍 Validation State:', state.validation);
  console.log('❌ Current Errors:', state.errors);
}

// Listen for validation events
console.log('👂 Setting up event listeners for validation debugging...');

// Listen for all form events
document.addEventListener('input', (e) => {
  if (e.target.matches('input, select, textarea')) {
    const fieldName = e.target.name || e.target.getAttribute('data-step-field-name');
    console.log('🔊 INPUT EVENT:', {
      fieldName,
      value: e.target.value,
      hasErrorClass: e.target.classList.contains('error-field'),
      eventType: 'input'
    });
  }
}, true);

document.addEventListener('blur', (e) => {
  if (e.target.matches('input, select, textarea')) {
    const fieldName = e.target.name || e.target.getAttribute('data-step-field-name');
    console.log('🔊 BLUR EVENT:', {
      fieldName,
      value: e.target.value,
      hasErrorClass: e.target.classList.contains('error-field'),
      eventType: 'blur'
    });
  }
}, true);

document.addEventListener('change', (e) => {
  if (e.target.matches('input, select, textarea')) {
    const fieldName = e.target.name || e.target.getAttribute('data-step-field-name');
    console.log('🔊 CHANGE EVENT:', {
      fieldName,
      value: e.target.value,
      hasErrorClass: e.target.classList.contains('error-field'),
      eventType: 'change'
    });
  }
}, true);

console.log('🔧 [ERROR CLEARING DEBUG] Setup complete. Now interact with form fields and watch the console.');
console.log('📝 Instructions:');
console.log('1. Fill in a field that has a red border');
console.log('2. Tab away or click elsewhere');
console.log('3. Watch the console output above');
console.log('4. Check if the red border disappears'); 