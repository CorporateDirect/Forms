/**
 * ERROR MESSAGE AUDIT SCRIPT
 * Identifies any error messages that exist outside the standardized .form_error-message system
 */

function auditErrorMessages() {
  console.log('🔍 STARTING ERROR MESSAGE AUDIT');
  console.log('=====================================');
  
  const results = {
    standardErrors: [],
    nonStandardErrors: [],
    browserValidation: [],
    webflowErrors: [],
    hiddenErrors: [],
    recommendations: []
  };

  // 1. Check for our standardized error messages
  console.log('\n📋 1. STANDARDIZED ERROR MESSAGES (.form_error-message)');
  const standardErrors = document.querySelectorAll('.form_error-message, [data-form="error"]');
  standardErrors.forEach((error, index) => {
    const fieldName = error.getAttribute('data-field') || 'unknown';
    const message = error.textContent?.trim() || '';
    const isVisible = error.offsetParent !== null;
    const hasActiveClass = error.classList.contains('active-error');
    
    results.standardErrors.push({
      index: index + 1,
      element: error,
      fieldName,
      message,
      isVisible,
      hasActiveClass,
      classes: Array.from(error.classList),
      attributes: Array.from(error.attributes).map(attr => `${attr.name}="${attr.value}"`)
    });

    console.log(`   ${index + 1}. Field: ${fieldName} | Visible: ${isVisible} | Active: ${hasActiveClass} | Message: "${message}"`);
  });

  // 2. Check for non-standard error elements
  console.log('\n⚠️  2. NON-STANDARD ERROR ELEMENTS');
  const possibleErrorSelectors = [
    '.error', '.error-message', '.field-error', '.validation-error',
    '.alert', '.warning', '.notice', '[role="alert"]',
    '.w-form-fail', '.w-form-error', // Webflow specific
    '.fs-inputactive-error', '.fs-error', // Finsweet specific
    '*[class*="error"]:not(.form_error-message):not([data-form="error"])',
    '*[id*="error"]', '*[data-error]'
  ];

  possibleErrorSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Skip if it's one of our standard error elements
        if (element.classList.contains('form_error-message') || element.getAttribute('data-form') === 'error') {
          return;
        }

        const message = element.textContent?.trim() || '';
        const isVisible = element.offsetParent !== null;
        
        if (message || isVisible) {
          results.nonStandardErrors.push({
            element,
            selector,
            message,
            isVisible,
            classes: Array.from(element.classList),
            tagName: element.tagName,
            attributes: Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`)
          });

          console.log(`   ⚠️  Found: ${selector} | Tag: ${element.tagName} | Visible: ${isVisible} | Message: "${message}"`);
          console.log(`       Classes: ${Array.from(element.classList).join(', ')}`);
        }
      });
    } catch (e) {
      // Skip invalid selectors
    }
  });

  // 3. Check for browser validation messages
  console.log('\n🌐 3. BROWSER VALIDATION MESSAGES');
  const formInputs = document.querySelectorAll('input, select, textarea');
  formInputs.forEach((input, index) => {
    const validity = input.validity;
    const validationMessage = input.validationMessage;
    const hasCustomValidity = input.getAttribute('data-custom-validity') !== null;
    
    if (!validity.valid || validationMessage) {
      results.browserValidation.push({
        element: input,
        name: input.name || input.getAttribute('data-step-field-name') || 'unnamed',
        validationMessage,
        validity: {
          valid: validity.valid,
          valueMissing: validity.valueMissing,
          typeMismatch: validity.typeMismatch,
          patternMismatch: validity.patternMismatch,
          tooLong: validity.tooLong,
          tooShort: validity.tooShort,
          rangeUnderflow: validity.rangeUnderflow,
          rangeOverflow: validity.rangeOverflow,
          stepMismatch: validity.stepMismatch,
          badInput: validity.badInput,
          customError: validity.customError
        },
        hasCustomValidity
      });

      console.log(`   ${index + 1}. Field: ${input.name || 'unnamed'} | Valid: ${validity.valid} | Message: "${validationMessage}"`);
      console.log(`       Validity issues: ${Object.entries(validity).filter(([key, value]) => value === true && key !== 'valid').map(([key]) => key).join(', ')}`);
    }
  });

  // 4. Check for Webflow-specific error patterns
  console.log('\n🎨 4. WEBFLOW ERROR PATTERNS');
  const webflowErrorSelectors = [
    '.w-form-fail', '.w-form-error', '.w-form-done',
    '.fs-inputactive-error', '.fs-inputerror-class',
    '*[fs-inputerror-class]', '*[fs-inputactive-class]'
  ];

  webflowErrorSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const message = element.textContent?.trim() || '';
        const isVisible = element.offsetParent !== null;
        
        results.webflowErrors.push({
          element,
          selector,
          message,
          isVisible,
          classes: Array.from(element.classList),
          attributes: Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`)
        });

        console.log(`   🎨 Found: ${selector} | Visible: ${isVisible} | Message: "${message}"`);
      });
    } catch (e) {
      // Skip invalid selectors
    }
  });

  // 5. Check for hidden/orphaned error elements
  console.log('\n👻 5. HIDDEN/ORPHANED ERROR ELEMENTS');
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    const text = element.textContent?.trim() || '';
    const isErrorLike = /error|invalid|required|must|cannot|failed|wrong/i.test(text) && text.length < 100;
    const isVisible = element.offsetParent !== null;
    const hasErrorClasses = Array.from(element.classList).some(cls => /error|invalid|warning|alert/i.test(cls));
    
    if ((isErrorLike || hasErrorClasses) && !isVisible && text.length > 0) {
      // Skip if it's already in our standardized system
      if (element.classList.contains('form_error-message') || element.getAttribute('data-form') === 'error') {
        return;
      }

      results.hiddenErrors.push({
        element,
        message: text,
        classes: Array.from(element.classList),
        reason: isErrorLike ? 'error-like text' : 'error-like classes'
      });

      console.log(`   👻 Hidden: "${text}" | Classes: ${Array.from(element.classList).join(', ')}`);
    }
  });

  // 6. Generate recommendations
  console.log('\n💡 6. RECOMMENDATIONS');
  
  if (results.nonStandardErrors.length > 0) {
    results.recommendations.push('🚨 NON-STANDARD ERROR ELEMENTS FOUND - These should be converted to use .form_error-message structure');
    console.log('   🚨 NON-STANDARD ERROR ELEMENTS FOUND - These should be converted to use .form_error-message structure');
  }

  if (results.browserValidation.length > 0) {
    results.recommendations.push('🌐 BROWSER VALIDATION ACTIVE - Consider adding novalidate to form to prevent native validation conflicts');
    console.log('   🌐 BROWSER VALIDATION ACTIVE - Consider adding novalidate to form to prevent native validation conflicts');
  }

  if (results.webflowErrors.length > 0) {
    results.recommendations.push('🎨 WEBFLOW ERROR ELEMENTS DETECTED - Ensure these don\'t conflict with our error system');
    console.log('   🎨 WEBFLOW ERROR ELEMENTS DETECTED - Ensure these don\'t conflict with our error system');
  }

  if (results.hiddenErrors.length > 0) {
    results.recommendations.push('👻 HIDDEN ERROR ELEMENTS FOUND - These may be orphaned and should be cleaned up');
    console.log('   👻 HIDDEN ERROR ELEMENTS FOUND - These may be orphaned and should be cleaned up');
  }

  // 7. Summary
  console.log('\n📊 AUDIT SUMMARY');
  console.log('================');
  console.log(`✅ Standardized errors: ${results.standardErrors.length}`);
  console.log(`⚠️  Non-standard errors: ${results.nonStandardErrors.length}`);
  console.log(`🌐 Browser validation issues: ${results.browserValidation.length}`);
  console.log(`🎨 Webflow error elements: ${results.webflowErrors.length}`);
  console.log(`👻 Hidden/orphaned errors: ${results.hiddenErrors.length}`);
  console.log(`💡 Recommendations: ${results.recommendations.length}`);

  // Store results globally for further inspection
  window.errorAuditResults = results;
  console.log('\n📁 Full results stored in: window.errorAuditResults');
  
  return results;
}

// Auto-run the audit
auditErrorMessages(); 