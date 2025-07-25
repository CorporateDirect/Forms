/**
 * Step Progression Testing Script for RealShield Form
 * Run this in browser console to test step visibility and navigation
 */

// Enhanced logging function
function logStepProgression(action, details = {}) {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [${timestamp}] STEP PROGRESSION TEST: ${action}`, details);
}

// NEW: Enhanced library testing
function testLibraryStatus() {
    logStepProgression('ENHANCED LIBRARY TESTING');
    
    // Check if FormLib exists
    const formLibExists = typeof window.FormLib !== 'undefined';
    logStepProgression('LIBRARY EXISTENCE', { formLibExists });
    
    if (!formLibExists) {
        logStepProgression('LIBRARY MISSING', {
            message: 'FormLib not found in window object',
            windowKeys: Object.keys(window).filter(key => key.includes('Form') || key.includes('form'))
        });
        return { formLibExists: false };
    }
    
    // Test initialization
    let isInitialized = false;
    try {
        isInitialized = window.FormLib.isInitialized();
        logStepProgression('INITIALIZATION STATUS', { isInitialized });
    } catch (error) {
        logStepProgression('INITIALIZATION CHECK ERROR', { error: error.message });
    }
    
    // If not initialized, try to initialize
    if (!isInitialized) {
        try {
            logStepProgression('ATTEMPTING INITIALIZATION');
            window.FormLib.init();
            isInitialized = window.FormLib.isInitialized();
            logStepProgression('POST-INIT STATUS', { isInitialized });
        } catch (error) {
            logStepProgression('INITIALIZATION ERROR', { error: error.message });
        }
    }
    
    // Test available methods
    const availableMethods = [];
    if (window.FormLib) {
        Object.getOwnPropertyNames(Object.getPrototypeOf(window.FormLib)).forEach(method => {
            if (typeof window.FormLib[method] === 'function') {
                availableMethods.push(method);
            }
        });
    }
    
    logStepProgression('AVAILABLE METHODS', { availableMethods });
    
    return { formLibExists, isInitialized, availableMethods };
}

// NEW: Enhanced CSS diagnostics
function diagnoseCSSIssues() {
    logStepProgression('CSS DIAGNOSTICS');
    
    const step0 = document.querySelector('[data-answer="step-0"]');
    if (!step0) {
        logStepProgression('STEP-0 NOT FOUND');
        return;
    }
    
    const computedStyle = getComputedStyle(step0);
    const inlineStyle = step0.style;
    
    logStepProgression('STEP-0 CSS ANALYSIS', {
        elementInfo: {
            tagName: step0.tagName,
            className: step0.className,
            id: step0.id,
            classList: Array.from(step0.classList)
        },
        computedStyle: {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            position: computedStyle.position,
            zIndex: computedStyle.zIndex,
            transform: computedStyle.transform
        },
        inlineStyle: {
            display: inlineStyle.display,
            visibility: inlineStyle.visibility,
            opacity: inlineStyle.opacity,
            cssText: inlineStyle.cssText
        },
        dataAttributes: {
            'data-answer': step0.getAttribute('data-answer'),
            'data-original-display': step0.getAttribute('data-original-display'),
            'data-form': step0.getAttribute('data-form'),
            'data-branch': step0.getAttribute('data-branch')
        },
        parentInfo: {
            tagName: step0.parentElement?.tagName,
            className: step0.parentElement?.className,
            computedDisplay: step0.parentElement ? getComputedStyle(step0.parentElement).display : null
        }
    });
    
    // Check for CSS rules that might be hiding the element
    const hidingFactors = [];
    if (computedStyle.display === 'none') hidingFactors.push('display: none');
    if (computedStyle.visibility === 'hidden') hidingFactors.push('visibility: hidden');
    if (computedStyle.opacity === '0') hidingFactors.push('opacity: 0');
    if (step0.classList.contains('hidden-step')) hidingFactors.push('has hidden-step class');
    
    logStepProgression('HIDING FACTORS', { hidingFactors });
    
    return { step0, computedStyle, inlineStyle, hidingFactors };
}

// NEW: Force show step-0 for testing
function forceShowStep0() {
    logStepProgression('FORCE SHOWING STEP-0');
    
    const step0 = document.querySelector('[data-answer="step-0"]');
    if (!step0) {
        logStepProgression('STEP-0 NOT FOUND FOR FORCE SHOW');
        return;
    }
    
    // Remove hiding classes
    step0.classList.remove('hidden-step');
    
    // Force visibility with !important
    step0.style.setProperty('display', 'flex', 'important');
    step0.style.setProperty('visibility', 'visible', 'important');
    step0.style.setProperty('opacity', '1', 'important');
    
    logStepProgression('STEP-0 FORCE SHOW APPLIED', {
        newDisplay: getComputedStyle(step0).display,
        newVisibility: getComputedStyle(step0).visibility,
        newOpacity: getComputedStyle(step0).opacity,
        isNowVisible: getComputedStyle(step0).display !== 'none' && 
                     getComputedStyle(step0).visibility !== 'hidden' && 
                     getComputedStyle(step0).opacity !== '0'
    });
    
    return step0;
}

// Test step visibility and progression
function testStepProgression() {
    logStepProgression('STARTING COMPREHENSIVE STEP TEST');
    
    // 1. Enhanced library testing
    const libraryStatus = testLibraryStatus();
    
    // 2. Check initial form state
    logStepProgression('INITIAL STATE CHECK', {
        action: 'Checking form detection and initial step visibility'
    });
    
    const multistepForm = document.querySelector('[data-form="multistep"]');
    const allSteps = document.querySelectorAll('[data-form="step"]');
    const allStepWrappers = document.querySelectorAll('.step_wrapper[data-answer]');
    const step0 = document.querySelector('[data-answer="step-0"]');
    
    logStepProgression('FORM DETECTION RESULTS', {
        multistepForm: !!multistepForm,
        totalSteps: allSteps.length,
        totalStepWrappers: allStepWrappers.length,
        step0Found: !!step0,
        step0Visible: step0 ? getComputedStyle(step0).display !== 'none' : false
    });
    
    // 3. CSS Diagnostics
    const cssAnalysis = diagnoseCSSIssues();
    
    // 4. Log all step wrappers and their visibility
    logStepProgression('ALL STEP WRAPPERS ANALYSIS');
    allStepWrappers.forEach((wrapper, index) => {
        const stepId = wrapper.getAttribute('data-answer');
        const isVisible = getComputedStyle(wrapper).display !== 'none' && 
                         getComputedStyle(wrapper).visibility !== 'hidden';
        const hasActiveClass = wrapper.classList.contains('active-step');
        const hasHiddenClass = wrapper.classList.contains('hidden-step');
        
        logStepProgression(`STEP ${index} (${stepId})`, {
            stepId,
            isVisible,
            hasActiveClass,
            hasHiddenClass,
            display: getComputedStyle(wrapper).display,
            visibility: getComputedStyle(wrapper).visibility,
            classList: wrapper.className
        });
    });
    
    // 5. Check for navigation buttons
    const nextBtn = document.querySelector('[data-form="next-btn"]');
    const backBtn = document.querySelector('[data-form="back-btn"]');
    const skipBtns = document.querySelectorAll('[data-skip]');
    
    logStepProgression('NAVIGATION BUTTONS DETECTION', {
        nextButton: !!nextBtn,
        backButton: !!backBtn,
        skipButtons: skipBtns.length,
        skipTargets: Array.from(skipBtns).map(btn => btn.getAttribute('data-skip'))
    });
    
    // 6. Test library integration if available
    if (libraryStatus.formLibExists && libraryStatus.isInitialized) {
        testLibraryIntegration();
    }
    
    return {
        multistepForm,
        allSteps,
        allStepWrappers,
        step0,
        nextBtn,
        backBtn,
        skipBtns,
        libraryStatus,
        cssAnalysis
    };
}

// Test library integration if available
function testLibraryIntegration() {
    logStepProgression('TESTING LIBRARY INTEGRATION');
    
    try {
        // Test state retrieval
        const currentState = window.FormLib.getState();
        logStepProgression('CURRENT LIBRARY STATE', currentState);
        
        // Test debug system
        logStepProgression('RUNNING DEBUG SYSTEM');
        window.FormLib.debugStepSystem();
        
        // Test navigation history
        const navigatedSteps = window.FormLib.getNavigatedSteps();
        logStepProgression('NAVIGATED STEPS', { navigatedSteps });
        
    } catch (error) {
        logStepProgression('LIBRARY INTEGRATION ERROR', { error: error.message });
    }
}

// Test next button functionality
function testNextButton() {
    logStepProgression('TESTING NEXT BUTTON');
    
    const nextBtn = document.querySelector('[data-form="next-btn"]');
    if (!nextBtn) {
        logStepProgression('NEXT BUTTON NOT FOUND');
        return;
    }
    
    logStepProgression('NEXT BUTTON FOUND', {
        element: nextBtn.tagName,
        className: nextBtn.className,
        visible: getComputedStyle(nextBtn).display !== 'none'
    });
    
    // Simulate click
    logStepProgression('SIMULATING NEXT BUTTON CLICK');
    nextBtn.click();
    
    // Check state after click
    setTimeout(() => {
        logStepProgression('POST-NEXT-CLICK STATE');
        if (window.FormLib && window.FormLib.isInitialized()) {
            window.FormLib.debugStepSystem();
        }
        checkAllStepVisibility();
    }, 500);
}

// Test back button functionality
function testBackButton() {
    logStepProgression('TESTING BACK BUTTON');
    
    const backBtn = document.querySelector('[data-form="back-btn"]');
    if (!backBtn) {
        logStepProgression('BACK BUTTON NOT FOUND');
        return;
    }
    
    logStepProgression('BACK BUTTON FOUND', {
        element: backBtn.tagName,
        className: backBtn.className,
        visible: getComputedStyle(backBtn).display !== 'none'
    });
    
    // Simulate click
    logStepProgression('SIMULATING BACK BUTTON CLICK');
    backBtn.click();
    
    // Check state after click
    setTimeout(() => {
        logStepProgression('POST-BACK-CLICK STATE');
        if (window.FormLib && window.FormLib.isInitialized()) {
            window.FormLib.debugStepSystem();
        }
        checkAllStepVisibility();
    }, 500);
}

// Test skip functionality
function testSkipFunctionality() {
    logStepProgression('TESTING SKIP FUNCTIONALITY');
    
    const skipBtns = document.querySelectorAll('[data-skip]');
    if (skipBtns.length === 0) {
        logStepProgression('NO SKIP BUTTONS FOUND');
        return;
    }
    
    skipBtns.forEach((skipBtn, index) => {
        const skipTarget = skipBtn.getAttribute('data-skip');
        logStepProgression(`SKIP BUTTON ${index}`, {
            element: skipBtn.tagName,
            className: skipBtn.className,
            skipTarget,
            visible: getComputedStyle(skipBtn).display !== 'none'
        });
    });
    
    // Test first skip button
    const firstSkip = skipBtns[0];
    if (firstSkip) {
        logStepProgression('SIMULATING FIRST SKIP BUTTON CLICK');
        firstSkip.click();
        
        setTimeout(() => {
            logStepProgression('POST-SKIP-CLICK STATE');
            if (window.FormLib && window.FormLib.isInitialized()) {
                window.FormLib.debugStepSystem();
            }
            checkAllStepVisibility();
        }, 500);
    }
}

// Check visibility of all steps
function checkAllStepVisibility() {
    logStepProgression('CHECKING ALL STEP VISIBILITY');
    
    const allStepWrappers = document.querySelectorAll('.step_wrapper[data-answer]');
    const visibilityReport = {};
    
    allStepWrappers.forEach(wrapper => {
        const stepId = wrapper.getAttribute('data-answer');
        const isVisible = getComputedStyle(wrapper).display !== 'none' && 
                         getComputedStyle(wrapper).visibility !== 'hidden';
        
        visibilityReport[stepId] = {
            isVisible,
            display: getComputedStyle(wrapper).display,
            visibility: getComputedStyle(wrapper).visibility,
            hasActiveClass: wrapper.classList.contains('active-step'),
            hasHiddenClass: wrapper.classList.contains('hidden-step')
        };
    });
    
    logStepProgression('COMPLETE VISIBILITY REPORT', visibilityReport);
    return visibilityReport;
}

// Main test runner
function runCompleteTest() {
    logStepProgression('🚀 STARTING COMPLETE STEP PROGRESSION TEST');
    
    // Initial state
    const initialResults = testStepProgression();
    
    // Test navigation buttons if they exist
    setTimeout(() => {
        if (initialResults.nextBtn) testNextButton();
    }, 1000);
    
    setTimeout(() => {
        if (initialResults.backBtn) testBackButton();
    }, 2000);
    
    setTimeout(() => {
        if (initialResults.skipBtns.length > 0) testSkipFunctionality();
    }, 3000);
    
    logStepProgression('✅ COMPLETE TEST SEQUENCE INITIATED');
    return initialResults;
}

// Export functions for manual testing
window.stepProgressionTest = {
    runCompleteTest,
    testStepProgression,
    testNextButton,
    testBackButton,
    testSkipFunctionality,
    checkAllStepVisibility,
    logStepProgression,
    // NEW enhanced functions
    testLibraryStatus,
    diagnoseCSSIssues,
    forceShowStep0
};

// Auto-run basic test
console.log('🧪 Enhanced Step Progression Test Script Loaded');
console.log('📋 Run stepProgressionTest.runCompleteTest() to start full test');
console.log('🔍 Or use individual functions like stepProgressionTest.testStepProgression()');
console.log('🚨 NEW: stepProgressionTest.forceShowStep0() to force show first step');
console.log('🚨 NEW: stepProgressionTest.diagnoseCSSIssues() for CSS analysis');

// Run initial test
testStepProgression(); 