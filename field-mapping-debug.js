/**
 * Field Mapping Debug Script
 * Check if field names match between elements and validation system
 */

console.log('🔍 FIELD MAPPING DEBUG...');

// Find the first name field
const firstNameField = document.querySelector('input[name="First-Name"]');
if (firstNameField) {
  console.log('✅ Found First-Name field:', {
    name: firstNameField.name,
    dataStepFieldName: firstNameField.getAttribute('data-step-field-name'),
    value: firstNameField.value,
    hasErrorClass: firstNameField.classList.contains('error-field')
  });
  
  // Test the utility function directly
  if (typeof getInputValue !== 'undefined') {
    console.log('🧪 Testing getInputValue:', getInputValue(firstNameField));
  } else {
    console.log('❌ getInputValue not available globally');
  }
  
  // Check validation system registration
  if (typeof FormLib !== 'undefined' && FormLib.getState) {
    try {
      const state = FormLib.getState();
      const validationState = state.validation?.fieldValidations;
      
      console.log('📊 Validation registrations:', Object.keys(validationState || {}));
      
      // Check specifically for First-Name
      const firstNameValidation = validationState?.['First-Name'];
      if (firstNameValidation) {
        console.log('✅ First-Name validation found:', {
          element: firstNameValidation.element,
          elementName: firstNameValidation.element?.name,
          elementValue: firstNameValidation.element?.value,
          isValid: firstNameValidation.isValid,
          rules: firstNameValidation.rules?.map(r => r.type)
        });
        
        // Test if the elements match
        const elementsMatch = firstNameValidation.element === firstNameField;
        console.log('🔍 Elements match:', elementsMatch);
        
        if (!elementsMatch) {
          console.log('❌ Element mismatch detected!', {
            validationElement: firstNameValidation.element,
            actualElement: firstNameField,
            validationElementValue: firstNameValidation.element?.value,
            actualElementValue: firstNameField.value
          });
        }
      } else {
        console.log('❌ No validation registration for First-Name');
        console.log('📋 Available registrations:', Object.keys(validationState || {}));
      }
    } catch (e) {
      console.error('❌ Could not access validation state:', e);
    }
  }
  
  // Try manual validation call
  if (typeof FormLib !== 'undefined' && FormLib.validateField) {
    console.log('🧪 Testing manual validation...');
    try {
      const result = FormLib.validateField('First-Name');
      console.log('📊 Manual validation result:', result);
      console.log('📊 Field state after manual validation:', {
        value: firstNameField.value,
        hasErrorClass: firstNameField.classList.contains('error-field')
      });
    } catch (e) {
      console.error('❌ Manual validation error:', e);
    }
  }
} else {
  console.error('❌ Could not find First-Name field');
}

console.log('🔍 FIELD MAPPING DEBUG COMPLETE'); 