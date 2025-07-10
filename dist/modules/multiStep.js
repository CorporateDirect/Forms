/**
 * Multi-step form navigation module
 */
import { SELECTORS } from '../config.js';
import { logVerbose, queryAllByAttr, getAttrValue, delegateEvent, showElement, hideElement, isVisible, removeClass } from './utils.js';
import { formEvents } from './events.js';
let initialized = false;
let cleanupFunctions = [];
let eventCleanupFunctions = [];
let steps = [];
let stepItems = [];
let currentStepIndex = -1; // Initialize to -1 to indicate no current step
let currentStepItemId = null;
let currentStepId = '';
let stepHistory = [];
/**
 * Initialize multi-step functionality
 */
export function initMultiStep(root = document) {
    if (initialized) {
        logVerbose('MultiStep already initialized, cleaning up first');
        resetMultiStep();
    }
    console.log('🚀 [MultiStep] === INITIALIZATION START ===');
    console.log('🔍 [MultiStep] Root element:', {
        isDocument: root === document,
        elementType: root.constructor.name,
        hasQuerySelector: typeof root.querySelector === 'function'
    });
    logVerbose('Initializing multi-step navigation with step/step_item architecture');
    // Find all parent step elements
    const stepElements = queryAllByAttr(SELECTORS.STEP, root);
    console.log('📋 [MultiStep] Step detection results:', {
        selector: SELECTORS.STEP,
        foundElements: stepElements.length,
        elements: Array.from(stepElements).map((el, i) => ({
            index: i,
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            hasDataForm: el.hasAttribute('data-form'),
            dataFormValue: el.getAttribute('data-form'),
            innerHTML: el.innerHTML.substring(0, 100) + '...'
        }))
    });
    if (stepElements.length === 0) {
        console.error('❌ [MultiStep] CRITICAL: No step elements found!', {
            selector: SELECTORS.STEP,
            searchedIn: root === document ? 'entire document' : 'custom root element',
            possibleIssues: [
                'Form missing data-form="multistep" attribute',
                'Steps missing data-form="step" attributes',
                'Script loading before DOM is ready'
            ],
            troubleshooting: {
                checkForm: 'document.querySelector(\'[data-form="multistep"]\')',
                checkSteps: 'document.querySelectorAll(\'[data-form="step"]\')',
                checkAllDataForm: 'document.querySelectorAll(\'[data-form]\')'
            }
        });
    }
    steps = Array.from(stepElements).map((stepElement, index) => {
        console.log(`🔍 [MultiStep] Processing step ${index}:`, {
            element: stepElement,
            tagName: stepElement.tagName,
            id: stepElement.id,
            className: stepElement.className,
            hasDataForm: stepElement.hasAttribute('data-form'),
            dataFormValue: getAttrValue(stepElement, 'data-form')
        });
        // Look for data-answer on step_wrapper child element (primary step identifier)
        const stepWrapper = stepElement.querySelector('.step_wrapper[data-answer]');
        let dataAnswer = null;
        console.log(`🔍 [MultiStep] Step ${index} data-answer search:`, {
            hasStepWrapper: !!stepWrapper,
            stepWrapperInfo: stepWrapper ? {
                tagName: stepWrapper.tagName,
                id: stepWrapper.id,
                className: stepWrapper.className,
                dataAnswer: stepWrapper.getAttribute('data-answer')
            } : null
        });
        if (stepWrapper) {
            dataAnswer = getAttrValue(stepWrapper, 'data-answer');
            console.log(`📋 [MultiStep] Found step_wrapper with data-answer:`, {
                stepIndex: index,
                dataAnswer,
                stepWrapper: {
                    tagName: stepWrapper.tagName,
                    id: stepWrapper.id,
                    className: stepWrapper.className
                }
            });
        }
        else {
            console.log(`ℹ️ [MultiStep] No step_wrapper found, checking step element directly`);
            // Fallback: look for data-answer on the step element itself
            dataAnswer = getAttrValue(stepElement, 'data-answer');
            if (dataAnswer) {
                console.log(`📋 [MultiStep] Found data-answer on step element:`, {
                    stepIndex: index,
                    dataAnswer
                });
            }
            else {
                console.log(`⚠️ [MultiStep] No data-answer found on step element either:`, {
                    stepIndex: index,
                    allAttributes: Array.from(stepElement.attributes).map(attr => ({
                        name: attr.name,
                        value: attr.value
                    }))
                });
            }
        }
        // If no data-answer found, generate one automatically
        if (!dataAnswer) {
            dataAnswer = `step-${index}`;
            console.warn(`⚠️ [MultiStep] No data-answer found for step ${index}, auto-generating:`, {
                stepIndex: index,
                generatedDataAnswer: dataAnswer,
                stepElement: {
                    tagName: stepElement.tagName,
                    id: stepElement.id,
                    className: stepElement.className,
                    hasStepWrapper: !!stepWrapper
                },
                recommendation: `Consider adding data-answer="${dataAnswer}" to step_wrapper or step element for better control`
            });
        }
        // Console log the expected step format for debugging
        const expectedValue = `step-${index}`;
        console.log(`🎯 [MultiStep] Step ${index} validation:`, {
            expected: expectedValue,
            found: dataAnswer,
            isValid: !!dataAnswer,
            matches: dataAnswer === expectedValue,
            wasAutoGenerated: !getAttrValue(stepElement, 'data-answer') && !stepWrapper
        });
        const stepInfo = {
            element: stepElement,
            id: dataAnswer,
            index: index,
            type: getAttrValue(stepElement, 'data-step-type') || undefined,
            subtype: getAttrValue(stepElement, 'data-step-subtype') || undefined,
            number: getAttrValue(stepElement, 'data-step-number') || undefined,
            isStepItem: false
        };
        console.log(`✅ [MultiStep] Step ${index} initialized successfully:`, {
            stepId: dataAnswer,
            stepInfo: {
                id: stepInfo.id,
                type: stepInfo.type,
                subtype: stepInfo.subtype,
                number: stepInfo.number
            }
        });
        // Note: Step info no longer stored in FormState (simplified)
        return stepInfo;
    }); // Remove the filter since we're no longer returning null values
    console.log('📊 [MultiStep] Step initialization summary:', {
        totalStepsFound: stepElements.length,
        totalStepsInitialized: steps.length,
        stepIds: steps.map(s => s.id),
        stepIndices: steps.map(s => s.index)
    });
    // No need to fix indices since we're not filtering anymore
    // Initialize step items (branching options)
    const stepItemElements = document.querySelectorAll('.step_item');
    console.log(`🌿 [MultiStep] Found ${stepItemElements.length} step_items for branching logic`);
    stepItems = Array.from(stepItemElements).map((stepItemElement, index) => {
        console.log(`🔍 [MultiStep] Processing step_item ${index}:`, {
            element: stepItemElement,
            tagName: stepItemElement.tagName,
            id: stepItemElement.id,
            className: stepItemElement.className,
            hasDataAnswer: stepItemElement.hasAttribute('data-answer'),
            dataAnswer: getAttrValue(stepItemElement, 'data-answer')
        });
        const dataAnswer = getAttrValue(stepItemElement, 'data-answer');
        if (!dataAnswer) {
            console.error(`❌ [MultiStep] STEP_ITEM INITIALIZATION ERROR:`, {
                stepItemIndex: index,
                error: `Step_item ${index} is missing required data-answer attribute`,
                stepItemElement: {
                    tagName: stepItemElement.tagName,
                    id: stepItemElement.id,
                    className: stepItemElement.className,
                    innerHTML: stepItemElement.innerHTML.substring(0, 200) + '...'
                },
                solution: `Add data-answer attribute to step_item element`,
                example: `<div class="step_item" data-answer="some-unique-id">`,
                troubleshooting: {
                    checkElement: `element.getAttribute('data-answer')`,
                    allDataAnswers: `Array.from(document.querySelectorAll('[data-answer]')).map(el => el.getAttribute('data-answer'))`
                }
            });
            // Skip this step_item - don't add it to the stepItems array
            return null;
        }
        // Find the parent step for this step_item
        const parentStepElement = stepItemElement.closest('[data-form="step"]');
        let parentStepIndex;
        if (parentStepElement) {
            parentStepIndex = Array.from(stepElements).indexOf(parentStepElement);
            console.log(`🔗 [MultiStep] Found parent step for step_item:`, {
                stepItemId: dataAnswer,
                parentStepIndex,
                parentStepId: parentStepIndex !== -1 ? steps[parentStepIndex]?.id : 'NOT_FOUND',
                parentElement: {
                    tagName: parentStepElement.tagName,
                    id: parentStepElement.id,
                    className: parentStepElement.className
                }
            });
        }
        else {
            console.warn(`⚠️ [MultiStep] No parent step found for step_item:`, {
                stepItemId: dataAnswer,
                stepItemIndex: index,
                warning: 'step_item should be nested within a [data-form="step"] element',
                suggestion: 'Check DOM structure - step_item should be inside a step element'
            });
        }
        const stepItemInfo = {
            element: stepItemElement,
            id: dataAnswer,
            index: index,
            type: getAttrValue(stepItemElement, 'data-step-type') || undefined,
            subtype: getAttrValue(stepItemElement, 'data-step-subtype') || undefined,
            number: getAttrValue(stepItemElement, 'data-step-number') || undefined,
            isStepItem: true,
            parentStepIndex: parentStepIndex !== -1 ? parentStepIndex : undefined
        };
        console.log(`✅ [MultiStep] Step_item ${index} initialized successfully:`, {
            stepItemId: dataAnswer,
            stepItemInfo: {
                id: stepItemInfo.id,
                type: stepItemInfo.type,
                subtype: stepItemInfo.subtype,
                number: stepItemInfo.number,
                parentStepIndex: stepItemInfo.parentStepIndex,
                parentStepId: stepItemInfo.parentStepIndex !== undefined ? steps[stepItemInfo.parentStepIndex]?.id : undefined
            }
        });
        // Note: Step item info no longer stored in FormState (simplified)
        return stepItemInfo;
    }).filter(stepItem => stepItem !== null); // Filter out step_items that were skipped
    // Hide all steps and step_items initially
    console.log('👁️ [MultiStep] === INITIAL STEP HIDING ===');
    logVerbose('Starting to hide all steps initially', { totalSteps: steps.length, totalStepItems: stepItems.length });
    steps.forEach((step, index) => {
        console.log(`🫥 [MultiStep] Hiding step ${index} (${step.id}):`, {
            stepId: step.id,
            element: {
                tagName: step.element.tagName,
                id: step.element.id,
                className: step.element.className
            },
            beforeHide: {
                display: step.element.style.display,
                visibility: step.element.style.visibility,
                computedDisplay: getComputedStyle(step.element).display,
                isVisible: isVisible(step.element),
                offsetHeight: step.element.offsetHeight,
                offsetWidth: step.element.offsetWidth
            }
        });
        hideElement(step.element);
        console.log(`✅ [MultiStep] Step ${index} hidden:`, {
            stepId: step.id,
            afterHide: {
                display: step.element.style.display,
                visibility: step.element.style.visibility,
                computedDisplay: getComputedStyle(step.element).display,
                isVisible: isVisible(step.element),
                offsetHeight: step.element.offsetHeight,
                offsetWidth: step.element.offsetWidth
            }
        });
    });
    stepItems.forEach((stepItem, index) => {
        console.log(`🫥 [MultiStep] Hiding stepItem ${index} (${stepItem.id})`);
        hideElement(stepItem.element);
    });
    console.log('✅ [MultiStep] Finished hiding all steps and step items');
    logVerbose('Finished hiding all steps and step items');
    // Set up navigation event listeners
    setupNavigationListeners(root);
    // Listen for navigation events from other modules BEFORE initializing skip
    // This ensures we're ready to handle skip:request events immediately
    setupEventListeners();
    // Set up skip functionality (integrated)
    setupSkipListeners(root);
    // Show initial step
    console.log('🎬 [MultiStep] === INITIAL STEP SHOWING ===');
    if (steps.length > 0) {
        // Start at step 0 unless there's a specific start step defined
        const multistepElement = root.querySelector(SELECTORS.MULTISTEP);
        const startStepAttr = multistepElement ? getAttrValue(multistepElement, 'data-start-step') : null;
        const startStepId = startStepAttr || steps[0].id;
        const startIndex = findStepIndexById(startStepId);
        console.log('🎯 [MultiStep] Initial step selection:', {
            totalSteps: steps.length,
            multistepElement: !!multistepElement,
            startStepAttr,
            defaultFirstStepId: steps[0].id,
            selectedStartStepId: startStepId,
            selectedStartIndex: startIndex,
            isValidIndex: startIndex !== -1,
            allStepIds: steps.map(s => s.id)
        });
        const finalStartIndex = startIndex !== -1 ? startIndex : 0;
        console.log(`🚀 [MultiStep] Showing initial step: index ${finalStartIndex} (${steps[finalStartIndex]?.id})`);
        goToStep(finalStartIndex);
    }
    else {
        console.error('❌ [MultiStep] CRITICAL: No steps found to initialize - cannot show initial step!');
        logVerbose('No steps found to initialize');
    }
    initialized = true;
    logVerbose('Multi-step initialization complete');
    // Register this module as initialized
    formEvents.registerModule('multiStep');
}
/**
 * Set up event listeners for module communication
 */
