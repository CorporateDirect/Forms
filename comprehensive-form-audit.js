/**
 * Comprehensive Form Audit Script
 * Tests HTML/CSS structure compatibility with Form Functionality Library v1.4.3
 * 
 * Run this in browser console on the RealShield form page
 */

console.log('🔍 === COMPREHENSIVE FORM AUDIT v1.4.3 ===');
console.log('📅 Audit Date:', new Date().toISOString());

// Global audit results
const auditResults = {
  libraryStatus: {},
  htmlStructure: {},
  cssAnalysis: {},
  compatibility: {},
  recommendations: []
};

/**
 * SECTION 1: Library Integration Audit
 */
function auditLibraryIntegration() {
  console.log('\n🚀 === LIBRARY INTEGRATION AUDIT ===');
  
  // Check library availability
  const formLibExists = typeof window.FormLib !== 'undefined';
  console.log('📦 FormLib Available:', formLibExists);
  
  if (formLibExists) {
    // Check initialization
    let isInitialized = false;
    try {
      isInitialized = window.FormLib.isInitialized();
    } catch (error) {
      console.log('⚠️ isInitialized() error:', error.message);
    }
    
    // Get available methods
    const availableMethods = [];
    try {
      Object.getOwnPropertyNames(Object.getPrototypeOf(window.FormLib)).forEach(method => {
        if (typeof window.FormLib[method] === 'function') {
          availableMethods.push(method);
        }
      });
    } catch (error) {
      console.log('⚠️ Method enumeration error:', error.message);
    }
    
    // Test key methods
    const methodTests = {};
    ['init', 'isInitialized', 'getState', 'debugStepSystem', 'validateForm'].forEach(method => {
      methodTests[method] = typeof window.FormLib[method] === 'function';
    });
    
    auditResults.libraryStatus = {
      exists: formLibExists,
      isInitialized,
      availableMethods,
      methodTests,
      version: 'v1.4.3 expected'
    };
    
    console.log('✅ Library Status:', auditResults.libraryStatus);
  } else {
    auditResults.libraryStatus = { exists: false, error: 'FormLib not found in window object' };
    console.log('❌ FormLib not found - library may not be loaded');
  }
}

/**
 * SECTION 2: HTML Structure Audit
 */
function auditHTMLStructure() {
  console.log('\n🏗️ === HTML STRUCTURE AUDIT ===');
  
  // Check multistep form
  const multistepForm = document.querySelector('[data-form="multistep"]');
  console.log('📋 Multistep Form Found:', !!multistepForm);
  
  // Check steps
  const steps = document.querySelectorAll('[data-form="step"]');
  const stepWrappers = document.querySelectorAll('.step_wrapper[data-answer]');
  
  console.log('📊 Steps Found:', {
    'data-form="step"': steps.length,
    '.step_wrapper[data-answer]': stepWrappers.length
  });
  
  // Analyze step structure
  const stepAnalysis = [];
  stepWrappers.forEach((wrapper, index) => {
    const stepId = wrapper.getAttribute('data-answer');
    const parentStep = wrapper.closest('[data-form="step"]');
    const isVisible = getComputedStyle(wrapper).display !== 'none' && 
                     getComputedStyle(wrapper).visibility !== 'hidden';
    
    stepAnalysis.push({
      index,
      stepId,
      hasParentStep: !!parentStep,
      isVisible,
      classes: wrapper.className,
      display: getComputedStyle(wrapper).display,
      visibility: getComputedStyle(wrapper).visibility
    });
    
    if (index < 5 || stepId === 'step-0') { // Log first 5 steps and step-0
      console.log(`📝 Step ${index} (${stepId}):`, {
        isVisible,
        classes: wrapper.className,
        display: getComputedStyle(wrapper).display,
        visibility: getComputedStyle(wrapper).visibility
      });
    }
  });
  
  // Check navigation buttons
  const nextBtn = document.querySelector('[data-form="next-btn"]');
  const backBtn = document.querySelector('[data-form="back-btn"]');
  const skipBtns = document.querySelectorAll('[data-skip]');
  
  const navigationAnalysis = {
    nextButton: !!nextBtn,
    backButton: !!backBtn,
    skipButtons: skipBtns.length,
    skipTargets: Array.from(skipBtns).map(btn => btn.getAttribute('data-skip'))
  };
  
  console.log('🧭 Navigation Buttons:', navigationAnalysis);
  
  // Check form fields structure
  const formFields = document.querySelectorAll('.form-field_wrapper, .multi-form_field-wrapper');
  const fieldAnalysis = [];
  
  formFields.forEach((field, index) => {
    if (index < 10) { // Analyze first 10 fields
      const label = field.querySelector('label');
      const input = field.querySelector('input, select, textarea');
      const errorDiv = field.querySelector('[data-form="error"], .form_error-message');
      
      fieldAnalysis.push({
        hasLabel: !!label,
        hasInput: !!input,
        hasErrorDiv: !!errorDiv,
        inputType: input ? input.type || input.tagName.toLowerCase() : null,
        classes: field.className
      });
    }
  });
  
  console.log('📝 Form Fields Analysis (first 10):', fieldAnalysis);
  
  auditResults.htmlStructure = {
    multistepForm: !!multistepForm,
    totalSteps: steps.length,
    totalStepWrappers: stepWrappers.length,
    stepAnalysis: stepAnalysis.slice(0, 10), // First 10 for brevity
    navigationAnalysis,
    formFieldsCount: formFields.length,
    fieldAnalysis
  };
}

