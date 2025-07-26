/**
 * Improved Form Interaction Fix
 * Fixes form field click conflicts while preserving navigation functionality
 * 
 * Run this in browser console to apply the refined fix
 */

console.log('🔧 === IMPROVED FORM INTERACTION FIX ===');
console.log('📅 Fix Date:', new Date().toISOString());

/**
 * Remove previous protection and apply improved fix
 */
function applyImprovedFix() {
  console.log('🛠️ Applying improved form interaction fix...');
  
  // First, remove any existing protection
  if (window.removeFieldProtection) {
    window.removeFieldProtection();
    console.log('🗑️ Removed previous field protection');
  }
  
  if (window.removeClickAnalyzer) {
    window.removeClickAnalyzer();
    console.log('🗑️ Removed click analyzer');
  }
  
  if (window.removeFocusAnalyzer) {
    window.removeFocusAnalyzer();
    console.log('🗑️ Removed focus analyzer');
  }
  
  // Apply improved selective protection
  const formFields = document.querySelectorAll('input, select, textarea');
  
  const improvedFieldHandler = (event) => {
    // Only protect if the click is directly on the form field
    // AND it's not a navigation-related element
    const target = event.target;
    
    // Check if this is a navigation element that should NOT be protected
    const isNavigationElement = 
      target.hasAttribute('data-form') && 
      (target.getAttribute('data-form').includes('btn') || 
       target.getAttribute('data-form') === 'next' ||
       target.getAttribute('data-form') === 'back') ||
      target.hasAttribute('data-skip') ||
      target.closest('[data-form*="btn"]') ||
      target.closest('[data-skip]');
    
    // Check if this is a radio button that might trigger step progression
    const isRadioButton = target.type === 'radio';
    
    // Only protect text inputs, email, etc. - NOT navigation elements or radio buttons
    const isFormInput = target.matches('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea, select') && !isNavigationElement;
    
    if (isFormInput) {
      console.log('🛡️ Protecting form input:', target.name || target.id);
      event.stopPropagation();
    } else if (isNavigationElement) {
      console.log('🧭 Allowing navigation element:', target.getAttribute('data-form') || target.getAttribute('data-skip'));
      // Let navigation events proceed normally
    } else if (isRadioButton) {
      console.log('📻 Radio button interaction:', target.name, target.value);
      // Let radio buttons work normally for step progression
    }
  };
  
  // Add improved protection to form fields only
  formFields.forEach(field => {
    // Only protect non-navigation form fields
    if (!field.hasAttribute('data-skip') && 
        !field.hasAttribute('data-form') &&
        field.type !== 'radio') {
      field.addEventListener('click', improvedFieldHandler, true);
      field.addEventListener('focus', improvedFieldHandler, true);
    }
  });
  
  console.log('🛡️ Improved protection applied to non-navigation form fields');
  
  // Ensure navigation buttons are completely unobstructed
  const navigationElements = document.querySelectorAll('[data-form*="btn"], [data-skip], [data-form="next"], [data-form="back"]');
  navigationElements.forEach(navElement => {
    navElement.style.pointerEvents = 'auto';
    navElement.style.zIndex = '9999';
    
    // Remove any conflicting event listeners that might have been added
    navElement.addEventListener('click', (event) => {
      console.log('🧭 Navigation click allowed:', navElement.getAttribute('data-form') || navElement.getAttribute('data-skip'));
      // Ensure the event can bubble up normally for navigation
      event.stopImmediatePropagation = () => {}; // Disable stopping propagation
    }, false); // Use capture: false to run after other handlers
  });
  
  console.log('🧭 Navigation elements unobstructed:', navigationElements.length);
  
  // Store cleanup function for the improved fix
  window.removeImprovedProtection = () => {
    formFields.forEach(field => {
      field.removeEventListener('click', improvedFieldHandler, true);
      field.removeEventListener('focus', improvedFieldHandler, true);
    });
    console.log('🗑️ Improved protection removed');
  };
  
  return {
    protectedFields: formFields.length,
    navigationElements: navigationElements.length,
    status: 'applied'
  };
}