function setupEventListeners() {
    const branchChangeCleanup = formEvents.on('branch:change', ({ targetStepId }) => {
        logVerbose(`Received branch:change event, navigating to: ${targetStepId}`);
        goToStepById(targetStepId);
    });
    const skipRequestCleanup = formEvents.on('skip:request', ({ targetStepId }) => {
        logVerbose('Received skip:request event', { targetStepId });
        // Navigate to target step
        if (targetStepId) {
            logVerbose('Navigating to target step:', targetStepId);
            goToStepById(targetStepId);
        }
        else {
            logVerbose('No target step provided in skip:request');
        }
    });
    // Listen for branching show/hide events
    const branchShowCleanup = formEvents.on('branch:show', ({ stepId }) => {
        logVerbose('Received branch:show event', { stepId });
        const stepElement = document.querySelector(`[data-answer="${stepId}"]`);
        if (stepElement) {
            showElement(stepElement);
            // Enable required fields in this step
            updateRequiredFieldsInStep(stepElement, true);
        }
    });
    const branchHideCleanup = formEvents.on('branch:hide', ({ stepId }) => {
        logVerbose('Received branch:hide event', { stepId });
        const stepElement = document.querySelector(`[data-answer="${stepId}"]`);
        if (stepElement) {
            hideElement(stepElement);
            // Disable required fields in this step
            updateRequiredFieldsInStep(stepElement, false);
        }
    });
    // Store cleanup functions for proper cleanup
    eventCleanupFunctions.push(branchChangeCleanup, skipRequestCleanup, branchShowCleanup, branchHideCleanup);
}
/**
 * Update required fields in a step or step_item (unified function)
 */