/**
 * SECTION 3: CSS Compatibility Audit
 */
function auditCSSCompatibility() {
  console.log('\n🎨 === CSS COMPATIBILITY AUDIT ===');
  
  // Check step-0 specifically
  const step0 = document.querySelector('[data-answer="step-0"]');
  if (step0) {
    const step0Analysis = {
      found: true,
      display: getComputedStyle(step0).display,
      visibility: getComputedStyle(step0).visibility,
      opacity: getComputedStyle(step0).opacity,
      position: getComputedStyle(step0).position,
      zIndex: getComputedStyle(step0).zIndex,
      transform: getComputedStyle(step0).transform,
      hasActiveClass: step0.classList.contains('active-step'),
      hasHiddenClass: step0.classList.contains('hidden-step'),
      inlineStyles: step0.style.cssText
    };
    console.log('👁️ Step-0 CSS Analysis:', step0Analysis);
    auditResults.cssAnalysis.step0 = step0Analysis;
  } else {
    console.log('❌ Step-0 not found');
    auditResults.cssAnalysis.step0 = { found: false };
  }
  
  // Check for CSS conflicts
  const potentialConflicts = [];
  
  // Check for hiding CSS
  const allSteps = document.querySelectorAll('.step_wrapper[data-answer]');
  let hiddenSteps = 0;
  let visibleSteps = 0;
  
  allSteps.forEach(step => {
    const computed = getComputedStyle(step);
    if (computed.display === 'none' || computed.visibility === 'hidden' || computed.opacity === '0') {
      hiddenSteps++;
    } else {
      visibleSteps++;
    }
  });
  
  console.log('👥 Step Visibility Summary:', {
    totalSteps: allSteps.length,
    visibleSteps,
    hiddenSteps
  });
  
  // Check for form field CSS issues
  const formFieldIssues = [];
  const formFields = document.querySelectorAll('.form-field_wrapper, .multi-form_field-wrapper');
  
  formFields.forEach((field, index) => {
    if (index < 5) { // Check first 5 fields
      const computed = getComputedStyle(field);
      if (computed.display === 'none') {
        formFieldIssues.push(`Field ${index} is hidden with display: none`);
      }
    }
  });
  
  auditResults.cssAnalysis.stepVisibility = { visibleSteps, hiddenSteps, totalSteps: allSteps.length };
  auditResults.cssAnalysis.formFieldIssues = formFieldIssues;
  auditResults.cssAnalysis.potentialConflicts = potentialConflicts;
}

/**
 * SECTION 4: Progressive Disclosure Test
 */
function testProgressiveDisclosure() {
  console.log('\n🎭 === PROGRESSIVE DISCLOSURE TEST ===');
  
  const step0 = document.querySelector('[data-answer="step-0"]');
  if (!step0) {
    console.log('❌ Cannot test progressive disclosure - step-0 not found');
    return;
  }
  
  // Test if step-0 is properly visible
  const isStep0Visible = getComputedStyle(step0).display !== 'none' && 
                        getComputedStyle(step0).visibility !== 'hidden' && 
                        getComputedStyle(step0).opacity !== '0';
  
  console.log('🎯 Step-0 Progressive Disclosure Test:', {
    isVisible: isStep0Visible,
    hasActiveClass: step0.classList.contains('active-step'),
    computedDisplay: getComputedStyle(step0).display,
    computedVisibility: getComputedStyle(step0).visibility,
    computedOpacity: getComputedStyle(step0).opacity
  });
  
  // Count how many steps are visible (should be only 1 for proper progressive disclosure)
  const allSteps = document.querySelectorAll('.step_wrapper[data-answer]');
  const visibleSteps = Array.from(allSteps).filter(step => {
    const computed = getComputedStyle(step);
    return computed.display !== 'none' && 
           computed.visibility !== 'hidden' && 
           computed.opacity !== '0';
  });
  
  console.log('📊 Progressive Disclosure Summary:', {
    totalSteps: allSteps.length,
    visibleStepsCount: visibleSteps.length,
    visibleStepIds: visibleSteps.map(s => s.getAttribute('data-answer')),
    isProperlyConfigured: visibleSteps.length === 1 && isStep0Visible
  });
  
  auditResults.compatibility.progressiveDisclosure = {
    step0Visible: isStep0Visible,
    totalVisibleSteps: visibleSteps.length,
    isProperlyConfigured: visibleSteps.length === 1 && isStep0Visible
  };
}

/**
 * SECTION 5: Navigation Button Test
 */
