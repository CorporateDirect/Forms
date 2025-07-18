// Emergency Diagnostic Script - Embed directly in Webflow
console.log('🚀 EMERGENCY DIAGNOSTIC STARTING...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DOM READY - Starting emergency diagnostics');
    
    // Check what we have on the page
    const steps = document.querySelectorAll('[data-form="step"]');
    const stepWrappers = document.querySelectorAll('.step_wrapper[data-answer]');
    const allDataAnswer = document.querySelectorAll('[data-answer]');
    
    console.log('📊 EMERGENCY DIAGNOSTIC RESULTS:', {
        stepsFound: steps.length,
        stepWrappers: stepWrappers.length,
        allDataAnswer: allDataAnswer.length,
        stepIds: Array.from(allDataAnswer).map(el => el.getAttribute('data-answer'))
    });
    
    // Show first step if any exist
    if (steps.length > 0) {
        console.log('👀 SHOWING FIRST STEP');
        steps.forEach((step, index) => {
            if (index === 0) {
                step.style.display = 'block';
                step.style.visibility = 'visible';
                console.log('✅ SHOWED:', step.getAttribute('data-answer') || `step-${index}`);
            } else {
                step.style.display = 'none';
                console.log('❌ HID:', step.getAttribute('data-answer') || `step-${index}`);
            }
        });
    } else {
        console.log('❌ NO STEPS FOUND - CHECKING ALL ELEMENTS WITH data-answer');
        allDataAnswer.forEach((el, index) => {
            console.log(`Element ${index}:`, {
                tag: el.tagName,
                dataAnswer: el.getAttribute('data-answer'),
                classes: el.className,
                display: getComputedStyle(el).display,
                visibility: getComputedStyle(el).visibility
            });
        });
    }
    
    // Add radio button listeners
    const radioButtons = document.querySelectorAll('input[type="radio"][data-go-to]');
    console.log('🎯 RADIO BUTTONS FOUND:', radioButtons.length);
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const goTo = this.getAttribute('data-go-to');
                console.log('🔥 RADIO CLICKED - EMERGENCY NAVIGATION:', {
                    radioName: this.name,
                    radioValue: this.value,
                    goTo: goTo
                });
                
                // Emergency navigation - just show/hide by data-answer
                const targetStep = document.querySelector(`[data-answer="${goTo}"]`);
                if (targetStep) {
                    // Hide all steps
                    allDataAnswer.forEach(el => {
                        el.style.display = 'none';
                        console.log('❌ EMERGENCY HID:', el.getAttribute('data-answer'));
                    });
                    
                    // Show target
                    targetStep.style.display = 'block';
                    targetStep.style.visibility = 'visible';
                    console.log('✅ EMERGENCY SHOWED:', goTo);
                } else {
                    console.log('❌ TARGET NOT FOUND:', goTo);
                }
            }
        });
    });
    
    console.log('🎉 EMERGENCY DIAGNOSTIC COMPLETE');
});

console.log('📝 EMERGENCY SCRIPT LOADED'); 