function updateRequiredFieldsInStep(stepElement, enable = true) {
    const fields = stepElement.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        const input = field;
        if (enable) {
            // Restore original required state
            const originalRequired = input.getAttribute('data-original-required');
            if (originalRequired === 'true') {
                input.required = true;
                input.disabled = false;
            }
        }
        else {
            // Save original required state and disable
            if (input.required) {
                input.setAttribute('data-original-required', 'true');
            }
            input.required = false;
            input.disabled = true;
            input.value = ''; // Clear value when hiding
        }
    });
}
/**
 * Update required fields based on step_item subtype
 */
function updateRequiredFields(stepItemElement, enable = true) {
    const subtype = getAttrValue(stepItemElement, 'data-step-subtype');
    if (!subtype)
        return;
    logVerbose(`${enable ? 'Enabling' : 'Disabling'} required fields for subtype: ${subtype}`);
    // Find all fields with data-require-for-subtypes attribute in this step_item
    const conditionalFields = stepItemElement.querySelectorAll('[data-require-for-subtypes]');
    conditionalFields.forEach(field => {
        const requiredForSubtypes = field.getAttribute('data-require-for-subtypes');
        const htmlField = field;
        if (requiredForSubtypes && requiredForSubtypes.split(',').map(s => s.trim()).includes(subtype)) {
            if (enable) {
                htmlField.required = true;
                htmlField.disabled = false;
            }
            else {
                htmlField.required = false;
                htmlField.disabled = true;
                htmlField.value = '';
            }
        }
    });
}
/**
 * Show a specific step_item within its parent step
 */