function testNavigationButtons() {
  console.log('\n🧭 === NAVIGATION BUTTON TEST ===');
  
  const nextBtn = document.querySelector('[data-form="next-btn"]');
  const backBtn = document.querySelector('[data-form="back-btn"]');
  const skipBtns = document.querySelectorAll('[data-skip]');
  
  const navResults = {
    nextButton: {
      found: !!nextBtn,
      visible: nextBtn ? getComputedStyle(nextBtn).display !== 'none' : false,
      clickable: nextBtn ? !nextBtn.disabled : false
    },
    backButton: {
      found: !!backBtn,
      visible: backBtn ? getComputedStyle(backBtn).display !== 'none' : false,
      clickable: backBtn ? !backBtn.disabled : false
    },
    skipButtons: {
      count: skipBtns.length,
      targets: Array.from(skipBtns).map(btn => btn.getAttribute('data-skip'))
    }
  };
  
  console.log('🎮 Navigation Button Analysis:', navResults);
  auditResults.compatibility.navigation = navResults;
}

/**
 * SECTION 6: Data Attribute Compliance
 */
function auditDataAttributes() {
  console.log('\n🏷️ === DATA ATTRIBUTE COMPLIANCE AUDIT ===');
  
  const requiredSelectors = [
    '[data-form="multistep"]',
    '[data-form="step"]',
    '[data-answer]',
    '[data-form="next-btn"]',
    '[data-form="back-btn"]',
    '[data-skip]'
  ];
  
  const attributeCompliance = {};
  
  requiredSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    attributeCompliance[selector] = {
      count: elements.length,
      found: elements.length > 0
    };
    
    if (elements.length > 0 && elements.length <= 5) {
      attributeCompliance[selector].examples = Array.from(elements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        value: el.getAttribute(selector.match(/data-[^="]*/)?.[0] || 'data-form')
      }));
    }
  });
  
  console.log('🏷️ Data Attribute Compliance:', attributeCompliance);
  auditResults.compatibility.dataAttributes = attributeCompliance;
}

/**
 * SECTION 7: Generate Recommendations
 */
function generateRecommendations() {
  console.log('\n💡 === RECOMMENDATIONS ===');
  
  const recommendations = [];
  
  // Library recommendations
  if (!auditResults.libraryStatus.exists) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Library',
      issue: 'FormLib not loaded',
      solution: 'Add script tag: <script src="https://unpkg.com/form-functionality-library@latest/dist/index.min.js"></script>'
    });
  } else if (!auditResults.libraryStatus.isInitialized) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Library',
      issue: 'FormLib not initialized',
      solution: 'Check console for initialization errors, ensure DOM is ready'
    });
  }
  
  // Progressive disclosure recommendations
  if (!auditResults.compatibility.progressiveDisclosure?.isProperlyConfigured) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Progressive Disclosure',
      issue: 'Step-0 not properly visible or multiple steps visible',
      solution: 'Ensure step-0 has proper CSS visibility and only one step is visible at a time'
    });
  }
  
  // CSS recommendations
  if (auditResults.cssAnalysis.stepVisibility?.hiddenSteps === auditResults.cssAnalysis.stepVisibility?.totalSteps) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'CSS',
      issue: 'All steps are hidden',
      solution: 'Check for conflicting CSS rules hiding step elements'
    });
  }
  
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
    console.log(`   Solution: ${rec.solution}`);
  });
  
  auditResults.recommendations = recommendations;
}

/**
 * MAIN AUDIT RUNNER
 */
function runCompleteAudit() {
  console.log('🚀 Starting Complete Form Audit...\n');
  
  try {
    auditLibraryIntegration();
    auditHTMLStructure();
    auditCSSCompatibility();
    testProgressiveDisclosure();
    testNavigationButtons();
    auditDataAttributes();
    generateRecommendations();
    
    console.log('\n📋 === AUDIT SUMMARY ===');
    console.log('Library Status:', auditResults.libraryStatus.exists ? '✅ Loaded' : '❌ Not Found');
    console.log('HTML Structure:', auditResults.htmlStructure.totalStepWrappers > 0 ? '✅ Valid' : '❌ Invalid');
    console.log('Progressive Disclosure:', auditResults.compatibility.progressiveDisclosure?.isProperlyConfigured ? '✅ Working' : '❌ Issues');
    console.log('Navigation:', auditResults.compatibility.navigation?.nextButton.found ? '✅ Found' : '❌ Missing');
    
    console.log('\n📊 Complete Results Available in: window.auditResults');
    window.auditResults = auditResults;
    
    return auditResults;
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    return { error: error.message };
  }
}

// Auto-run the audit
console.log('🧪 Form Audit Script Loaded');
console.log('📋 Run runCompleteAudit() to start comprehensive analysis');

// Export functions for manual use
window.formAudit = {
  runCompleteAudit,
  auditLibraryIntegration,
  auditHTMLStructure,
  auditCSSCompatibility,
  testProgressiveDisclosure,
  testNavigationButtons,
  auditDataAttributes,
  generateRecommendations
};

// Auto-run the audit
runCompleteAudit(); 