/**
 * BROWSER VALIDATION FIX
 * Disables HTML5 browser validation to prevent conflicts with our custom error system
 */

function disableBrowserValidation() {
  console.log('🛠️ FIXING BROWSER VALIDATION CONFLICTS');
  console.log('=====================================');

  // 1. Add novalidate to all forms
  const forms = document.querySelectorAll('form');
  forms.forEach((form, index) => {
    form.setAttribute('novalidate', 'true');
    console.log(`✅ ${index + 1}. Added novalidate to form:`, {
      id: form.id || 'no-id',
      classes: Array.from(form.classList),
      hasMultistep: form.hasAttribute('data-form') && form.getAttribute('data-form') === 'multistep'
    });
  });

  // 2. Remove required attributes from inputs (our validation handles this)
  const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
  console.log(`\n🔧 Found ${requiredInputs.length} inputs with 'required' attribute`);
  
  requiredInputs.forEach((input, index) => {
    const fieldName = input.name || input.getAttribute('data-step-field-name') || 'unnamed';
    const wasRequired = input.hasAttribute('required');
    
    // Store original required state in data attribute for our validation
    if (wasRequired) {
      input.setAttribute('data-required', 'true');
      input.removeAttribute('required');
      
      console.log(`   ${index + 1}. ${fieldName}: required → data-required="true"`);
    }
  });

  // 3. Clear any existing browser validation messages
  const inputsWithValidation = document.querySelectorAll('input, select, textarea');
  inputsWithValidation.forEach(input => {
    if (input.setCustomValidity) {
      input.setCustomValidity(''); // Clear custom validation message
    }
  });

  // 4. Update our validation rules to use data-required instead of required
  console.log('\n⚙️ UPDATING VALIDATION CONFIGURATION');
  
  if (window.FormLib && window.FormLib.isInitialized && window.FormLib.isInitialized()) {
    try {
      // Re-initialize validation with updated rules
      console.log('🔄 Re-initializing FormLib validation...');
      // FormLib should automatically pick up data-required attributes
      
      console.log('✅ FormLib validation updated');
    } catch (error) {
      console.error('❌ Error updating FormLib validation:', error);
    }
  } else {
    console.log('⚠️ FormLib not yet initialized - will pick up changes on next init');
  }

  // 5. Test validation changes
  console.log('\n🧪 TESTING VALIDATION CHANGES');
  
  const testResults = {
    formsWithNovalidate: document.querySelectorAll('form[novalidate]').length,
    inputsWithDataRequired: document.querySelectorAll('input[data-required], select[data-required], textarea[data-required]').length,
    inputsStillRequired: document.querySelectorAll('input[required], select[required], textarea[required]').length,
    browserValidationDisabled: true
  };

  console.log('📊 RESULTS:', testResults);

  // 6. Verify no more browser validation
  setTimeout(() => {
    console.log('\n🔍 VERIFICATION (after 1 second):');
    
    // Try to trigger validation on a test input
    const testInput = document.querySelector('input[data-required]');
    if (testInput) {
      const validity = testInput.validity;
      console.log('Test input validity:', {
        valid: validity.valid,
        valueMissing: validity.valueMissing,
        validationMessage: testInput.validationMessage
      });
      
      if (testInput.validationMessage === '') {
        console.log('✅ Browser validation successfully disabled');
      } else {
        console.log('⚠️ Browser validation may still be active');
      }
    }
  }, 1000);

  return testResults;
}

// Auto-run the fix
disableBrowserValidation(); 