// Navigation Debug Script
// This script provides detailed debugging for the step navigation flow

(function() {
    console.log('[NavigationDebug] Initializing navigation debugging...');
    
    // Function to get comprehensive step information
    function getStepInfo() {
        const allSteps = document.querySelectorAll('[data-form="step"]');
        const stepInfo = Array.from(allSteps).map((step, index) => {
            const dataAnswer = step.getAttribute('data-answer');
            const stepId = dataAnswer || `step-${index}`;
            return {
                index,
                stepId,
                dataAnswer,
                element: step,
                visible: step.style.display !== 'none',
                classes: step.className,
                stepItems: Array.from(step.querySelectorAll('.step_item')).map(item => ({
                    dataAnswer: item.getAttribute('data-answer'),
                    dataGoTo: item.getAttribute('data-go-to'),
                    visible: item.style.display !== 'none',
                    classes: item.className
                }))
            };
        });
        
        return stepInfo;
    }
    
    // Function to debug the current state
    function debugCurrentState() {
        console.log('[NavigationDebug] === CURRENT STATE ANALYSIS ===');
        
        const stepInfo = getStepInfo();
        console.log('[NavigationDebug] All Steps:', stepInfo);
        
        const visibleSteps = stepInfo.filter(s => s.visible);
        console.log('[NavigationDebug] Visible Steps:', visibleSteps.map(s => s.stepId));
        
        const currentStep = stepInfo.find(s => s.visible && s.stepItems.some(item => item.visible));
        if (currentStep) {
            console.log('[NavigationDebug] Current Step with Visible Step Items:', {
                stepId: currentStep.stepId,
                visibleStepItems: currentStep.stepItems.filter(item => item.visible)
            });
        }
        
        // Check for individual-1 and step-7 specifically
        const individual1 = document.querySelector('[data-answer="individual-1"]');
        const step7 = document.querySelector('[data-answer="step-7"]');
        
        console.log('[NavigationDebug] Individual-1 Status:', {
            exists: !!individual1,
            visible: individual1 ? individual1.style.display !== 'none' : false,
            dataGoTo: individual1 ? individual1.getAttribute('data-go-to') : null,
            classes: individual1 ? individual1.className : null
        });
        
        console.log('[NavigationDebug] Step-7 Status:', {
            exists: !!step7,
            visible: step7 ? step7.style.display !== 'none' : false,
            classes: step7 ? step7.className : null,
            parentStep: step7 ? step7.closest('[data-form="step"]').getAttribute('data-answer') : null
        });
        
        // Check FormState if available
        if (window.FormState) {
            try {
                const branchPath = FormState.getBranchPath();
                console.log('[NavigationDebug] FormState Branch Path:', branchPath);
                
                const currentStepFromState = FormState.getCurrentStep();
                console.log('[NavigationDebug] FormState Current Step:', currentStepFromState);
            } catch (e) {
                console.log('[NavigationDebug] FormState access error:', e);
            }
        }
        
        console.log('[NavigationDebug] === END STATE ANALYSIS ===');
    }
    
    // Function to monitor navigation attempts
    function monitorNavigation() {
        // Override goToStepById if it exists
        if (window.goToStepById) {
            const originalGoToStepById = window.goToStepById;
            window.goToStepById = function(stepId) {
                console.log('[NavigationDebug] goToStepById called with:', stepId);
                debugCurrentState();
                const result = originalGoToStepById.call(this, stepId);
                setTimeout(() => {
                    console.log('[NavigationDebug] After goToStepById execution:');
                    debugCurrentState();
                }, 100);
                return result;
            };
        }
        
        // Monitor console logs for FormLib messages
        const originalLog = console.log;
        console.log = function(...args) {
            originalLog.apply(console, args);
            
            if (args[0] && typeof args[0] === 'string' && args[0].includes('[FormLib]')) {
                if (args[0].includes('Attempting to navigate to step') || 
                    args[0].includes('Step not found') ||
                    args[0].includes('Found parent step') ||
                    args[0].includes('Step item') && args[0].includes('has data-go-to')) {
                    console.log('[NavigationDebug] FormLib Navigation Event Detected');
                    setTimeout(debugCurrentState, 50);
                }
            }
        };
    }
    
    // Function to test specific navigation scenarios
    function testNavigation() {
        console.log('[NavigationDebug] === TESTING NAVIGATION SCENARIOS ===');
        
        // Test if individual-1 to step-7 navigation works
        const individual1 = document.querySelector('[data-answer="individual-1"]');
        if (individual1) {
            const goToValue = individual1.getAttribute('data-go-to');
            console.log('[NavigationDebug] Testing individual-1 navigation:', {
                from: 'individual-1',
                to: goToValue
            });
            
            if (goToValue) {
                const targetStep = document.querySelector(`[data-answer="${goToValue}"]`);
                console.log('[NavigationDebug] Target step exists:', {
                    targetId: goToValue,
                    exists: !!targetStep,
                    visible: targetStep ? targetStep.style.display !== 'none' : false,
                    element: targetStep
                });
            }
        }
        
        // List all steps and their intended navigation paths
        const allStepItems = document.querySelectorAll('[data-go-to]');
        console.log('[NavigationDebug] All Navigation Paths:');
        allStepItems.forEach(item => {
            const from = item.getAttribute('data-answer');
            const to = item.getAttribute('data-go-to');
            const targetExists = !!document.querySelector(`[data-answer="${to}"]`);
            console.log(`  ${from} → ${to} (target exists: ${targetExists})`);
        });
        
        console.log('[NavigationDebug] === END TESTING ===');
    }
    
    // Function to simulate next button click on individual-1
    function simulateNextFromIndividual1() {
        console.log('[NavigationDebug] === SIMULATING NEXT BUTTON CLICK ===');
        
        const individual1 = document.querySelector('[data-answer="individual-1"]');
        if (individual1) {
            // Make individual-1 visible first
            individual1.style.display = 'block';
            individual1.style.visibility = 'visible';
            
            // Find the next button within individual-1
            const nextButton = individual1.querySelector('[data-form="next-btn"]');
            if (nextButton) {
                console.log('[NavigationDebug] Found next button, simulating click...');
                
                // Create a synthetic click event
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                setTimeout(() => {
                    console.log('[NavigationDebug] Before click:');
                    debugCurrentState();
                    
                    nextButton.click();
                    
                    setTimeout(() => {
                        console.log('[NavigationDebug] After click:');
                        debugCurrentState();
                    }, 200);
                }, 100);
            } else {
                console.log('[NavigationDebug] Next button not found in individual-1');
            }
        } else {
            console.log('[NavigationDebug] individual-1 step not found');
        }
        
        console.log('[NavigationDebug] === END SIMULATION ===');
    }
    
    // Initialize debugging
    debugCurrentState();
    monitorNavigation();
    testNavigation();
    
    // Make functions available globally for manual testing
    window.debugNavigationState = debugCurrentState;
    window.testNavigation = testNavigation;
    window.simulateNextFromIndividual1 = simulateNextFromIndividual1;
    
    // Auto-run simulation after a delay to let the page load
    setTimeout(() => {
        console.log('[NavigationDebug] Running automatic simulation...');
        simulateNextFromIndividual1();
    }, 3000);
    
    console.log('[NavigationDebug] Navigation debugging initialized. Available functions:');
    console.log('  - debugNavigationState(): Check current state');
    console.log('  - testNavigation(): Test navigation paths');
    console.log('  - simulateNextFromIndividual1(): Simulate clicking next on individual-1');
    
})(); 