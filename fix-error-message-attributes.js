/**
 * Form Field Wrapper Standardization Script
 * Fixes missing data-form="required" attributes and standardizes error containers
 */

(function() {
  'use strict';
  
  console.log('🔧 Starting Form Field Wrapper Standardization...');
  
  // Statistics tracking
  let stats = {
    errorContainersFound: 0,
    errorContainersFixed: 0,
    errorContainersCreated: 0,
    requiredFieldsProcessed: 0
  };
  
  /**
   * Fix missing data-form="required" attributes
   */
  function fixMissingDataFormAttributes() {
    console.log('📝 Step 1: Fixing missing data-form="required" attributes...');
    
    // Find all error message containers without the required attribute
    const errorContainers = document.querySelectorAll('.form_error-message');
    
    errorContainers.forEach((container, index) => {
      stats.errorContainersFound++;
      
      if (!container.hasAttribute('data-form')) {
        console.log(`✅ Fixed error container #${index + 1}:`, container);
        container.setAttribute('data-form', 'required');
        stats.errorContainersFixed++;
      }
    });
    
    console.log(`📊 Fixed ${stats.errorContainersFixed} of ${stats.errorContainersFound} error containers`);
  }
  
  /**
   * Create missing error containers for required fields
   */
  function createMissingErrorContainers() {
    console.log('📝 Step 2: Creating missing error containers...');
    
    // Find all required fields
    const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    
    requiredFields.forEach((field, index) => {
      stats.requiredFieldsProcessed++;
      
      const fieldWrapper = field.closest('.form-field_wrapper');
      if (!fieldWrapper) {
        console.warn(`⚠️ Required field without .form-field_wrapper:`, field);
        return;
      }
      
      // Check if error container exists
      let errorContainer = fieldWrapper.querySelector('.form_error-message');
      
      if (!errorContainer) {
        console.log(`➕ Creating error container for field:`, field.name || field.id);
        
        // Create new error container
        errorContainer = document.createElement('div');
        errorContainer.className = 'form_error-message';
        errorContainer.setAttribute('data-form', 'required');
        errorContainer.textContent = 'This field is required';
        errorContainer.style.display = 'none';
        
        // Insert after the field element (or its immediate wrapper)
        const insertTarget = field.parentElement?.classList.contains('multi-form_input-field') 
          ? field.parentElement 
          : field;
        
        insertTarget.parentElement?.appendChild(errorContainer);
        stats.errorContainersCreated++;
      }
    });
    
    console.log(`📊 Processed ${stats.requiredFieldsProcessed} required fields, created ${stats.errorContainersCreated} error containers`);
  }
  
  /**
   * Validate the standardization results
   */
  function validateStandardization() {
    console.log('📝 Step 3: Validating standardization...');
    
    const issues = [];
    
    // Check for error containers without data-form="required"
    const invalidErrorContainers = document.querySelectorAll('.form_error-message:not([data-form="required"])');
    if (invalidErrorContainers.length > 0) {
      issues.push(`${invalidErrorContainers.length} error containers still missing data-form="required"`);
    }
    
    // Check for required fields without error containers
    const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    let fieldsWithoutErrors = 0;
    
    requiredFields.forEach(field => {
      const wrapper = field.closest('.form-field_wrapper');
      if (wrapper && !wrapper.querySelector('.form_error-message')) {
        fieldsWithoutErrors++;
      }
    });
    
    if (fieldsWithoutErrors > 0) {
      issues.push(`${fieldsWithoutErrors} required fields still missing error containers`);
    }
    
    // Report results
    if (issues.length === 0) {
      console.log('✅ Validation passed! All form fields are properly standardized.');
    } else {
      console.warn('⚠️ Validation issues found:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    }
    
    return issues.length === 0;
  }
  
  /**
   * Enhanced error container finder for library compatibility
   */
  function enhanceErrorHandling() {
    console.log('📝 Step 4: Enhancing error handling compatibility...');
    
    // Add data attribute to form for enhanced error handling
    const form = document.querySelector('form[data-form="multistep"]');
    if (form) {
      form.setAttribute('data-error-standardized', 'true');
    }
    
    // Inject enhanced CSS if not already present
    if (!document.querySelector('#enhanced-error-css')) {
      const style = document.createElement('style');
      style.id = 'enhanced-error-css';
      style.textContent = `
        /* Enhanced Error Message Display - Form Standardization */
        .form_error-message {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          transition: all 0.2s ease-in-out !important;
        }

        .form_error-message.active-error,
        .form_error-message[data-form="required"].active-error,
        div.form_error-message.active-error {
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          color: #e74c3c !important;
          font-size: 0.875rem !important;
          margin-top: 0.25rem !important;
          line-height: 1.4 !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          position: relative !important;
          z-index: 1000 !important;
        }

        /* Error field styling */
        input.error-field,
        select.error-field,
        textarea.error-field,
        .form_input.error-field {
          border: 2px solid #e74c3c !important;
          box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
          background-color: rgba(231, 76, 60, 0.02) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  /**
   * Main execution function
   */
  function main() {
    try {
      // Step 1: Fix missing attributes
      fixMissingDataFormAttributes();
      
      // Step 2: Create missing containers
      createMissingErrorContainers();
      
      // Step 3: Validate results
      const isValid = validateStandardization();
      
      // Step 4: Enhance error handling
      enhanceErrorHandling();
      
      // Final report
      console.log('\n📊 STANDARDIZATION COMPLETE');
      console.log('================================');
      console.log(`Error containers found: ${stats.errorContainersFound}`);
      console.log(`Error containers fixed: ${stats.errorContainersFixed}`);
      console.log(`Error containers created: ${stats.errorContainersCreated}`);
      console.log(`Required fields processed: ${stats.requiredFieldsProcessed}`);
      console.log(`Validation: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
      
      if (isValid) {
        console.log('\n🎉 Form field wrappers are now properly standardized!');
        console.log('Error messages should now display correctly for all required fields.');
      }
      
    } catch (error) {
      console.error('❌ Error during standardization:', error);
    }
  }
  
  // Execute immediately or wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
  
})();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { main };
}