export function showStepItem(stepItemId) {
    logVerbose(`Attempting to show step_item: ${stepItemId}`);
    // Find step item by exact ID match
    const stepItem = stepItems.find(item => item.id === stepItemId);
    if (!stepItem) {
        // Try to find by data-answer attribute as fallback
        const stepItemByAnswer = stepItems.find(item => getAttrValue(item.element, 'data-answer') === stepItemId);
        if (stepItemByAnswer) {
            logVerbose(`Found step_item by data-answer: ${stepItemId}`);
            return showStepItem(stepItemByAnswer.id);
        }
        logVerbose(`Step item not found: ${stepItemId}`);
        return;
    }
    const parentStep = steps[stepItem.parentStepIndex];
    if (!parentStep) {
        logVerbose(`Parent step not found for step_item: ${stepItemId}`);
        return;
    }
    logVerbose(`Showing step_item ${stepItemId} in parent step ${stepItem.parentStepIndex}`);
    // Hide all step_items in the parent step first
    const allStepItemsInParent = stepItems.filter(item => item.parentStepIndex === stepItem.parentStepIndex);
    allStepItemsInParent.forEach(item => {
        hideElement(item.element);
        updateRequiredFields(item.element, false);
        // Note: Step visibility tracking simplified
    });
    // Show the target step_item
    showElement(stepItem.element);
    // Ensure parent containers are also visible
    let parentElement = stepItem.element.parentElement;
    while (parentElement && !parentElement.classList.contains('multi-form_step')) {
        if (parentElement.classList.contains('step_wrapper')) {
            parentElement.style.display = '';
            parentElement.style.visibility = '';
            removeClass(parentElement, 'hidden-step');
            removeClass(parentElement, 'hidden-step-item');
        }
        parentElement = parentElement.parentElement;
    }
    updateRequiredFields(stepItem.element, true);
    // Note: Step visibility and visit tracking simplified
    currentStepItemId = stepItemId;
    logVerbose(`Successfully showed step_item: ${stepItemId}`);
}
/**
 * Hide a specific step_item
 */
export function hideStepItem(stepItemId) {
    const stepItem = stepItems.find(item => item.id === stepItemId);
    if (!stepItem) {
        return;
    }
    hideElement(stepItem.element);
    updateRequiredFields(stepItem.element, false);
    // Note: Step visibility tracking simplified
    if (currentStepItemId === stepItemId) {
        currentStepItemId = null;
    }
}
/**
 * Set up navigation event listeners
 */
function setupNavigationListeners(root) {
    // Use event delegation for navigation buttons
    const cleanup1 = delegateEvent(root, 'click', SELECTORS.NEXT_BTN, handleNextClick);
    const cleanup2 = delegateEvent(root, 'click', SELECTORS.BACK_BTN, handleBackClick);
    const cleanup3 = delegateEvent(root, 'click', SELECTORS.SUBMIT_BTN, handleSubmitClick);
    cleanupFunctions.push(cleanup1, cleanup2, cleanup3);
    logVerbose('Navigation listeners setup complete');
}
/**
 * Set up skip functionality (integrated from skip.ts)
 */
function setupSkipListeners(root) {
    // Skip button handling - use the main SKIP selector for buttons with data-skip attribute
    const cleanup = delegateEvent(root, 'click', SELECTORS.SKIP, handleSkipButtonClick);
    cleanupFunctions.push(cleanup);
    logVerbose('Skip listeners setup complete');
}
/**
 * Handle skip button click (integrated from skip.ts)
 */
function handleSkipButtonClick(event, target) {
    event.preventDefault();
    if (!initialized) {
        logVerbose('MultiStep module not initialized, ignoring skip button click');
        return;
    }
    // Get the data-skip value - this MUST match a data-answer value
    const dataSkip = getAttrValue(target, 'data-skip');
    // Validate that data-skip has a value
    if (!dataSkip || dataSkip === 'true' || dataSkip === '') {
        logVerbose('Invalid data-skip value - must specify target step', { dataSkip });
        return;
    }
    // Verify the target step exists in the DOM
    const targetElement = document.querySelector(`[data-answer="${dataSkip}"]`);
    if (!targetElement) {
        logVerbose('Target step not found in DOM', { targetStepId: dataSkip });
        return;
    }
    logVerbose('Processing skip request', {
        currentStepId,
        targetStepId: dataSkip
    });
    // Navigate to target step directly
    goToStepById(dataSkip);
}
/**
 * Skip a specific step (basic functionality)
 */
export function skipStep(stepId) {
    if (!initialized) {
        logVerbose('MultiStep module not initialized, cannot skip step');
        return false;
    }
    if (!stepId) {
        logVerbose('Invalid stepId provided to skipStep');
        return false;
    }
    logVerbose(`Skipping step: ${stepId}`);
    goToStepById(stepId);
    return true;
}
/**
 * Handle next button click
 * Validates the current step and moves to the next one.
 */
