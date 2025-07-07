/**
 * Universal Form Navigation & Radio Button Module
 * Ensures data-go-to ↔ data-answer navigation pattern works across any form
 */
import { SELECTORS } from '../config.js';
import { logVerbose, queryAllByAttr, queryByAttr, getAttrValue, delegateEvent, addClass, removeClass } from './utils.js';
// ==========================================
// MODULE STATE
// ==========================================
let initialized = false;
let cleanupFunctions = [];
let navigationValidationResult = null;
// ==========================================
// VALIDATION SYSTEM
// ==========================================
/**
 * Validate the navigation pattern across the entire form
 */
export function validateNavigationPattern(root = document) {
    logVerbose('=== NAVIGATION PATTERN VALIDATION ===');
    const issues = [];
    const navigationMap = {};
    // Find all elements with data-go-to and data-answer attributes
    const elementsWithGoTo = queryAllByAttr(SELECTORS.GO_TO, root);
    const elementsWithAnswer = queryAllByAttr(SELECTORS.ANSWER, root);
    logVerbose(`Found ${elementsWithGoTo.length} elements with data-go-to`);
    logVerbose(`Found ${elementsWithAnswer.length} elements with data-answer`);
    // Build maps for validation
    const goToTargets = new Set();
    const answerTargets = new Set();
    // Process elements with data-go-to
    elementsWithGoTo.forEach(element => {
        const goToValue = getAttrValue(element, 'data-go-to');
        if (goToValue) {
            goToTargets.add(goToValue);
            navigationMap[goToValue] = navigationMap[goToValue] || [];
            const radioInfo = element instanceof HTMLInputElement && element.type === 'radio' ? {
                name: element.name,
                value: element.value
            } : undefined;
            navigationMap[goToValue].push({
                type: 'source',
                element: element,
                elementType: element.tagName.toLowerCase(),
                classes: element.className,
                radioInfo
            });
        }
    });
    // Process elements with data-answer
    elementsWithAnswer.forEach(element => {
        const answerValue = getAttrValue(element, 'data-answer');
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
        logVerbose('✅ Navigation pattern validation PASSED - all data-go-to have corresponding data-answer');
    }
    else {
        console.error('❌ Navigation pattern validation FAILED:');
        issues.forEach(issue => {
            console.error(`${issue.type}: ${issue.message}`);
        });
    }
    // Log navigation map for debugging
    logVerbose('Complete Navigation Map:', navigationMap);
    const result = {
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
    navigationValidationResult = result;
    return result;
}
// ==========================================
// RADIO BUTTON SYSTEM
// ==========================================
/**
 * Handle radio button clicks and ensure proper selection
 */
function handleRadioClick(event, target) {
    const htmlTarget = target;
    let radioInput = null;
    let clickContext = null;
    // Identify what was clicked and find the associated radio input
    if (htmlTarget instanceof HTMLInputElement && htmlTarget.type === 'radio') {
        radioInput = htmlTarget;
        clickContext = 'direct-radio';
    }
    else if (htmlTarget.classList.contains('w-radio-input') ||
        htmlTarget.classList.contains('radio_button-skip-step') ||
        htmlTarget.classList.contains('w-form-formradioinput') ||
        htmlTarget.classList.contains('form_radio-icon')) {
        const parentLabel = htmlTarget.closest('label');
        if (parentLabel) {
            radioInput = parentLabel.querySelector('input[type="radio"]');
            clickContext = 'visual-element';
        }
    }
    else if (htmlTarget.tagName === 'LABEL' ||
        htmlTarget.classList.contains('radio_field') ||
        htmlTarget.classList.contains('form_radio')) {
        radioInput = htmlTarget.querySelector('input[type="radio"]');
        clickContext = 'label-container';
    }
    else {
        const parentRadioContainer = htmlTarget.closest('label, .radio_field, .form_radio');
        if (parentRadioContainer) {
            radioInput = parentRadioContainer.querySelector('input[type="radio"]');
            clickContext = 'child-element';
        }
    }
    if (radioInput) {
        const dataGoTo = getAttrValue(radioInput, 'data-go-to');
        logVerbose('Radio interaction detected:', {
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
            logVerbose('Radio already selected, no action needed');
            return true;
        }
        // Validate navigation target exists
        if (dataGoTo) {
            const targetElement = queryByAttr(`[${SELECTORS.ANSWER}="${dataGoTo}"]`, document);
            if (!targetElement) {
                console.error(`❌ NAVIGATION ERROR: No element found with data-answer="${dataGoTo}"`);
                return false;
            }
            logVerbose(`✅ Navigation target validated: data-answer="${dataGoTo}"`);
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
        logVerbose(`✅ Radio selection completed - should navigate to data-answer="${dataGoTo}"`);
        return true;
    }
    return false;
}
/**
 * Update visual styling of radio buttons
 */
function updateRadioVisualState(radioInput, isChecked) {
    const label = radioInput.closest('label');
    const visualElements = label?.querySelectorAll('.w-radio-input, .radio_button-skip-step, .w-form-formradioinput, .form_radio-icon');
    if (!label || !visualElements?.length)
        return;
    if (isChecked) {
        // Apply checked state
        addClass(label, 'is-active-inputactive');
        addClass(label, 'w--redirected-checked');
        visualElements.forEach(element => {
            addClass(element, 'w--redirected-checked');
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
    }
    else {
        // Remove checked state
        removeClass(label, 'is-active-inputactive');
        removeClass(label, 'w--redirected-checked');
        visualElements.forEach(element => {
            removeClass(element, 'w--redirected-checked');
            element.style.backgroundColor = '';
            element.style.borderColor = '';
            // Remove indicator
            const indicator = element.querySelector('.nav-radio-indicator');
            if (indicator)
                indicator.remove();
        });
    }
}
/**
 * Trigger navigation events for the form system
 */
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
    logVerbose('Triggered navigation events:', eventTypes);
}
// ==========================================
// INITIALIZATION & MONITORING
// ==========================================
/**
 * Initialize radio button visual states
 */
function initializeRadioStates(root = document) {
    const allRadios = root.querySelectorAll('input[type="radio"]');
    let initializedCount = 0;
    allRadios.forEach(radio => {
        updateRadioVisualState(radio, radio.checked);
        if (radio.checked)
            initializedCount++;
    });
    logVerbose(`Initialized visual states for ${allRadios.length} radio buttons (${initializedCount} pre-selected)`);
}
/**
 * Set up comprehensive event listeners
 */
function setupEventListeners(root = document) {
    // Comprehensive radio button selectors
    const radioSelectors = [
        'input[type="radio"]',
        '.radio_button-skip-step',
        '.w-form-formradioinput',
        '.w-radio-input',
        '.form_radio-icon',
        '.radio_field',
        'label.radio_field',
        '.w-radio',
        'label.w-radio',
        '[data-go-to]',
        '.radio_component',
        '.radio-component',
        '.form_radio',
        '.form-radio'
    ];
    // Set up click listeners for all radio-related elements
    radioSelectors.forEach(selector => {
        const cleanup = delegateEvent(root, 'click', selector, handleRadioClick);
        cleanupFunctions.push(cleanup);
    });
    logVerbose('Event listeners configured for radio button handling');
}
/**
 * Create debug interface for global access
 */
function createDebugInterface() {
    const debugInterface = {
        validateNavigation: () => validateNavigationPattern(),
        debugRadios: () => {
            const allRadios = document.querySelectorAll('input[type="radio"]');
            const radioGroups = {};
            allRadios.forEach(radio => {
                const groupName = radio.name || 'unnamed';
                if (!radioGroups[groupName])
                    radioGroups[groupName] = [];
                const dataGoTo = getAttrValue(radio, 'data-go-to');
                radioGroups[groupName].push({
                    value: radio.value,
                    dataGoTo: dataGoTo,
                    checked: radio.checked,
                    hasTarget: dataGoTo ?
                        !!queryByAttr(`[${SELECTORS.ANSWER}="${dataGoTo}"]`, document) : null
                });
            });
            logVerbose('Radio Button Debug:', radioGroups);
            return radioGroups;
        },
        reinitialize: () => {
            logVerbose('Reinitializing navigation system...');
            initializeRadioStates();
            return validateNavigationPattern();
        }
    };
    // Make available globally
    window.FormNavigationLib = debugInterface;
    logVerbose('Debug interface available: window.FormNavigationLib');
    logVerbose('Available methods: validateNavigation(), debugRadios(), reinitialize()');
}
// ==========================================
// MAIN INITIALIZATION
// ==========================================
/**
 * Initialize the navigation system
 */
export function initNavigation(root = document) {
    if (initialized) {
        logVerbose('Navigation already initialized, cleaning up first');
        resetNavigation();
    }
    logVerbose('Initializing universal form navigation system...');
    // 1. Validate navigation pattern
    const validationResult = validateNavigationPattern(root);
    // 2. Setup radio button handling
    setupEventListeners(root);
    // 3. Initialize visual states
    initializeRadioStates(root);
    // 4. Create debug interface
    createDebugInterface();
    // 5. Report initialization status
    if (validationResult.valid) {
        logVerbose('✅ Navigation initialization completed successfully');
        logVerbose('Navigation pattern validated and radio button system active');
    }
    else {
        console.error('⚠️ Navigation initialization completed with issues');
        console.error('Please fix data-go-to ↔ data-answer mismatches');
    }
    initialized = true;
    return validationResult;
}
/**
 * Reset the navigation system
 */
export function resetNavigation() {
    if (!initialized)
        return;
    logVerbose('Resetting navigation system');
    // Clean up event listeners
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions = [];
    // Clear state
    navigationValidationResult = null;
    // Remove debug interface
    delete window.FormNavigationLib;
    initialized = false;
    logVerbose('Navigation system reset complete');
}
/**
 * Get current navigation state
 */
export function getNavigationState() {
    return {
        initialized,
        validationResult: navigationValidationResult,
        hasDebugInterface: !!window.FormNavigationLib
    };
}
/**
 * Validate a specific navigation target exists
 */
export function validateNavigationTarget(target) {
    const targetElement = queryByAttr(`[${SELECTORS.ANSWER}="${target}"]`, document);
    return !!targetElement;
}
/**
 * Get all navigation issues
 */
export function getNavigationIssues() {
    return navigationValidationResult?.issues || [];
}
//# sourceMappingURL=navigation.js.map