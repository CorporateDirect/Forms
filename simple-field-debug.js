/**
 * Simple Field Debug - Check field element and value directly
 */

console.log('🔍 SIMPLE FIELD DEBUG...');

// Find the first name field
const field = document.querySelector('input[name="First-Name"]');
if (field) {
  console.log('🎯 Field found:', field);
  console.log('📊 Field properties:', {
    tagName: field.tagName,
    type: field.type,
    name: field.name,
    value: field.value,
    valueLength: field.value.length,
    hasErrorClass: field.classList.contains('error-field'),
    dataStepFieldName: field.getAttribute('data-step-field-name'),
    dataRequired: field.hasAttribute('data-required'),
    required: field.hasAttribute('required')
  });
  
  // Test what happens when we call validateField manually 
  console.log('🧪 Before manual validation - field.value:', field.value);
  
  // Check what fieldName would be extracted
  const fieldName = field.name || field.getAttribute('data-step-field-name');
  console.log('🏷️ Extracted field name:', fieldName);
  
  // See if we can access the validation function
  if (typeof FormLib !== 'undefined') {
    console.log('✅ FormLib available');
    console.log('📋 FormLib methods:', Object.keys(FormLib));
    
    // Try different ways to validate
    if (typeof FormLib.validateField === 'function') {
      console.log('🧪 Calling FormLib.validateField...');
      const result = FormLib.validateField('First-Name');
      console.log('📊 Validation result:', result);
      console.log('📊 Field after validation:', {
        value: field.value,
        hasErrorClass: field.classList.contains('error-field')
      });
    } else {
      console.log('❌ FormLib.validateField not available');
    }
  }
} else {
  console.error('❌ Field not found');
}

console.log('🔍 SIMPLE FIELD DEBUG COMPLETE'); 