function handleNextClick(event) {
    console.log('🔍 NEXT BUTTON CLICK HANDLER TRIGGERED');
    console.log('Event target:', event.target);
    console.log('Event currentTarget:', event.currentTarget);
    // Check if this is actually a skip button being clicked
    const target = event.target;
    const skipAttribute = target.getAttribute('data-skip');
    if (skipAttribute) {
        console.log('❌ CONFLICT DETECTED: Skip button triggered next button handler!', {
            skipAttribute,
            targetElement: target,
            targetTagName: target.tagName,
            targetClassName: target.className
        });
        // Don't prevent default here - let the skip handler deal with it
        return;
    }
    console.log('✅ Legitimate next button click - proceeding with navigation');
    event.preventDefault();
    goToNextStep();
}
/**
 * Handle back button click
 */
function handleBackClick(event) {
    event.preventDefault();
    goToPreviousStep();
}
/**
 * Handle form submission
 * This handler is mostly for single-step forms or the final step.
 */
function handleSubmitClick(event) {
    // Find the form
    const form = event.target.closest('form');
    if (!form) {
        logVerbose('Form not found, preventing submission');
        return;
    }
    // Validate all visible steps before submission
    const isFormValid = validateAllVisibleSteps();
    if (!isFormValid) {
        event.preventDefault();
        logVerbose('Form validation failed, preventing submission');
        return;
    }
    logVerbose('Form validation passed, allowing submission');
}
/**
 * Go to a step by ID (handles both regular steps and branching step_items)
 */
export function goToStepById(stepId) {
    if (!initialized) {
        console.error('❌ [MultiStep] Module not initialized, ignoring goToStepById call', {
            stepId,
            initialized,
            totalSteps: steps.length,
            totalStepItems: stepItems.length
        });
        return;
    }
    console.log('🎯 [MultiStep] Navigation request received:', {
        targetStepId: stepId,
        currentStepIndex,
        currentStepId: currentStepId,
        totalSteps: steps.length,
        totalStepItems: stepItems.length
    });
    // Debug: Log all available step IDs for comparison
    const allStepIds = steps.map(s => s.id);
    const allStepItemIds = stepItems.map(s => s.id);
    console.log('📋 [MultiStep] Available navigation targets:', {
        searchingFor: stepId,
        parentStepIds: allStepIds,
        branchingStepItemIds: allStepItemIds,
        totalParentSteps: steps.length,
        totalBranchingItems: stepItems.length
    });
    // First check if it's a branching step_item
    const stepItem = stepItems.find(item => item.id === stepId);
    if (stepItem) {
        console.log('✅ [MultiStep] Found as branching step_item:', {
            stepItemId: stepId,
            parentStepIndex: stepItem.parentStepIndex,
            stepItemIndex: stepItem.index,
            stepItemElement: {
                tagName: stepItem.element.tagName,
                id: stepItem.element.id,
                className: stepItem.element.className,
                dataAnswer: getAttrValue(stepItem.element, 'data-answer'),
                isVisible: isVisible(stepItem.element),
                parentStep: stepItem.parentStepIndex !== undefined ? steps[stepItem.parentStepIndex]?.id : 'unknown'
            }
        });
        // Navigate to the parent step first (if not already there)
        if (stepItem.parentStepIndex !== undefined) {
            const parentStep = steps[stepItem.parentStepIndex];
            if (!parentStep) {
                console.error('❌ [MultiStep] Parent step not found for step_item!', {
                    stepItemId: stepId,
                    parentStepIndex: stepItem.parentStepIndex,
                    availableSteps: allStepIds,
                    totalSteps: steps.length
                });
                return;
            }
            console.log('🔄 [MultiStep] Navigating to parent step first:', {
                parentStepId: parentStep.id,
                parentStepIndex: stepItem.parentStepIndex,
                currentStepIndex
            });
            goToStep(stepItem.parentStepIndex);
            // Then show the specific branching option
            console.log('🌿 [MultiStep] Showing branching option:', {
                stepItemId: stepId,
                withinParentStep: parentStep.id
            });
            showStepItem(stepId);
        }
        console.log('✅ [MultiStep] Successfully navigated to step_item:', stepId);
        return;
    }
    else {
        console.log('ℹ️ [MultiStep] Not found in branching step_items, checking regular steps');
    }
    // Then check if it's a regular step
    const parentStepIndex = findStepIndexById(stepId);
    console.log('🔍 [MultiStep] Regular step search result:', {
        stepId,
        foundIndex: parentStepIndex,
        isValidIndex: parentStepIndex !== -1,
        searchMethod: 'findStepIndexById'
    });
    if (parentStepIndex !== -1) {
        const targetStep = steps[parentStepIndex];
        console.log('✅ [MultiStep] Found as regular step:', {
            stepId,
            stepIndex: parentStepIndex,
            stepElement: {
                tagName: targetStep.element.tagName,
                id: targetStep.element.id,
                className: targetStep.element.className,
                dataAnswer: getAttrValue(targetStep.element, 'data-answer'),
                isVisible: isVisible(targetStep.element)
            }
        });
        currentStepItemId = null; // Clear step item tracking
        console.log('🚀 [MultiStep] Calling goToStep with index:', {
            stepIndex: parentStepIndex,
            stepId: targetStep.id
        });
        goToStep(parentStepIndex);
        console.log('✅ [MultiStep] Successfully navigated to regular step:', stepId);
        return;
    }
    // If we get here, the step wasn't found
    console.error('❌ [MultiStep] STEP NOT FOUND:', {
        searchedFor: stepId,
        searchedIn: 'both regular steps and branching step_items',
        availableRegularSteps: allStepIds,
        availableBranchingItems: allStepItemIds,
        totalElements: {
            steps: steps.length,
            stepItems: stepItems.length
        },
        suggestion: `Check if element with data-answer="${stepId}" exists in DOM`,
        troubleshooting: {
            checkDataAnswer: `document.querySelector('[data-answer="${stepId}"]')`,
            listAllDataAnswers: `Array.from(document.querySelectorAll('[data-answer]')).map(el => el.getAttribute('data-answer'))`
        }
    });
    // Additional debugging: Check if the step exists in DOM but wasn't registered
    const domElement = document.querySelector(`[data-answer="${stepId}"]`);
    if (domElement) {
        console.error('🔍 [MultiStep] Step exists in DOM but not registered!', {
            stepId,
            domElement: {
                tagName: domElement.tagName,
                id: domElement.id,
                className: domElement.className,
                dataAnswer: getAttrValue(domElement, 'data-answer'),
                hasStepAttribute: domElement.hasAttribute('data-form'),
                stepAttribute: getAttrValue(domElement, 'data-form'),
                isVisible: domElement instanceof HTMLElement ? isVisible(domElement) : false
            },
            possibleCause: 'Element exists but was not properly initialized during module setup'
        });
    }
}
/**
 * Validate a step element (works for both parent steps and step_items)
 */
