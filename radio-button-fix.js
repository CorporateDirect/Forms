// Universal Form Navigation & Radio Button Library
// Ensures data-go-to ↔ data-answer navigation pattern works across any form

(function() {
    console.log('[FormNavigationLib] Initializing universal form navigation library...');
    
    // ==========================================
    // VALIDATION SYSTEM
    // ==========================================
    
    function validateNavigationPattern() {
        console.log('[FormNavigationLib] === NAVIGATION PATTERN VALIDATION ===');
        
        const issues = [];
        const navigationMap = {};
        
        // Find all elements with data-go-to attributes
        const elementsWithGoTo = document.querySelectorAll('[data-go-to]');
        const elementsWithAnswer = document.querySelectorAll('[data-answer]');
        
        console.log(`[FormNavigationLib] Found ${elementsWithGoTo.length} elements with data-go-to`);
        console.log(`[FormNavigationLib] Found ${elementsWithAnswer.length} elements with data-answer`);
        
        // Build maps for validation
        const goToTargets = new Set();
        const answerTargets = new Set();
        
        elementsWithGoTo.forEach(element => {
            const goToValue = element.getAttribute('data-go-to');
            if (goToValue) {
                goToTargets.add(goToValue);
                navigationMap[goToValue] = navigationMap[goToValue] || [];
                navigationMap[goToValue].push({
                    type: 'source',
                    element: element,
                    elementType: element.tagName.toLowerCase(),
                    classes: element.className,
                    radioInfo: element.type === 'radio' ? {
                        name: element.name,
                        value: element.value
                    } : null
                });
            }
        });
        
        elementsWithAnswer.forEach(element => {
            const answerValue = element.getAttribute('data-answer');
            if (answerValue) {
                answerTargets.add(answerValue);
                navigationMap[answerValue] = navigationMap[answerValue] || [];
                navigationMap[answerValue].push({
                    type: 'target',
                    element: element,
                    elementType: element.tagName.toLowerCase(),
                    classes: element.className
                });
            }
        });
        
        // Check for missing targets
        goToTargets.forEach(target => {
            if (!answerTargets.has(target)) {
                issues.push({
                    type: 'MISSING_TARGET',
                    target: target,
                    message: `data-go-to="${target}" has no corresponding data-answer="${target}"`
                });
            }
        });
        
        // Check for orphaned answers
        answerTargets.forEach(answer => {
            if (!goToTargets.has(answer)) {
                issues.push({
                    type: 'ORPHANED_ANSWER',
                    target: answer,
                    message: `data-answer="${answer}" has no corresponding data-go-to="${answer}"`
                });
            }
        });
        
        // Report results
        if (issues.length === 0) {
            console.log('[FormNavigationLib] ✅ Navigation pattern validation PASSED - all data-go-to have corresponding data-answer');
        } else {
            console.error('[FormNavigationLib] ❌ Navigation pattern validation FAILED:');
            issues.forEach(issue => {
                console.error(`[FormNavigationLib] ${issue.type}: ${issue.message}`);
            });
        }
        
        // Log navigation map for debugging
        console.log('[FormNavigationLib] Complete Navigation Map:', navigationMap);
        
        return {
            valid: issues.length === 0,
            issues: issues,
            navigationMap: navigationMap,
            stats: {
                totalGoToElements: elementsWithGoTo.length,
                totalAnswerElements: elementsWithAnswer.length,
                uniqueGoToTargets: goToTargets.size,
                uniqueAnswerTargets: answerTargets.size
            }
        };
    }
    
    // ==========================================
    // RADIO BUTTON SYSTEM
    // ==========================================
    
    function handleRadioClick(event) {
        const target = event.target;
        let radioInput = null;
        let clickContext = null;
        
        // Identify what was clicked and find the associated radio input
        if (target.type === 'radio') {
            radioInput = target;
            clickContext = 'direct-radio';
        } else if (target.classList.contains('w-radio-input') || 
                   target.classList.contains('radio_button-skip-step') || 
                   target.classList.contains('w-form-formradioinput') ||
                   target.classList.contains('form_radio-icon')) {
            const parentLabel = target.closest('label');
            if (parentLabel) {
                radioInput = parentLabel.querySelector('input[type="radio"]');
                clickContext = 'visual-element';
            }
        } else if (target.tagName === 'LABEL' || target.classList.contains('radio_field') || target.classList.contains('form_radio')) {
            radioInput = target.querySelector('input[type="radio"]');
            clickContext = 'label-container';
        } else {
            const parentRadioContainer = target.closest('label, .radio_field, .form_radio');
            if (parentRadioContainer) {
                radioInput = parentRadioContainer.querySelector('input[type="radio"]');
                clickContext = 'child-element';
            }
        }
        
        if (radioInput) {
            const dataGoTo = radioInput.getAttribute('data-go-to');
            
            console.log('[FormNavigationLib] Radio interaction detected:', {
                clickContext: clickContext,
                radioName: radioInput.name,
                radioValue: radioInput.value,
                dataGoTo: dataGoTo,
                currentlyChecked: radioInput.checked
            });
            
            // Prevent default behavior and event bubbling
            event.preventDefault();
            event.stopImmediatePropagation();
            
            // Skip if already selected
            if (radioInput.checked) {
                console.log('[FormNavigationLib] Radio already selected, no action needed');
                return true;
            }
            
            // Validate navigation target exists
            if (dataGoTo) {
                const targetElement = document.querySelector(`[data-answer="${dataGoTo}"]`);
                if (!targetElement) {
                    console.error(`[FormNavigationLib] ❌ NAVIGATION ERROR: No element found with data-answer="${dataGoTo}"`);
                    return false;
                }
                console.log(`[FormNavigationLib] ✅ Navigation target validated: data-answer="${dataGoTo}"`);
            }
            
            // Handle radio group selection
            if (radioInput.name) {
                const groupRadios = document.querySelectorAll(`input[type="radio"][name="${radioInput.name}"]`);
                groupRadios.forEach(radio => {
                    if (radio !== radioInput) {
                        radio.checked = false;
                        updateRadioVisualState(radio, false);
                    }
                });
            }
            
            // Select the clicked radio
            radioInput.checked = true;
            updateRadioVisualState(radioInput, true);
            
            // Trigger events for form navigation system
            triggerNavigationEvents(radioInput);
            
            console.log(`[FormNavigationLib] ✅ Radio selection completed - should navigate to data-answer="${dataGoTo}"`);
            return true;
        }
        
        return false;
    }
    
    function updateRadioVisualState(radioInput, isChecked) {
        const label = radioInput.closest('label');
        const visualElements = label?.querySelectorAll('.w-radio-input, .radio_button-skip-step, .w-form-formradioinput, .form_radio-icon');
        
        if (!label || !visualElements?.length) return;
        
        if (isChecked) {
            // Apply checked state
            label.classList.add('is-active-inputactive', 'w--redirected-checked');
            visualElements.forEach(element => {
                element.classList.add('w--redirected-checked');
                
                // Apply visual styling
                element.style.backgroundColor = '#3898EC';
                element.style.borderColor = '#3898EC';
                
                // Add indicator dot
                if (!element.querySelector('.nav-radio-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'nav-radio-indicator';
                    indicator.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 6px;
                        height: 6px;
                        background-color: white;
                        border-radius: 50%;
                        pointer-events: none;
                        z-index: 1;
                    `;
                    element.style.position = 'relative';
                    element.appendChild(indicator);
                }
            });
        } else {
            // Remove checked state
            label.classList.remove('is-active-inputactive', 'w--redirected-checked');
            visualElements.forEach(element => {
                element.classList.remove('w--redirected-checked');
                element.style.backgroundColor = '';
                element.style.borderColor = '';
                
                // Remove indicator
                const indicator = element.querySelector('.nav-radio-indicator');
                if (indicator) indicator.remove();
            });
        }
    }
    
    function triggerNavigationEvents(radioInput) {
        // Dispatch multiple event types to ensure compatibility
        const eventTypes = ['change', 'input', 'click'];
        
        eventTypes.forEach(eventType => {
            const event = new Event(eventType, {
                bubbles: true,
                cancelable: true
            });
            
            // Ensure the event target is properly set
            Object.defineProperty(event, 'target', {
                value: radioInput,
                enumerable: true
            });
            
            radioInput.dispatchEvent(event);
        });
        
        console.log('[FormNavigationLib] Triggered navigation events:', eventTypes);
    }
    
    // ==========================================
    // INITIALIZATION & MONITORING
    // ==========================================
    
    function initializeRadioStates() {
        const allRadios = document.querySelectorAll('input[type="radio"]');
        let initializedCount = 0;
        
        allRadios.forEach(radio => {
            updateRadioVisualState(radio, radio.checked);
            if (radio.checked) initializedCount++;
        });
        
        console.log(`[FormNavigationLib] Initialized visual states for ${allRadios.length} radio buttons (${initializedCount} pre-selected)`);
    }
    
    function setupEventListeners() {
        // Use capture phase to intercept all clicks before other handlers
        document.addEventListener('click', handleRadioClick, true);
        console.log('[FormNavigationLib] Event listeners configured');
    }
    
    function createDebugInterface() {
        // Make functions available globally for debugging
        window.FormNavigationLib = {
            validateNavigation: validateNavigationPattern,
            debugRadios: function() {
                const allRadios = document.querySelectorAll('input[type="radio"]');
                const radioGroups = {};
                
                allRadios.forEach(radio => {
                    const groupName = radio.name || 'unnamed';
                    if (!radioGroups[groupName]) radioGroups[groupName] = [];
                    
                    radioGroups[groupName].push({
                        value: radio.value,
                        dataGoTo: radio.getAttribute('data-go-to'),
                        checked: radio.checked,
                        hasTarget: radio.getAttribute('data-go-to') ? 
                            !!document.querySelector(`[data-answer="${radio.getAttribute('data-go-to')}"]`) : null
                    });
                });
                
                console.log('[FormNavigationLib] Radio Button Debug:', radioGroups);
                return radioGroups;
            },
            reinitialize: function() {
                console.log('[FormNavigationLib] Reinitializing...');
                initializeRadioStates();
                return validateNavigationPattern();
            }
        };
        
        console.log('[FormNavigationLib] Debug interface available: window.FormNavigationLib');
        console.log('[FormNavigationLib] Available methods: validateNavigation(), debugRadios(), reinitialize()');
    }
    
    // ==========================================
    // MAIN INITIALIZATION
    // ==========================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        console.log('[FormNavigationLib] Starting initialization...');
        
        // 1. Validate navigation pattern
        const validationResult = validateNavigationPattern();
        
        // 2. Setup radio button handling
        setupEventListeners();
        
        // 3. Initialize visual states
        initializeRadioStates();
        
        // 4. Create debug interface
        createDebugInterface();
        
        // 5. Report initialization status
        if (validationResult.valid) {
            console.log('[FormNavigationLib] ✅ Initialization completed successfully');
            console.log('[FormNavigationLib] Navigation pattern validated and radio button system active');
        } else {
            console.error('[FormNavigationLib] ⚠️ Initialization completed with navigation issues');
            console.error('[FormNavigationLib] Please fix data-go-to ↔ data-answer mismatches');
        }
        
        return validationResult;
    }
    
    // Start the library
    init();
    
})(); 