/**
 * Test navigation functionality specifically
 */
function testNavigationElements() {
  console.log('\n🧪 === NAVIGATION ELEMENT TEST ===');
  
  const nextBtn = document.querySelector('[data-form="next-btn"]');
  const backBtn = document.querySelector('[data-form="back-btn"]');
  const skipBtns = document.querySelectorAll('[data-skip]');
  
  console.log('Navigation elements found:');
  console.log('➡️ Next button:', !!nextBtn, nextBtn?.className);
  console.log('⬅️ Back button:', !!backBtn, backBtn?.className);
  console.log('⏭️ Skip buttons:', skipBtns.length);
  
  // Test if navigation elements are clickable
  if (nextBtn) {
    console.log('Next button styles:', {
      pointerEvents: getComputedStyle(nextBtn).pointerEvents,
      zIndex: getComputedStyle(nextBtn).zIndex,
      display: getComputedStyle(nextBtn).display
    });
  }
  
  if (backBtn) {
    console.log('Back button styles:', {
      pointerEvents: getComputedStyle(backBtn).pointerEvents,
      zIndex: getComputedStyle(backBtn).zIndex,
      display: getComputedStyle(backBtn).display
    });
  }
  
  // Test first few skip buttons
  skipBtns.forEach((skipBtn, index) => {
    if (index < 3) {
      console.log(`Skip button ${index}:`, {
        skipTarget: skipBtn.getAttribute('data-skip'),
        pointerEvents: getComputedStyle(skipBtn).pointerEvents,
        display: getComputedStyle(skipBtn).display
      });
    }
  });
}

/**
 * Add navigation click debugging
 */
function addNavigationDebugging() {
  console.log('\n🐛 === ADDING NAVIGATION DEBUGGING ===');
  
  // Add debugging to all navigation elements
  const allNavElements = document.querySelectorAll('[data-form*="btn"], [data-skip], button');
  
  allNavElements.forEach((element, index) => {
    if (index < 10) { // First 10 elements
      element.addEventListener('click', (event) => {
        console.log('🖱️ NAVIGATION CLICK DEBUG:', {
          element: element.tagName,
          className: element.className,
          dataForm: element.getAttribute('data-form'),
          dataSkip: element.getAttribute('data-skip'),
          eventDefaultPrevented: event.defaultPrevented,
          eventPropagationStopped: event.cancelBubble
        });
      }, true); // Capture phase
    }
  });
  
  console.log('🐛 Navigation debugging added to first 10 navigation elements');
}

/**
 * Main improved fix runner
 */
function runImprovedFix() {
  console.log('🚀 Starting Improved Form Interaction Fix...\n');
  
  try {
    const result = applyImprovedFix();
    testNavigationElements();
    addNavigationDebugging();
    
    console.log('\n📋 === IMPROVED FIX SUMMARY ===');
    console.log('🛡️ Protected fields:', result.protectedFields);
    console.log('🧭 Navigation elements preserved:', result.navigationElements);
    console.log('✅ Status:', result.status);
    
    console.log('\n🧪 TEST INSTRUCTIONS:');
    console.log('1. Try clicking on text/email form fields - should work without step progression');
    console.log('2. Try clicking BACK button - should work now');
    console.log('3. Try clicking NEXT button - should work');
    console.log('4. Try skip buttons - should work');
    console.log('5. Watch console for navigation click debug messages');
    
    console.log('\n🗑️ CLEANUP:');
    console.log('- window.removeImprovedProtection() - Remove improved protection');
    
    return result;
    
  } catch (error) {
    console.error('❌ Improved fix failed:', error);
    return { error: error.message };
  }
}

// Export functions
window.improvedFix = {
  runImprovedFix,
  applyImprovedFix,
  testNavigationElements,
  addNavigationDebugging
};

// Auto-run the improved fix
console.log('🧪 Improved Form Interaction Fix Script Loaded');
console.log('📋 Run improvedFix.runImprovedFix() to apply the refined fix');

// Auto-run
runImprovedFix(); 