function validateStepElement(element) {
    const inputs = element.querySelectorAll('input[required], select[required], textarea[required]');
    for (const input of inputs) {
        const htmlInput = input;
        // Skip validation for hidden elements
        if (!isVisible(htmlInput))
            continue;
        // Check if the input has a value
        if (!htmlInput.value || htmlInput.value.trim() === '') {
            logVerbose('Validation failed: empty required field', {
                element: htmlInput,
                name: htmlInput.name,
                id: htmlInput.id
            });
            // Focus the invalid field
            htmlInput.focus();
            return false;
        }
        // Additional validation for email inputs
        if (htmlInput.type === 'email' && htmlInput.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(htmlInput.value)) {
                logVerbose('Validation failed: invalid email format');
                htmlInput.focus();
                return false;
            }
        }
    }
    return true;
}
/**
 * Go to a specific step by index
 */
export function goToStep(stepIndex) {
    console.log('🎯 [STEP NAVIGATION] === GO TO STEP START ===');
    console.log('🎯 [STEP NAVIGATION] Starting goToStep:', {
        requestedIndex: stepIndex,
        currentIndex: currentStepIndex,
        totalSteps: steps.length,
        stepExists: stepIndex >= 0 && stepIndex < steps.length,
        initialized: initialized
    });
    if (!initialized) {
        console.error('❌ [STEP NAVIGATION] Module not initialized!');
        logVerbose('Multi-step module not initialized, ignoring goToStep call');
        return;
    }
    if (stepIndex < 0 || stepIndex >= steps.length) {
        console.error('❌ [STEP NAVIGATION] Invalid step index:', {
            requestedIndex: stepIndex,
            validRange: `0 to ${steps.length - 1}`,
            totalSteps: steps.length,
            availableStepIds: steps.map(s => s.id)
        });
        return;
    }
    const targetStep = steps[stepIndex];
    console.log('📋 [STEP NAVIGATION] Target step details:', {
        stepIndex,
        stepId: targetStep.id,
        element: {
            tagName: targetStep.element.tagName,
            id: targetStep.element.id,
            className: targetStep.element.className,
            dataAnswer: getAttrValue(targetStep.element, 'data-answer'),
            innerHTML: targetStep.element.innerHTML.length > 0 ? `${targetStep.element.innerHTML.substring(0, 100)}...` : 'EMPTY',
            hasContent: targetStep.element.children.length > 0,
            childrenCount: targetStep.element.children.length
        },
        visibility: {
            isVisible: isVisible(targetStep.element),
            display: getComputedStyle(targetStep.element).display,
            visibility: getComputedStyle(targetStep.element).visibility,
            opacity: getComputedStyle(targetStep.element).opacity,
            hasHiddenClass: targetStep.element.classList.contains('hidden-step'),
            offsetHeight: targetStep.element.offsetHeight,
            offsetWidth: targetStep.element.offsetWidth
        }
    });
    // Check if target step has content
    if (targetStep.element.children.length === 0 && targetStep.element.innerHTML.trim() === '') {
        console.warn('⚠️ [STEP NAVIGATION] Target step appears to be empty!', {
            stepId: targetStep.id,
            stepIndex,
            innerHTML: targetStep.element.innerHTML,
            textContent: targetStep.element.textContent,
            childrenCount: targetStep.element.children.length,
            possibleIssue: 'This step may be a blank wrapper'
        });
    }
    logVerbose(`Attempting to go to step index: ${stepIndex}`);
    // Hide current step
    if (currentStepIndex !== -1) {
        const currentStep = steps[currentStepIndex];
        console.log('👋 [STEP NAVIGATION] Hiding current step:', {
            currentIndex: currentStepIndex,
            currentStepId: currentStep.id,
            beforeHide: {
                isVisible: isVisible(currentStep.element),
                display: getComputedStyle(currentStep.element).display
            }
        });
        hideStep(currentStepIndex);
        console.log('✅ [STEP NAVIGATION] Current step hidden:', {
            stepId: currentStep.id,
            afterHide: {
                isVisible: isVisible(currentStep.element),
                display: getComputedStyle(currentStep.element).display
            }
        });
    }
    // Show target step
    console.log('👁️ [STEP NAVIGATION] Showing target step:', {
        stepIndex,
        stepId: targetStep.id,
        beforeShow: {
            isVisible: isVisible(targetStep.element),
            display: getComputedStyle(targetStep.element).display,
            hasHiddenClass: targetStep.element.classList.contains('hidden-step')
        }
    });
    showStep(stepIndex);
    console.log('✅ [STEP NAVIGATION] Target step shown:', {
        stepId: targetStep.id,
        afterShow: {
            isVisible: isVisible(targetStep.element),
            display: getComputedStyle(targetStep.element).display,
            hasHiddenClass: targetStep.element.classList.contains('hidden-step'),
            actuallyVisible: targetStep.element.offsetHeight > 0 && targetStep.element.offsetWidth > 0
        }
    });
    console.log('🎯 [STEP NAVIGATION] === GO TO STEP END ===');
}
/**
 * Show a step by its index
 */
