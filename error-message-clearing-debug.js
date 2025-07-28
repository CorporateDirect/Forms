// ERROR MESSAGE CLEARING DEBUG SCRIPT
// Tests whether validateField properly clears error messages

console.log('🔍 ERROR MESSAGE CLEARING DEBUG...');

// Test the specific First Name field
const fieldName = 'First-Name';
const field = document.querySelector('input[name="First-Name"]');

if (!field) {
  console.log('❌ Field not found');
} else {
  console.log('✅ Field found:', field);
  
  // Check current state
  console.log('📊 Current field state:', {
    value: field.value,
    hasErrorClass: field.classList.contains('error-field'),
    fieldName: fieldName
  });
  
  // Find the error message element
  const errorElement = field.closest('.form-field_wrapper')?.querySelector('.form_error-message');
  console.log('🔍 Error message element:', {
    found: !!errorElement,
    hasActiveError: errorElement?.classList.contains('active-error'),
    text: errorElement?.textContent,
    visible: errorElement ? window.getComputedStyle(errorElement).display !== 'none' : false
  });
  
  // Test FormLib error functions
  if (window.FormLib) {
    console.log('📋 Testing FormLib error functions...');
    
    // Check if field has error
    const hasError = FormLib.hasError(fieldName);
    console.log('🔍 FormLib.hasError result:', hasError);
    
    // Test manual clearError
    console.log('🧪 Calling FormLib.clearError...');
    FormLib.clearError(fieldName);
    
    // Check state after clearError
    setTimeout(() => {
      console.log('📊 After clearError:', {
        fieldHasErrorClass: field.classList.contains('error-field'),
        errorElementHasActiveError: errorElement?.classList.contains('active-error'),
        errorElementVisible: errorElement ? window.getComputedStyle(errorElement).display !== 'none' : false
      });
    }, 100);
    
    // Test manual validateField
    console.log('🧪 Calling FormLib.validateField...');
    const validationResult = FormLib.validateField(fieldName);
    console.log('📊 Validation result:', validationResult);
    
    // Check final state
    setTimeout(() => {
      console.log('📊 After validateField:', {
        validationPassed: validationResult,
        fieldHasErrorClass: field.classList.contains('error-field'),
        errorElementHasActiveError: errorElement?.classList.contains('active-error'),
        errorElementVisible: errorElement ? window.getComputedStyle(errorElement).display !== 'none' : false,
        errorElementText: errorElement?.textContent
      });
    }, 100);
    
  } else {
    console.log('❌ FormLib not available');
  }
}

console.log('🔍 ERROR MESSAGE CLEARING DEBUG COMPLETE'); 