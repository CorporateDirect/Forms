/**
 * Multi-step form navigation module
 */
import { SELECTORS } from '../config.js';
import { logVerbose, queryAllByAttr, getAttrValue, delegateEvent, showElement, hideElement, isVisible, removeClass } from './utils.js';
import { FormState } from './formState.js';
import { initSkip, resetSkip } from './skip.js';
import { formEvents } from './events.js';
let initialized = false;
let cleanupFunctions = [];
let eventCleanupFunctions = [];
let steps = [];
let stepItems = [];
let currentStepIndex = -1; // Initialize to -1 to indicate no current step
let currentStepItemId = null;
/**
 * Initialize multi-step functionality
 */
export function initMultiStep(root = document) {
    if (initialized) {
        logVerbose('MultiStep already initialized, cleaning up first');
        resetMultiStep();
    }
    logVerbose('Initializing multi-step navigation with step/step_item architecture');
    // Find all parent step elements
    const stepElements = queryAllByAttr(SELECTORS.STEP, root);
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
        }
        // Console log the expected step format for debugging
        const expectedValue = `step-${index}`;
        console.log(`🎯 [MultiStep] Step ${index} validation:`, {
            expected: expectedValue,
            found: dataAnswer || 'MISSING',
            isValid: !!dataAnswer,
            matches: dataAnswer === expectedValue
        });
        // Error if no data-answer found
        if (!dataAnswer) {
            console.error(`❌ [MultiStep] STEP INITIALIZATION ERROR:`, {
                stepIndex: index,
                error: `Step ${index} is missing required data-answer attribute`,
                stepElement: {
                    tagName: stepElement.tagName,
                    id: stepElement.id,
                    className: stepElement.className,
                    hasStepWrapper: !!stepWrapper,
                    innerHTML: stepElement.innerHTML.substring(0, 200) + '...'
                },
                expectedDataAnswer: expectedValue,
                solution: `Add data-answer="${expectedValue}" to step_wrapper or step element`,
                examples: {
                    stepWrapper: `<div class="step_wrapper" data-answer="${expectedValue}">`,
                    stepElement: `<div data-form="step" data-answer="${expectedValue}">`
                },
                troubleshooting: {
                    checkStepWrapper: `element.querySelector('.step_wrapper[data-answer]')`,
                    checkStepElement: `element.getAttribute('data-answer')`,
                    allDataAnswers: `Array.from(document.querySelectorAll('[data-answer]')).map(el => el.getAttribute('data-answer'))`
                }
            });
            // Skip this step - don't add it to the steps array
            return null;
        }
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
        // Register step in FormState
        FormState.setStepInfo(dataAnswer, {
            type: stepInfo.type,
            subtype: stepInfo.subtype,
            number: stepInfo.number,
            visible: false, // All steps start hidden, goToStep(0) will show the first one
            visited: false
        });
        return stepInfo;
    }).filter(step => step !== null); // Filter out steps that were skipped
    // Fix step indices after filtering
    steps.forEach((step, index) => {
        step.index = index;
    });
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
        // Register step_item in FormState
        FormState.setStepInfo(dataAnswer, {
            type: stepItemInfo.type,
            subtype: stepItemInfo.subtype,
            number: stepItemInfo.number,
            visible: false, // All step_items start hidden
            visited: false
        });
        return stepItemInfo;
    }).filter(stepItem => stepItem !== null); // Filter out step_items that were skipped
    // Hide all steps and step_items initially
    logVerbose('Starting to hide all steps initially', { totalSteps: steps.length, totalStepItems: stepItems.length });
    steps.forEach((step, index) => {
        logVerbose(`Hiding step ${index} (${step.id})`, {
            element: step.element,
            tagName: step.element.tagName,
            id: step.element.id,
            className: step.element.className,
            beforeHide: {
                display: step.element.style.display,
                visibility: step.element.style.visibility,
                computedDisplay: getComputedStyle(step.element).display,
                isVisible: isVisible(step.element)
            }
        });
        hideElement(step.element);
        logVerbose(`Step ${index} hidden`, {
            afterHide: {
                display: step.element.style.display,
                visibility: step.element.style.visibility,
                computedDisplay: getComputedStyle(step.element).display,
                isVisible: isVisible(step.element)
            }
        });
    });
    stepItems.forEach((stepItem, index) => {
        logVerbose(`Hiding stepItem ${index} (${stepItem.id})`);
        hideElement(stepItem.element);
    });
    logVerbose('Finished hiding all steps and step items');
    // Set up navigation event listeners
    setupNavigationListeners(root);
    // Listen for navigation events from other modules BEFORE initializing skip
    // This ensures we're ready to handle skip:request events immediately
    setupEventListeners();
    // Initialize enhanced skip functionality
    initSkip(root);
    // Show initial step
    if (steps.length > 0) {
        // Start at step 0 unless there's a specific start step defined
        const multistepElement = root.querySelector(SELECTORS.MULTISTEP);
        const startStepAttr = multistepElement ? getAttrValue(multistepElement, 'data-start-step') : null;
        const startStepId = startStepAttr || steps[0].id;
        const startIndex = findStepIndexById(startStepId);
        goToStep(startIndex !== -1 ? startIndex : 0);
    }
    else {
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
    // Store cleanup functions for proper cleanup
    eventCleanupFunctions.push(branchChangeCleanup, skipRequestCleanup);
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
        FormState.setStepVisibility(item.id, false);
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
    FormState.setStepVisibility(stepItemId, true);
    FormState.setStepInfo(stepItemId, { visited: true });
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
    FormState.setStepVisibility(stepItemId, false);
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
    logVerbose('Navigation listeners setup complete (skip handling delegated to skip module)');
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
        currentStepId: FormState.getCurrentStep(),
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
    if (!initialized) {
        logVerbose('Multi-step module not initialized, ignoring goToStep call');
        return;
    }
    console.log('🎯 [STEP NAVIGATION] Starting goToStep:', {
        requestedIndex: stepIndex,
        currentIndex: currentStepIndex,
        totalSteps: steps.length,
        stepExists: stepIndex >= 0 && stepIndex < steps.length
    });
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
            hasHiddenClass: targetStep.element.classList.contains('hidden-step')
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
    // Update current step tracking
    currentStepIndex = stepIndex;
    FormState.setCurrentStep(targetStep.id);
    // Update navigation buttons
    updateNavigationButtons();
    console.log('🎉 [STEP NAVIGATION] Navigation complete:', {
        newCurrentIndex: currentStepIndex,
        newCurrentStepId: targetStep.id,
        formStateCurrentStep: FormState.getCurrentStep(),
        stepIsVisibleInDOM: isVisible(targetStep.element),
        stepHasContent: targetStep.element.children.length > 0 || targetStep.element.innerHTML.trim() !== ''
    });
    logVerbose(`Successfully navigated to step ${stepIndex} (${targetStep.id})`);
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
    // Update step visibility in FormState
    FormState.setStepVisibility(step.id, true);
    FormState.setStepInfo(step.id, { visited: true });
    // Update current step tracking
    currentStepIndex = stepIndex;
    FormState.setCurrentStep(step.id);
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
        formStateVisible: FormState.isStepVisible(step.id),
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
    // Update step visibility in FormState
    FormState.setStepVisibility(step.id, false);
    // Also hide all step_items within this step
    stepItems.forEach(item => {
        if (item.parentStepIndex === stepIndex) {
            hideElement(item.element);
            FormState.setStepVisibility(item.id, false);
        }
    });
    console.log(`✅ [MultiStep] Step ${stepIndex} (${step.id}) is now hidden:`, {
        isVisible: isVisible(step.element),
        hasActiveClass: step.element.classList.contains('active-step'),
        formStateVisible: FormState.isStepVisible(step.id),
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
    // Try to get previous step from FormState (handles branching)
    const previousStepId = FormState.goToPreviousStep();
    if (previousStepId) {
        const previousIndex = findStepIndexById(previousStepId);
        if (previousIndex !== -1) {
            goToStep(previousIndex);
            return;
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
        if (FormState.isStepVisible(step.id)) {
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
    initialized = false;
    // Reset skip module
    resetSkip();
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