export function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) {
        logVerbose(`Invalid step index: ${stepIndex}`);
        return;
    }
    const step = steps[stepIndex];
    if (!step) {
        logVerbose(`Step not found at index: ${stepIndex}`);
        return;
    }
    console.log(`🔄 [MultiStep] Showing step ${stepIndex}:`, {
        stepId: step.id,
        stepIndex,
        element: {
            tagName: step.element.tagName,
            id: step.element.id,
            className: step.element.className
        }
    });
    // Hide all other steps and clean up their active classes
    steps.forEach((s, i) => {
        if (i !== stepIndex) {
            hideStep(i);
            // Remove active-step class from all other steps
            s.element.classList.remove('active-step');
        }
    });
    // Show the target step
    showElement(step.element);
    step.element.classList.add('active-step');
    // Update current step tracking
    currentStepIndex = stepIndex;
    currentStepId = step.id;
    // Track step history for back navigation
    if (stepHistory[stepHistory.length - 1] !== step.id) {
        stepHistory.push(step.id);
    }
    // Update navigation buttons
    updateNavigationButtons();
    // Emit step change event
    formEvents.emit('step:change', {
        currentStepIndex: stepIndex,
        currentStepId: step.id,
    });
    console.log(`✅ [MultiStep] Step ${stepIndex} (${step.id}) is now visible:`, {
        isVisible: isVisible(step.element),
        hasActiveClass: step.element.classList.contains('active-step'),
        currentlyTracked: currentStepId === step.id,
        computedDisplay: getComputedStyle(step.element).display,
        computedVisibility: getComputedStyle(step.element).visibility
    });
    // Run diagnostics if step is still not visible
    if (!isVisible(step.element)) {
        console.error(`❌ [MultiStep] Step ${stepIndex} (${step.id}) is still not visible after showElement!`);
        diagnoseVisibilityIssues(step.element, step.id);
    }
}
/**
 * Hide a step by its index
 */
function hideStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) {
        return;
    }
    const step = steps[stepIndex];
    console.log(`🔄 [MultiStep] Hiding step ${stepIndex}:`, {
        stepId: step.id,
        stepIndex,
        element: {
            tagName: step.element.tagName,
            id: step.element.id,
            className: step.element.className,
            hadActiveClass: step.element.classList.contains('active-step')
        }
    });
    // Hide the step element
    hideElement(step.element);
    // Remove active class
    step.element.classList.remove('active-step');
    // Note: Step visibility tracking simplified
    // Also hide all step_items within this step
    stepItems.forEach(item => {
        if (item.parentStepIndex === stepIndex) {
            hideElement(item.element);
            // Note: Step item visibility tracking simplified
        }
    });
    console.log(`✅ [MultiStep] Step ${stepIndex} (${step.id}) is now hidden:`, {
        isVisible: isVisible(step.element),
        hasActiveClass: step.element.classList.contains('active-step'),
        currentlyTracked: currentStepId === step.id,
        computedDisplay: getComputedStyle(step.element).display,
        computedVisibility: getComputedStyle(step.element).visibility
    });
}
/**
 * Go to next step (sequential) - restored original logic with skip integration
 */
function goToNextStep() {
    if (!initialized) {
        logVerbose('Multi-step module not initialized, ignoring goToNextStep call');
        return;
    }
    logVerbose('=== GO TO NEXT STEP FUNCTION START ===');
    // Add stack trace to see what called this function
    console.log('🔍 GO TO NEXT STEP CALLED');
    console.trace('Call stack for goToNextStep:');
    const currentStep = getCurrentStep();
    if (!currentStep) {
        logVerbose('No current step found');
        return;
    }
    logVerbose('Current step info', {
        stepId: currentStep.id,
        stepIndex: currentStepIndex,
        stepElement: {
            tagName: currentStep.element.tagName,
            id: currentStep.element.id,
            className: currentStep.element.className
        }
    });
    // Skip conditions removed - using basic skip functionality only
    // Use original simple next step logic
    const nextIndex = currentStepIndex + 1;
    console.log(`🔍 ATTEMPTING TO NAVIGATE TO NEXT STEP - Current: ${currentStepIndex}, Next: ${nextIndex}`);
    logVerbose('Sequential navigation logic', {
        currentIndex: currentStepIndex,
        nextIndex,
        totalSteps: steps.length,
        hasNextStep: nextIndex < steps.length
    });
    if (nextIndex < steps.length) {
        logVerbose(`Going to next sequential step: index ${nextIndex}`);
        goToStep(nextIndex);
    }
    else {
        logVerbose('Already at last step');
    }
    logVerbose('=== GO TO NEXT STEP FUNCTION END ===');
}
/**
 * Go to previous step
 */
