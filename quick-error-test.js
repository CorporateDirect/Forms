/**
 * Quick Error Clearing Test - v1.5.6
 * Run this to test the specific "First Name" field issue
 */

console.log('🚨 Quick Error Clearing Test Starting...');

// Find the first name field specifically
const firstNameField = document.querySelector('input[name="firstName"]') || 
                      document.querySelector('input[data-step-field-name="firstName"]') ||
                      document.querySelector('#firstName') ||
                      document.querySelector('input[placeholder*="First"]') ||
                      document.querySelector('input[placeholder*="first"]');

if (!firstNameField) {
  console.error('❌ Could not find first name field');
  // Show all available fields
  const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
  console.log('Available text inputs:', Array.from(allInputs).map(input => ({
    name: input.name,
    dataStepFieldName: input.getAttribute('data-step-field-name'),
    id: input.id,
    placeholder: input.placeholder,
    value: input.value,
    hasErrorClass: input.classList.contains('error-field')
  })));
} else {
  console.log('✅ Found first name field:', firstNameField);
  
  const fieldName = firstNameField.name || firstNameField.getAttribute('data-step-field-name');
  
  console.log('📊 Current State:', {
    fieldName,
    value: firstNameField.value,
    hasErrorClass: firstNameField.classList.contains('error-field'),
    hasRequiredAttr: firstNameField.hasAttribute('required'),
    hasDataRequiredAttr: firstNameField.hasAttribute('data-required')
  });
  
  // Clear the field and add a test value
  console.log('🧪 Testing error clearing...');
  firstNameField.value = 'John';
  
  // Trigger input event (this should clear the error)
  console.log('⌨️ Triggering input event...');
  const inputEvent = new Event('input', { bubbles: true });
  firstNameField.dispatchEvent(inputEvent);
  
  setTimeout(() => {
    console.log('📋 After input event:', {
      value: firstNameField.value,
      hasErrorClass: firstNameField.classList.contains('error-field'),
      errorCleared: !firstNameField.classList.contains('error-field')
    });
    
    if (firstNameField.classList.contains('error-field')) {
      console.log('⚠️ Error class still present! Testing validation manually...');
      
      // Try to call validation directly if available
      if (typeof FormLib !== 'undefined' && FormLib.validateField) {
        console.log('🔧 Calling FormLib.validateField directly...');
        const result = FormLib.validateField(fieldName);
        console.log('📊 Direct validation result:', result);
      }
      
      // Check if the field has validation rules
      if (typeof FormLib !== 'undefined' && FormLib.getState) {
        const state = FormLib.getState();
        console.log('🔍 Field validation state:', state.validation?.fieldValidations?.[fieldName]);
      }
    } else {
      console.log('✅ Success! Error class was removed.');
    }
  }, 200);
} 