function goToPreviousStep() {
    // Try to get previous step from history
    if (stepHistory.length > 1) {
        stepHistory.pop(); // Remove current step
        const previousStepId = stepHistory[stepHistory.length - 1];
        if (previousStepId) {
            const previousIndex = findStepIndexById(previousStepId);
            if (previousIndex !== -1) {
                goToStep(previousIndex);
                return;
            }
        }
    }
    // Fallback to sequential previous step
    const previousIndex = currentStepIndex - 1;
    if (previousIndex >= 0) {
        goToStep(previousIndex);
    }
    else {
        logVerbose('Already at first step');
    }
}
/**
 * Find step index by step ID
 */
function findStepIndexById(stepId) {
    return steps.findIndex(step => step.id === stepId);
}
/**
 * Get current step
 */
function getCurrentStep() {
    return steps[currentStepIndex] || null;
}
/**
 * Update navigation button states
 */
function updateNavigationButtons() {
    const nextBtn = document.querySelector(SELECTORS.NEXT_BTN);
    const backBtn = document.querySelector(SELECTORS.BACK_BTN);
    const submitBtn = document.querySelector(SELECTORS.SUBMIT_BTN);
    if (!nextBtn || !backBtn || !submitBtn)
        return;
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;
    // Back button visibility
    backBtn.style.display = isFirstStep ? 'none' : '';
    // Next/Submit button visibility
    if (isLastStep) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = '';
    }
    else {
        nextBtn.style.display = '';
        submitBtn.style.display = 'none';
    }
}
/**
 * Validate all visible steps
 */
function validateAllVisibleSteps() {
    for (const step of steps) {
        if (step.id === currentStepId || isVisible(step.element)) {
            if (!validateStepElement(step.element)) {
                return false;
            }
        }
    }
    return true;
}
/**
 * Get current step information
 */
export function getCurrentStepInfo() {
    const currentStep = getCurrentStep();
    return {
        step: currentStep,
        index: currentStepIndex,
        totalSteps: steps.length,
        isFirstStep: currentStepIndex === 0,
        isLastStep: currentStepIndex === steps.length - 1
    };
}
/**
 * Reset multi-step state and cleanup
 */
function resetMultiStep() {
    if (!initialized) {
        logVerbose('Multi-step module not initialized, nothing to reset');
        return;
    }
    logVerbose('Resetting multi-step module');
    // Unregister this module
    formEvents.unregisterModule('multiStep');
    cleanupFunctions.forEach(fn => fn());
    cleanupFunctions = [];
    steps = [];
    stepItems = [];
    currentStepIndex = -1;
    currentStepItemId = null;
    currentStepId = '';
    stepHistory = [];
    initialized = false;
    // Clean up event listeners
    eventCleanupFunctions.forEach(fn => fn());
    eventCleanupFunctions = [];
    logVerbose('Multi-step module reset');
}
/**
 * Get multi-step state for debugging
 */
export function getMultiStepState() {
    return {
        initialized,
        currentStepIndex,
        totalSteps: steps.length,
        steps: steps.map(step => ({
            id: step.id,
            index: step.index,
            visible: isVisible(step.element),
            type: step.type,
            subtype: step.subtype,
            number: step.number
        }))
    };
}
/**
 * Diagnostic function to check for CSS conflicts that might prevent visibility
 */
function diagnoseVisibilityIssues(element, stepId) {
    const computedStyle = getComputedStyle(element);
    const parentElements = [];
    // Walk up the DOM tree to find potential conflicting styles
    let currentElement = element;
    while (currentElement && currentElement !== document.body) {
        parentElements.push(currentElement);
        currentElement = currentElement.parentElement;
    }
    console.log(`🔍 [MultiStep] Diagnosing visibility issues for step ${stepId}:`, {
        targetElement: {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            computedDisplay: computedStyle.display,
            computedVisibility: computedStyle.visibility,
            computedOpacity: computedStyle.opacity,
            inlineDisplay: element.style.display,
            inlineVisibility: element.style.visibility,
            inlineOpacity: element.style.opacity,
            hasHiddenClass: element.classList.contains('hidden-step'),
            isVisible: isVisible(element)
        },
        parentChain: parentElements.map(el => ({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            computedDisplay: getComputedStyle(el).display,
            computedVisibility: getComputedStyle(el).visibility,
            computedOpacity: getComputedStyle(el).opacity,
            hasHiddenClass: el.classList.contains('hidden-step')
        })),
        possibleConflicts: {
            hasDisplayNone: computedStyle.display === 'none',
            hasVisibilityHidden: computedStyle.visibility === 'hidden',
            hasZeroOpacity: computedStyle.opacity === '0',
            hasHiddenClass: element.classList.contains('hidden-step'),
            parentWithDisplayNone: parentElements.some(el => getComputedStyle(el).display === 'none'),
            parentWithVisibilityHidden: parentElements.some(el => getComputedStyle(el).visibility === 'hidden')
        }
    });
}
//# sourceMappingURL=multiStep.js.map