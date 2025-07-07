"use strict";
var FormLib = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // index.ts
  var index_exports = {};
  __export(index_exports, {
    FormState: () => FormState,
    clearAllErrors: () => clearAllErrors,
    clearError: () => clearError,
    clearSummary: () => clearSummary,
    default: () => index_default,
    getCurrentStepInfo: () => getCurrentStepInfo,
    getNextStep: () => getNextStep,
    goToStep: () => goToStep,
    initBranching: () => initBranching,
    initErrors: () => initErrors,
    initMultiStep: () => initMultiStep,
    initSummary: () => initSummary,
    initValidation: () => initValidation,
    resetBranching: () => resetBranching,
    showError: () => showError,
    showStep: () => showStep,
    updateSummary: () => updateSummary,
    validateAllVisibleFields: () => validateAllVisibleFields,
    validateField: () => validateField,
    validateStep: () => validateStep
  });

  // config.ts
  var SELECTORS = {
    // Form types
    MULTISTEP: '[data-form="multistep"]',
    LOGIC: "[data-logic]",
    // Step elements
    STEP: '[data-form="step"]',
    ANSWER: "[data-answer]",
    // Navigation buttons
    NEXT_BTN: '[data-form="next-btn"]',
    BACK_BTN: '[data-form="back-btn"]',
    SUBMIT: '[data-form="submit"]',
    SKIP: "[data-skip]",
    ERROR_DISPLAY: '[data-form="error"]',
    // Branching logic
    GO_TO: "[data-go-to]",
    SHOW_IF: "[data-show-if]",
    SKIP_BTN: '[data-form="skip-btn"]',
    SUBMIT_BTN: '[data-form="submit-btn"]',
    // Step categorization
    STEP_TYPE: "[data-step-type]",
    STEP_SUBTYPE: "[data-step-subtype]",
    STEP_NUMBER: "[data-step-number]",
    // Summary fields
    STEP_FIELD_NAME: "[data-step-field-name]",
    SUMMARY_FIELD: "[data-summary-field]",
    SUMMARY_TYPE: "[data-summary-type]",
    SUMMARY_SUBTYPE: "[data-summary-subtype]",
    SUMMARY_NUMBER: "[data-summary-number]",
    JOIN: "[data-join]",
    // Validation
    REQUIRED: "[required]",
    ERROR_MESSAGE: "[data-error-message]",
    VALIDATE: "[data-validate]"
  };
  var DEFAULTS = {
    START_STEP: 1,
    DEBUG: true,
    LOG_PREFIX: "[FormLib]",
    VALIDATION_DELAY: 300,
    // ms
    ANIMATION_DURATION: 300,
    // ms
    JOIN_SEPARATOR: {
      space: " ",
      comma: ", ",
      dash: " - ",
      pipe: " | ",
      newline: "\n"
    }
  };
  var CSS_CLASSES = {
    ACTIVE_STEP: "active-step",
    HIDDEN_STEP: "hidden-step",
    HIDDEN_STEP_ITEM: "hidden-step-item",
    ERROR_FIELD: "error-field",
    ACTIVE_ERROR: "active-error",
    DISABLED: "disabled"
  };

  // modules/utils.ts
  function logVerbose(message, data) {
    if (!DEFAULTS.DEBUG) return;
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[1].split(".")[0];
    const prefix = `${DEFAULTS.LOG_PREFIX} [${timestamp}]`;
    if (data !== void 0) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
  function queryAllByAttr(selector, root = document) {
    return root.querySelectorAll(selector);
  }
  function queryByAttr(selector, root = document) {
    return root.querySelector(selector);
  }
  function getAttrValue(element, attribute) {
    return element.getAttribute(attribute);
  }
  function addClass(element, className) {
    element.classList.add(className);
  }
  function removeClass(element, className) {
    element.classList.remove(className);
  }
  function hasClass(element, className) {
    return element.classList.contains(className);
  }
  function showElement(element) {
    removeClass(element, "hidden-step");
    element.style.display = "";
    logVerbose(`Showing element:`, element);
  }
  function hideElement(element) {
    addClass(element, "hidden-step");
    element.style.display = "none";
    logVerbose(`Hiding element:`, element);
  }
  function isVisible(element) {
    return element.style.display !== "none" && !hasClass(element, "hidden-step");
  }
  function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }
  function isFormInput(element) {
    return element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement;
  }
  function getInputValue(input) {
    if (input instanceof HTMLInputElement) {
      if (input.type === "checkbox" || input.type === "radio") {
        return input.checked ? input.value : "";
      }
      return input.value;
    }
    if (input instanceof HTMLSelectElement && input.multiple) {
      return Array.from(input.selectedOptions).map((option) => option.value);
    }
    return input.value;
  }
  function delegateEvent(root, eventType, selector, handler) {
    const delegatedHandler = (event) => {
      const target = event.target?.closest(selector);
      if (target) {
        handler(event, target);
      }
    };
    root.addEventListener(eventType, delegatedHandler);
    return () => {
      root.removeEventListener(eventType, delegatedHandler);
    };
  }

  // modules/formState.ts
  var FormStateManager = class _FormStateManager {
    constructor() {
      this.data = {};
      this.steps = {};
      this.branchPath = {
        currentStep: "",
        previousSteps: [],
        skippedSteps: [],
        activeConditions: {}
      };
      logVerbose("FormState initialized");
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
      if (!_FormStateManager.instance) {
        _FormStateManager.instance = new _FormStateManager();
      }
      return _FormStateManager.instance;
    }
    /**
     * Set field value
     */
    setField(name, value) {
      const oldValue = this.data[name];
      this.data[name] = value;
      logVerbose(`Field updated: ${name}`, {
        oldValue,
        newValue: value
      });
      this.onFieldChange(name, value, oldValue);
    }
    /**
     * Get field value
     */
    getField(name) {
      return this.data[name];
    }
    /**
     * Get all field data
     */
    getAll() {
      return { ...this.data };
    }
    /**
     * Clear all data
     */
    clear() {
      const oldData = { ...this.data };
      this.data = {};
      this.steps = {};
      this.branchPath = {
        currentStep: "",
        previousSteps: [],
        skippedSteps: [],
        activeConditions: {}
      };
      logVerbose("FormState cleared", { oldData });
    }
    /**
     * Clear specific fields (used when branching changes)
     */
    clearFields(fieldNames) {
      const clearedFields = {};
      fieldNames.forEach((name) => {
        if (this.data[name] !== void 0) {
          clearedFields[name] = this.data[name];
          delete this.data[name];
        }
      });
      if (Object.keys(clearedFields).length > 0) {
        logVerbose("Fields cleared due to branch change", clearedFields);
      }
    }
    /**
     * Set step information
     */
    setStepInfo(stepId, info) {
      if (!this.steps[stepId]) {
        this.steps[stepId] = {
          visible: false,
          visited: false
        };
      }
      Object.assign(this.steps[stepId], info);
      logVerbose(`Step info updated: ${stepId}`, this.steps[stepId]);
    }
    /**
     * Get step information
     */
    getStepInfo(stepId) {
      return this.steps[stepId];
    }
    /**
     * Get all step information
     */
    getAllSteps() {
      return { ...this.steps };
    }
    /**
     * Set step visibility
     */
    setStepVisibility(stepId, visible) {
      this.setStepInfo(stepId, { visible });
      logVerbose(`Step visibility updated: ${stepId}`, { visible });
    }
    /**
     * Set current step in branch path
     */
    setCurrentStep(stepId) {
      if (this.branchPath.currentStep && this.branchPath.currentStep !== stepId) {
        this.branchPath.previousSteps.push(this.branchPath.currentStep);
      }
      this.branchPath.currentStep = stepId;
      this.setStepInfo(stepId, { visited: true });
      logVerbose(`Current step changed to: ${stepId}`, this.branchPath);
    }
    /**
     * Get current step
     */
    getCurrentStep() {
      return this.branchPath.currentStep;
    }
    /**
     * Get branch path information
     */
    getBranchPath() {
      return { ...this.branchPath };
    }
    /**
     * Add skipped step
     */
    addSkippedStep(stepId) {
      if (!this.branchPath.skippedSteps.includes(stepId)) {
        this.branchPath.skippedSteps.push(stepId);
        logVerbose(`Step skipped: ${stepId}`, this.branchPath.skippedSteps);
      }
    }
    /**
     * Set active condition
     */
    setActiveCondition(key, value) {
      this.branchPath.activeConditions[key] = value;
      logVerbose(`Active condition set: ${key}`, value);
    }
    /**
     * Get active condition
     */
    getActiveCondition(key) {
      return this.branchPath.activeConditions[key];
    }
    /**
     * Get fields by step type/subtype/number
     */
    getFieldsByStep() {
      const result = {};
      Object.entries(this.data).forEach(([key, value]) => {
        result[key] = value;
      });
      return result;
    }
    /**
     * Handle field change events
     */
    onFieldChange(name, newValue, oldValue) {
      if (newValue !== oldValue) {
        logVerbose(`Field change detected: ${name}`, {
          from: oldValue,
          to: newValue
        });
      }
    }
    /**
     * Reset to previous step (for back navigation)
     */
    goToPreviousStep() {
      const previousStep = this.branchPath.previousSteps.pop();
      if (previousStep) {
        this.branchPath.currentStep = previousStep;
        logVerbose(`Went back to previous step: ${previousStep}`, this.branchPath);
        return previousStep;
      }
      return null;
    }
    /**
     * Check if step was visited
     */
    wasStepVisited(stepId) {
      return this.steps[stepId]?.visited || false;
    }
    /**
     * Check if step is visible
     */
    isStepVisible(stepId) {
      return this.steps[stepId]?.visible || false;
    }
    /**
     * Get debug information
     */
    getDebugInfo() {
      return {
        data: this.data,
        steps: this.steps,
        branchPath: this.branchPath,
        fieldCount: Object.keys(this.data).length,
        stepCount: Object.keys(this.steps).length
      };
    }
  };
  var FormState = FormStateManager.getInstance();

  // modules/branching.ts
  var initialized = false;
  var cleanupFunctions = [];
  function initBranching(root = document) {
    if (initialized) {
      logVerbose("Branching already initialized, cleaning up first");
      resetBranching();
    }
    logVerbose("Initializing branching logic");
    setupBranchingListeners(root);
    initialized = true;
    logVerbose("Branching initialization complete");
  }
  function setupBranchingListeners(root) {
    const cleanup1 = delegateEvent(
      root,
      "change",
      SELECTORS.GO_TO,
      handleBranchTrigger
    );
    const cleanup2 = delegateEvent(
      root,
      "input",
      SELECTORS.GO_TO,
      handleBranchTrigger
    );
    const cleanup3 = delegateEvent(
      root,
      "click",
      SELECTORS.GO_TO,
      handleBranchTrigger
    );
    const cleanup4 = delegateEvent(
      root,
      "click",
      "label.radio_field, .w-radio, .radio_button-skip-step, .w-form-formradioinput, .w-radio-input",
      handleRadioLabelClick
    );
    cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4);
  }
  function handleRadioLabelClick(event, target) {
    let radioInput = null;
    radioInput = target.querySelector('input[type="radio"][data-go-to]');
    if (!radioInput) {
      const parentLabel = target.closest("label");
      if (parentLabel) {
        radioInput = parentLabel.querySelector('input[type="radio"][data-go-to]');
      }
    }
    if (!radioInput) {
      const container = target.closest(".radio_field, .w-radio, .radio_component");
      if (container) {
        radioInput = container.querySelector('input[type="radio"][data-go-to]');
      }
    }
    if (radioInput && getAttrValue(radioInput, "data-go-to")) {
      event.preventDefault();
      event.stopPropagation();
      radioInput.checked = true;
      applyRadioActiveClass(radioInput);
      const syntheticEvent = new Event("change", { bubbles: true });
      Object.defineProperty(syntheticEvent, "target", { value: radioInput });
      handleBranchTrigger(syntheticEvent, radioInput);
    }
  }
  function handleBranchTrigger(event, target) {
    if (!isFormInput(target)) {
      return;
    }
    const goToValue = getAttrValue(target, "data-go-to");
    const inputValue = getInputValue(target);
    logVerbose("Branch trigger activated", {
      element: target,
      goTo: goToValue,
      value: inputValue,
      type: target.type || target.tagName
    });
    const fieldName = target.name || getAttrValue(target, "data-step-field-name");
    if (fieldName) {
      FormState.setField(fieldName, inputValue);
    }
    if (target instanceof HTMLInputElement) {
      if (target.type === "radio" && target.checked) {
        if (!goToValue) {
          logVerbose("Radio button has no data-go-to attribute, skipping navigation");
          return;
        }
        handleRadioGroupSelection(target);
        applyRadioActiveClass(target);
        activateBranch(goToValue, target.value);
        triggerStepItemVisibility(goToValue);
      } else if (target.type === "checkbox") {
        if (target.checked) {
          activateBranch(goToValue, target.value);
        } else {
          deactivateBranch(goToValue);
        }
      } else if (target.type !== "radio" && target.type !== "checkbox") {
        if (inputValue) {
          activateBranch(goToValue, inputValue);
        } else {
          deactivateBranch(goToValue);
        }
      }
    } else {
      if (inputValue) {
        activateBranch(goToValue, inputValue);
      } else {
        deactivateBranch(goToValue);
      }
    }
    const activeConditions = FormState.getBranchPath().activeConditions;
    const hasActiveConditions = Object.values(activeConditions).some(
      (value) => value !== null && value !== void 0 && value !== ""
    );
    if (hasActiveConditions) {
      updateStepVisibility();
    }
  }
  function applyRadioActiveClass(selectedRadio) {
    const activeClass = getAttrValue(selectedRadio, "fs-inputactive-class") || "is-active-inputactive";
    if (selectedRadio.name) {
      const radioGroup = document.querySelectorAll(`input[type="radio"][name="${selectedRadio.name}"]`);
      radioGroup.forEach((radio) => {
        const htmlRadio = radio;
        const radioLabel = htmlRadio.closest("label");
        if (htmlRadio !== selectedRadio) {
          htmlRadio.classList.remove(activeClass);
          radioLabel?.classList.remove(activeClass);
        }
      });
    }
    selectedRadio.classList.add(activeClass);
    const parentLabel = selectedRadio.closest("label");
    parentLabel?.classList.add(activeClass);
  }
  function handleRadioGroupSelection(selectedRadio) {
    if (!selectedRadio.name) return;
    const radioGroup = document.querySelectorAll(`input[type="radio"][name="${selectedRadio.name}"]`);
    radioGroup.forEach((radio) => {
      const htmlRadio = radio;
      const radioGoTo = getAttrValue(htmlRadio, "data-go-to");
      if (htmlRadio !== selectedRadio && radioGoTo) {
        deactivateBranch(radioGoTo);
        hideStepItem(radioGoTo);
      }
    });
  }
  function showStepItem(stepItemId) {
    FormState.setStepVisibility(stepItemId, true);
    logVerbose(`Set step item visibility to true in FormState: ${stepItemId}`);
  }
  function hideStepItem(stepItemId) {
    FormState.setStepVisibility(stepItemId, false);
    logVerbose(`Set step item visibility to false in FormState: ${stepItemId}`);
  }
  function triggerStepItemVisibility(stepItemId) {
    if (!stepItemId) {
      logVerbose("No stepItemId provided to triggerStepItemVisibility");
      return;
    }
    logVerbose(`Triggering visibility for step_item: ${stepItemId}`);
    showStepItem(stepItemId);
  }
  function activateBranch(target, value) {
    if (!target) return;
    FormState.setActiveCondition(target, value);
  }
  function deactivateBranch(target) {
    if (!target) return;
    logVerbose(`Deactivating branch: ${target}`);
    FormState.setActiveCondition(target, null);
    clearBranchFields(target);
    updateStepVisibility();
  }
  function getNextStep(currentStep) {
    const activeConditions = FormState.getBranchPath().activeConditions;
    const nextStep = Object.keys(activeConditions).find((key) => activeConditions[key]);
    return nextStep || null;
  }
  function updateStepVisibility() {
    const allSteps = queryAllByAttr(SELECTORS.STEP);
    const activeConditions = FormState.getBranchPath().activeConditions;
    allSteps.forEach((step) => {
      const stepAnswer = getAttrValue(step, "data-answer");
      const shouldBeVisible = shouldStepBeVisible(stepAnswer, activeConditions);
      if (stepAnswer) {
        FormState.setStepVisibility(stepAnswer, shouldBeVisible);
      }
    });
  }
  function shouldStepBeVisible(stepAnswer, activeConditions) {
    if (!stepAnswer) return true;
    const stepElement = queryByAttr(`[data-answer="${stepAnswer}"]`);
    if (stepElement) {
      const showIf = getAttrValue(stepElement, "data-show-if");
      if (showIf) {
        const conditionMet = evaluateCondition(showIf, activeConditions);
        return conditionMet;
      }
    }
    return false;
  }
  function evaluateCondition(showIf, activeConditions) {
    return activeConditions.hasOwnProperty(showIf);
  }
  function clearBranchFields(branchTarget) {
    const fieldsToClear = [];
    const branchInputs = document.querySelectorAll(`[data-go-to="${branchTarget}"]`);
    branchInputs.forEach((input) => {
      if (isFormInput(input) && input.name) {
        fieldsToClear.push(input.name);
      }
    });
    if (fieldsToClear.length > 0) {
      FormState.clearFields(fieldsToClear);
    }
  }
  function resetBranching() {
    logVerbose("Resetting branching logic");
    cleanupFunctions.forEach((cleanup) => cleanup());
    cleanupFunctions = [];
    const activeConditions = FormState.getBranchPath().activeConditions;
    Object.keys(activeConditions).forEach((key) => {
      FormState.setActiveCondition(key, null);
    });
    const conditionalSteps = queryAllByAttr(SELECTORS.ANSWER);
    conditionalSteps.forEach((step) => {
      const htmlStep = step;
      htmlStep.style.display = "none";
      htmlStep.classList.add("hidden-step");
    });
    initialized = false;
    logVerbose("Branching reset complete");
  }
  function getBranchingState() {
    return {
      initialized,
      activeConditions: FormState.getBranchPath().activeConditions,
      branchPath: FormState.getBranchPath()
    };
  }

  // modules/multiStep.ts
  var initialized2 = false;
  var cleanupFunctions2 = [];
  var steps = [];
  var stepItems = [];
  var currentStepIndex = 0;
  var currentStepItemId = null;
  function initMultiStep(root = document) {
    if (initialized2) {
      logVerbose("MultiStep already initialized, cleaning up first");
      resetMultiStep();
    }
    logVerbose("Initializing multi-step navigation with step/step_item architecture");
    const stepElements = queryAllByAttr(SELECTORS.STEP, root);
    logVerbose(`Found ${stepElements.length} parent steps`);
    steps = Array.from(stepElements).map((element, index) => {
      const htmlElement = element;
      const dataAnswer = getAttrValue(element, "data-answer");
      const stepId = dataAnswer || `step-${index}`;
      const stepInfo = {
        element: htmlElement,
        id: stepId,
        index,
        type: getAttrValue(element, "data-step-type") || void 0,
        subtype: getAttrValue(element, "data-step-subtype") || void 0,
        number: getAttrValue(element, "data-step-number") || void 0,
        isStepItem: false
      };
      FormState.setStepInfo(stepId, {
        type: stepInfo.type,
        subtype: stepInfo.subtype,
        number: stepInfo.number,
        visible: index === 0,
        // First step is visible by default
        visited: false
      });
      return stepInfo;
    });
    stepItems = [];
    steps.forEach((parentStep, parentIndex) => {
      const stepItemElements = parentStep.element.querySelectorAll(".step_item, .step-item");
      stepItemElements.forEach((stepItemElement) => {
        const htmlElement = stepItemElement;
        const dataAnswer = getAttrValue(stepItemElement, "data-answer");
        if (!dataAnswer) {
          logVerbose(`Step item ${parentIndex} in parent step ${parentIndex} missing required data-answer attribute`);
          return;
        }
        const stepItemInfo = {
          element: htmlElement,
          id: dataAnswer,
          index: stepItems.length,
          // Global step_item index
          type: getAttrValue(stepItemElement, "data-step-type") || void 0,
          subtype: getAttrValue(stepItemElement, "data-step-subtype") || void 0,
          number: getAttrValue(stepItemElement, "data-step-number") || void 0,
          isStepItem: true,
          parentStepIndex: parentIndex
        };
        FormState.setStepInfo(dataAnswer, {
          type: stepItemInfo.type,
          subtype: stepItemInfo.subtype,
          number: stepItemInfo.number,
          visible: false,
          // Step items are hidden by default
          visited: false
        });
        stepItems.push(stepItemInfo);
      });
    });
    steps.forEach((step, index) => {
      hideElement(step.element);
    });
    stepItems.forEach((stepItem, index) => {
      hideElement(stepItem.element);
    });
    setupNavigationListeners(root);
    if (steps.length > 0) {
      goToStep(0);
    }
    initialized2 = true;
    logVerbose("Multi-step initialization complete", {
      parentStepCount: steps.length,
      stepItemCount: stepItems.length
    });
  }
  function setupNavigationListeners(root) {
    const cleanup1 = delegateEvent(root, "click", SELECTORS.NEXT_BTN, handleNextClick);
    const cleanup2 = delegateEvent(root, "click", SELECTORS.BACK_BTN, handleBackClick);
    const cleanup3 = delegateEvent(root, "click", SELECTORS.SKIP_BTN, handleSkipClick);
    const cleanup4 = delegateEvent(root, "click", SELECTORS.SUBMIT_BTN, handleSubmitClick);
    cleanupFunctions2.push(cleanup1, cleanup2, cleanup3, cleanup4);
  }
  function handleNextClick(event) {
    event.preventDefault();
    goToNextStep();
  }
  function handleBackClick(event) {
    event.preventDefault();
    goToPreviousStep();
  }
  function handleSkipClick(event) {
    event.preventDefault();
    const stepElement = getCurrentStep()?.element;
    if (stepElement) {
      const fields = Array.from(stepElement.querySelectorAll("input, select, textarea"));
      fields.forEach((field) => {
        if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")) {
          field.checked = false;
        } else {
          field.value = "";
        }
        if (field.name) {
          FormState.setField(field.name, null);
        }
      });
    }
    goToNextStep(true);
  }
  function handleSubmitClick(event) {
    const form = event.target.closest("form");
    if (!form) {
      logVerbose("Form not found, preventing submission");
      return;
    }
    const isFormValid = validateAllVisibleSteps();
    if (!isFormValid) {
      event.preventDefault();
      logVerbose("Form validation failed, preventing submission");
      return;
    }
    logVerbose("Form validation passed, allowing submission");
  }
  function validateStepElement(element) {
    const inputs = element.querySelectorAll("input[required], select[required], textarea[required]");
    for (const input of inputs) {
      const htmlInput = input;
      if (!isVisible(htmlInput)) continue;
      if (!htmlInput.value || htmlInput.value.trim() === "") {
        logVerbose("Validation failed: empty required field", {
          element: htmlInput,
          name: htmlInput.name,
          id: htmlInput.id
        });
        htmlInput.focus();
        return false;
      }
      if (htmlInput.type === "email" && htmlInput.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(htmlInput.value)) {
          logVerbose("Validation failed: invalid email format");
          htmlInput.focus();
          return false;
        }
      }
    }
    return true;
  }
  function goToStep(stepIndex) {
    logVerbose(`Attempting to go to step index: ${stepIndex}`);
    if (stepIndex < 0 || stepIndex >= steps.length) {
      logVerbose(`Invalid step index: ${stepIndex}`);
      return;
    }
    if (currentStepIndex !== -1 && currentStepIndex < steps.length) {
      hideStep(currentStepIndex);
    }
    showStep(stepIndex);
    currentStepIndex = stepIndex;
    const newStep = steps[stepIndex];
    FormState.setCurrentStep(newStep.id);
    updateNavigationButtons();
  }
  function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) {
      return;
    }
    const step = steps[stepIndex];
    showElement(step.element);
    FormState.setStepVisibility(step.id, true);
    stepItems.forEach((item) => {
      if (item.parentStepIndex === stepIndex && FormState.isStepVisible(item.id)) {
        showElement(item.element);
      }
    });
    logVerbose(`Showing step ${stepIndex} (${step.id})`);
  }
  function hideStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) {
      return;
    }
    const step = steps[stepIndex];
    hideElement(step.element);
    FormState.setStepVisibility(step.id, false);
    stepItems.forEach((item) => {
      if (item.parentStepIndex === stepIndex) {
        hideElement(item.element);
      }
    });
    logVerbose(`Hiding step ${stepIndex} (${step.id})`);
  }
  function goToNextStep(skipValidation = false) {
    const currentStep = getCurrentStep();
    if (!currentStep) {
      logVerbose("No current step found");
      return;
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      goToStep(nextIndex);
    } else {
      logVerbose("Already at last step");
    }
  }
  function goToPreviousStep() {
    const previousStepId = FormState.goToPreviousStep();
    if (previousStepId) {
      const previousIndex2 = findStepIndexById(previousStepId);
      if (previousIndex2 !== -1) {
        goToStep(previousIndex2);
        return;
      }
    }
    const previousIndex = currentStepIndex - 1;
    if (previousIndex >= 0) {
      goToStep(previousIndex);
    } else {
      logVerbose("Already at first step");
    }
  }
  function findStepIndexById(stepId) {
    return steps.findIndex((step) => step.id === stepId);
  }
  function getCurrentStep() {
    return steps[currentStepIndex] || null;
  }
  function updateNavigationButtons() {
    const nextBtn = document.querySelector(SELECTORS.NEXT_BTN);
    const backBtn = document.querySelector(SELECTORS.BACK_BTN);
    const submitBtn = document.querySelector(SELECTORS.SUBMIT_BTN);
    if (!nextBtn || !backBtn || !submitBtn) return;
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;
    backBtn.style.display = isFirstStep ? "none" : "";
    if (isLastStep) {
      nextBtn.style.display = "none";
      submitBtn.style.display = "";
    } else {
      nextBtn.style.display = "";
      submitBtn.style.display = "none";
    }
  }
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
  function getCurrentStepInfo() {
    const currentStep = getCurrentStep();
    return {
      step: currentStep,
      index: currentStepIndex,
      totalSteps: steps.length,
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === steps.length - 1
    };
  }
  function resetMultiStep() {
    cleanupFunctions2.forEach((cleanup) => cleanup());
    cleanupFunctions2 = [];
    steps = [];
    stepItems = [];
    currentStepIndex = 0;
    currentStepItemId = null;
    initialized2 = false;
    logVerbose("Multi-step module reset");
  }
  function getMultiStepState() {
    return {
      initialized: initialized2,
      currentStepIndex,
      totalSteps: steps.length,
      steps: steps.map((step) => ({
        id: step.id,
        index: step.index,
        visible: isVisible(step.element),
        type: step.type,
        subtype: step.subtype,
        number: step.number
      }))
    };
  }

  // modules/errors.ts
  var errorConfigs = /* @__PURE__ */ new Map();
  var errorStates = /* @__PURE__ */ new Map();
  function initErrors(root = document) {
    logVerbose("Initializing error handling");
    const inputs = root.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      const fieldName = input.name || getAttrValue(input, "data-step-field-name");
      if (fieldName) {
        errorConfigs.set(fieldName, {
          fieldName,
          element: input,
          customMessage: getAttrValue(input, "data-error-message") || void 0
        });
      }
    });
    logVerbose(`Error handling initialized for ${errorConfigs.size} fields`);
  }
  function showError(fieldName, message) {
    const config = errorConfigs.get(fieldName);
    if (!config) {
      logVerbose(`Cannot show error for unknown field: ${fieldName}`);
      return;
    }
    const errorMessage = message || config.customMessage || "This field has an error";
    logVerbose(`Showing error for field: ${fieldName}`, { message: errorMessage });
    addClass(config.element, CSS_CLASSES.ERROR_FIELD);
    const errorElement = findOrCreateErrorElement(config);
    if (errorElement) {
      errorElement.textContent = errorMessage;
      addClass(errorElement, CSS_CLASSES.ACTIVE_ERROR);
      config.errorElement = errorElement;
    }
    scrollToFieldIfNeeded(config.element);
  }
  function clearError(fieldName) {
    const config = errorConfigs.get(fieldName);
    if (!config) {
      logVerbose(`Cannot clear error for unknown field: ${fieldName}`);
      return;
    }
    logVerbose(`Clearing error for field: ${fieldName}`);
    removeClass(config.element, CSS_CLASSES.ERROR_FIELD);
    if (config.errorElement) {
      config.errorElement.textContent = "";
      removeClass(config.errorElement, CSS_CLASSES.ACTIVE_ERROR);
    }
  }
  function clearAllErrors() {
    logVerbose("Clearing all field errors");
    errorConfigs.forEach((config, fieldName) => {
      clearError(fieldName);
    });
  }
  function findOrCreateErrorElement(config) {
    if (!config || !config.element) {
      logVerbose("Cannot create error element - no config or element provided");
      return null;
    }
    if (!config.element.parentElement) {
      logVerbose(`Cannot create error element for field: ${config.fieldName} - no parent element`, {
        element: config.element,
        parentElement: config.element.parentElement,
        nodeName: config.element.nodeName,
        id: config.element.id
      });
      return null;
    }
    let errorElement = null;
    try {
      errorElement = config.element.parentElement.querySelector(
        `${SELECTORS.ERROR_DISPLAY}[data-field="${config.fieldName}"]`
      );
    } catch (error) {
      logVerbose(`Error finding existing error element for field: ${config.fieldName}`, error);
      return null;
    }
    if (!errorElement) {
      try {
        errorElement = document.createElement("div");
        errorElement.setAttribute("data-form", "error");
        errorElement.setAttribute("data-field", config.fieldName);
        const parent = config.element.parentElement;
        const nextSibling = config.element.nextSibling;
        if (nextSibling) {
          parent.insertBefore(errorElement, nextSibling);
        } else {
          parent.appendChild(errorElement);
        }
        logVerbose(`Created error element for field: ${config.fieldName}`);
      } catch (error) {
        logVerbose(`Error creating error element for field: ${config.fieldName}`, error);
        return null;
      }
    }
    return errorElement;
  }
  function scrollToFieldIfNeeded(element) {
    const rect = element.getBoundingClientRect();
    const isVisible2 = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    if (!isVisible2) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      logVerbose(`Scrolled to field with error: ${element.name || "unnamed"}`);
    }
  }
  function getErrorState() {
    const state = {};
    errorStates.forEach((value, key) => {
      state[key] = {
        message: value.message
      };
    });
    return state;
  }

  // modules/validation.ts
  var initialized3 = false;
  var cleanupFunctions3 = [];
  var fieldValidations = /* @__PURE__ */ new Map();
  function initValidation(root = document) {
    if (initialized3) {
      logVerbose("Validation already initialized, cleaning up first");
      resetValidation();
    }
    logVerbose("Initializing form validation");
    const formInputs = queryAllByAttr("input, select, textarea", root);
    logVerbose(`Found ${formInputs.length} form inputs`);
    setupFieldValidations(formInputs);
    setupValidationListeners(root);
    initialized3 = true;
    logVerbose("Validation initialization complete");
  }
  function setupFieldValidations(inputs) {
    inputs.forEach((input) => {
      if (!isFormInput(input)) return;
      const htmlInput = input;
      const fieldName = htmlInput.name || getAttrValue(input, "data-step-field-name");
      if (!fieldName) {
        logVerbose("Skipping field validation setup - no field name", {
          element: input,
          name: htmlInput.name,
          dataStepFieldName: getAttrValue(input, "data-step-field-name"),
          id: htmlInput.id,
          type: htmlInput.type
        });
        return;
      }
      const rules = extractValidationRules(input);
      if (rules.length === 0) {
        logVerbose(`No validation rules found for field: ${fieldName}`);
        return;
      }
      fieldValidations.set(fieldName, {
        element: input,
        rules,
        isValid: true
      });
      logVerbose(`Validation rules set for field: ${fieldName}`, {
        rules: rules.map((r) => r.type),
        rulesCount: rules.length
      });
    });
  }
  function extractValidationRules(input) {
    const rules = [];
    if (input.hasAttribute("required")) {
      rules.push({
        type: "required",
        message: getAttrValue(input, "data-error-message") || "This field is required"
      });
    }
    if (input instanceof HTMLInputElement && input.type === "email") {
      rules.push({
        type: "email",
        message: "Please enter a valid email address"
      });
    }
    if (input instanceof HTMLInputElement && input.type === "tel") {
      rules.push({
        type: "phone",
        message: "Please enter a valid phone number"
      });
    }
    const minLength = getAttrValue(input, "minlength");
    if (minLength) {
      rules.push({
        type: "min",
        value: parseInt(minLength),
        message: `Minimum ${minLength} characters required`
      });
    }
    const maxLength = getAttrValue(input, "maxlength");
    if (maxLength) {
      rules.push({
        type: "max",
        value: parseInt(maxLength),
        message: `Maximum ${maxLength} characters allowed`
      });
    }
    const pattern = getAttrValue(input, "pattern");
    if (pattern) {
      rules.push({
        type: "pattern",
        value: new RegExp(pattern),
        message: "Please enter a valid format"
      });
    }
    return rules;
  }
  function setupValidationListeners(root) {
    const debouncedValidation = debounce((...args) => {
      handleFieldValidation(args[0], args[1]);
    }, DEFAULTS.VALIDATION_DELAY);
    const cleanup1 = delegateEvent(
      root,
      "input",
      "input, select, textarea",
      debouncedValidation
    );
    const cleanup2 = delegateEvent(
      root,
      "blur",
      "input, select, textarea",
      handleFieldValidation
    );
    const cleanup3 = delegateEvent(
      root,
      "change",
      "input, select, textarea",
      handleFieldValidation
    );
    cleanupFunctions3.push(cleanup1, cleanup2, cleanup3);
  }
  function handleFieldValidation(event, target) {
    if (!isFormInput(target)) return;
    const htmlTarget = target;
    const fieldName = htmlTarget.name || getAttrValue(target, "data-step-field-name");
    if (!fieldName) {
      logVerbose("Skipping validation - no field name found", {
        element: target,
        name: htmlTarget.name,
        dataStepFieldName: getAttrValue(target, "data-step-field-name")
      });
      return;
    }
    const stepElement = target.closest(SELECTORS.STEP);
    if (stepElement) {
      const stepId = getAttrValue(stepElement, "data-answer");
      if (stepId && !FormState.isStepVisible(stepId)) {
        logVerbose(`Skipping validation for field in hidden step: ${fieldName}`);
        return;
      }
    }
    validateField(fieldName);
  }
  function validateField(fieldName) {
    const fieldValidation = fieldValidations.get(fieldName);
    if (!fieldValidation) {
      logVerbose(`No validation rules found for field: ${fieldName}`);
      return true;
    }
    const input = fieldValidation.element;
    if (!input) {
      logVerbose(`No element found for field: ${fieldName}`);
      return true;
    }
    const value = getInputValue(input);
    logVerbose(`Validating field: ${fieldName}`, { value, elementExists: !!input });
    for (const rule of fieldValidation.rules) {
      const { isValid, message } = validateRule(value, rule);
      if (!isValid) {
        fieldValidation.isValid = false;
        fieldValidation.errorMessage = message || "Invalid field";
        showError(fieldName, fieldValidation.errorMessage);
        updateFieldVisualState(input, false, fieldValidation.errorMessage);
        return false;
      }
    }
    fieldValidation.isValid = true;
    clearError(fieldName);
    updateFieldVisualState(input, true);
    return true;
  }
  function validateRule(value, rule) {
    switch (rule.type) {
      case "required":
        return {
          isValid: Array.isArray(value) ? value.length > 0 : !!value,
          message: rule.message
        };
      case "email":
        return {
          isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
          message: rule.message
        };
      case "phone":
        return {
          isValid: /^\d{10}$/.test(String(value)),
          message: rule.message
        };
      case "min":
        if (typeof rule.value !== "number") return { isValid: true };
        return {
          isValid: String(value).length >= rule.value,
          message: rule.message
        };
      case "max":
        if (typeof rule.value !== "number") return { isValid: true };
        return {
          isValid: String(value).length <= rule.value,
          message: rule.message
        };
      case "pattern":
        if (!(rule.value instanceof RegExp)) return { isValid: true };
        return {
          isValid: rule.value.test(String(value)),
          message: rule.message
        };
      case "custom":
        if (!rule.validator) return { isValid: true };
        return {
          isValid: rule.validator(value),
          message: rule.message
        };
      default:
        return { isValid: true };
    }
  }
  function updateFieldVisualState(input, isValid, errorMessage) {
    const fieldName = input.name || getAttrValue(input, "data-step-field-name");
    if (!fieldName) return;
    if (!isValid) {
      showError(fieldName, errorMessage);
    } else {
      clearError(fieldName);
    }
  }
  function validateStep(stepId) {
    const stepElement = queryByAttr(`[data-answer="${stepId}"]`);
    if (!stepElement) {
      logVerbose(`Step not found with data-answer="${stepId}"`);
      return true;
    }
    if (!FormState.isStepVisible(stepId)) {
      logVerbose(`Skipping validation for hidden step: ${stepId}`);
      return true;
    }
    logVerbose(`Validating step: ${stepId}`);
    const inputs = stepElement.querySelectorAll("input, select, textarea");
    let isStepValid = true;
    inputs.forEach((input) => {
      if (!isFormInput(input)) return;
      const fieldName = input.name || getAttrValue(input, "data-step-field-name");
      if (fieldName) {
        const isFieldValid = validateField(fieldName);
        if (!isFieldValid) {
          isStepValid = false;
        }
      }
    });
    logVerbose(`Step validation result: ${stepId}`, { isValid: isStepValid });
    return isStepValid;
  }
  function validateAllVisibleFields() {
    logVerbose("Validating all visible fields");
    let allValid = true;
    const validationResults = {};
    for (const [fieldName, fieldValidation] of fieldValidations) {
      const stepElement = fieldValidation.element.closest(SELECTORS.STEP);
      let shouldValidate = true;
      if (stepElement) {
        const stepId = getAttrValue(stepElement, "data-answer");
        if (stepId && !FormState.isStepVisible(stepId)) {
          shouldValidate = false;
        }
      }
      if (shouldValidate) {
        const isValid = validateField(fieldName);
        validationResults[fieldName] = isValid;
        if (!isValid) {
          allValid = false;
        }
      }
    }
    logVerbose("All visible fields validation complete", {
      allValid,
      results: validationResults
    });
    return allValid;
  }
  function clearFieldValidation(fieldName) {
    const fieldValidation = fieldValidations.get(fieldName);
    if (!fieldValidation) return;
    fieldValidation.isValid = true;
    fieldValidation.errorMessage = void 0;
    updateFieldVisualState(fieldValidation.element, true);
    logVerbose(`Cleared validation for field: ${fieldName}`);
  }
  function clearAllValidation() {
    logVerbose("Clearing all field validation");
    fieldValidations.forEach((validation, fieldName) => {
      clearFieldValidation(fieldName);
    });
  }
  function getValidationState() {
    return {
      initialized: initialized3,
      fieldValidations: Array.from(fieldValidations.entries()).reduce((acc, [key, value]) => {
        acc[key] = {
          isValid: value.isValid,
          errorMessage: value.errorMessage,
          rules: value.rules.map((r) => r.type)
        };
        return acc;
      }, {})
    };
  }
  function resetValidation() {
    logVerbose("Resetting validation");
    cleanupFunctions3.forEach((cleanup) => cleanup());
    cleanupFunctions3 = [];
    clearAllValidation();
    fieldValidations.clear();
    initialized3 = false;
    logVerbose("Validation reset complete");
  }

  // modules/summary.ts
  var initialized4 = false;
  var cleanupFunctions4 = [];
  var summaryFields = [];
  function initSummary(root = document) {
    if (initialized4) {
      logVerbose("Summary already initialized, cleaning up first");
      resetSummary();
    }
    logVerbose("Initializing summary functionality");
    const summaryElements = queryAllByAttr(SELECTORS.SUMMARY_FIELD, root);
    logVerbose(`Found ${summaryElements.length} summary fields`);
    setupSummaryFields(summaryElements);
    setupSummaryListeners(root);
    updateAllSummaries();
    initialized4 = true;
    logVerbose("Summary initialization complete");
  }
  function setupSummaryFields(summaryElements) {
    summaryElements.forEach((element) => {
      const summaryFieldAttr = getAttrValue(element, "data-summary-field");
      if (!summaryFieldAttr) return;
      const fieldNames = summaryFieldAttr.split("|").map((name) => name.trim());
      const joinAttr = getAttrValue(element, "data-join");
      const joinType = joinAttr && joinAttr in DEFAULTS.JOIN_SEPARATOR ? joinAttr : "space";
      const type = getAttrValue(element, "data-summary-type") || void 0;
      const subtype = getAttrValue(element, "data-summary-subtype") || void 0;
      const number = getAttrValue(element, "data-summary-number") || void 0;
      const summaryField = {
        element,
        fieldNames,
        joinType,
        type,
        subtype,
        number
      };
      summaryFields.push(summaryField);
      logVerbose("Summary field configured", {
        fieldNames,
        joinType,
        type,
        subtype,
        number
      });
    });
  }
  function setupSummaryListeners(root) {
    const cleanup1 = delegateEvent(
      root,
      "input",
      SELECTORS.STEP_FIELD_NAME,
      handleFieldChange
    );
    const cleanup2 = delegateEvent(
      root,
      "change",
      SELECTORS.STEP_FIELD_NAME,
      handleFieldChange
    );
    const cleanup3 = delegateEvent(
      root,
      "blur",
      SELECTORS.STEP_FIELD_NAME,
      handleFieldChange
    );
    cleanupFunctions4.push(cleanup1, cleanup2, cleanup3);
  }
  function handleFieldChange(event, target) {
    if (!isFormInput(target)) return;
    const fieldName = getAttrValue(target, "data-step-field-name");
    if (!fieldName) return;
    const value = getInputValue(target);
    logVerbose(`Summary field changed: ${fieldName}`, { value });
    FormState.setField(fieldName, value);
    updateSummariesForField(fieldName);
  }
  function updateSummariesForField(fieldName) {
    summaryFields.forEach((summaryField) => {
      if (summaryField.fieldNames.includes(fieldName)) {
        updateSummaryField(summaryField);
      }
    });
  }
  function updateSummary() {
    logVerbose("Updating all summaries");
    updateAllSummaries();
  }
  function updateAllSummaries() {
    summaryFields.forEach((summaryField) => {
      updateSummaryField(summaryField);
    });
  }
  function updateSummaryField(summaryField) {
    const values = [];
    summaryField.fieldNames.forEach((fieldName) => {
      const value = FormState.getField(fieldName);
      if (value !== null && value !== void 0 && value !== "") {
        if (Array.isArray(value)) {
          values.push(...value.filter((v) => v !== ""));
        } else {
          values.push(String(value));
        }
      }
    });
    const joinedValue = joinValues(values, summaryField.joinType);
    updateSummaryElement(summaryField.element, joinedValue);
    logVerbose(`Summary field updated`, {
      fieldNames: summaryField.fieldNames,
      values,
      joinType: summaryField.joinType,
      result: joinedValue
    });
  }
  function joinValues(values, joinType) {
    if (values.length === 0) return "";
    const separator = DEFAULTS.JOIN_SEPARATOR[joinType];
    return values.join(separator);
  }
  function updateSummaryElement(element, value) {
    element.textContent = value;
    if (value === "") {
      element.classList.add("summary-empty");
      element.classList.remove("summary-filled");
    } else {
      element.classList.remove("summary-empty");
      element.classList.add("summary-filled");
    }
  }
  function clearSummary(fieldNames) {
    if (fieldNames) {
      logVerbose("Clearing specific summary fields", fieldNames);
      FormState.clearFields(fieldNames);
      fieldNames.forEach((fieldName) => {
        updateSummariesForField(fieldName);
      });
    } else {
      logVerbose("Clearing all summaries");
      FormState.clear();
      updateAllSummaries();
    }
  }
  function getSummaryState() {
    const state = {};
    summaryFields.forEach((summaryField, index) => {
      const key = summaryField.type && summaryField.subtype && summaryField.number ? `${summaryField.type}-${summaryField.subtype}-${summaryField.number}` : `summary-${index}`;
      state[key] = {
        hasContent: (summaryField.element.textContent || "").trim().length > 0
      };
    });
    return state;
  }
  function resetSummary() {
    logVerbose("Resetting summary functionality");
    cleanupFunctions4.forEach((cleanup) => cleanup());
    cleanupFunctions4 = [];
    summaryFields.forEach((summaryField) => {
      updateSummaryElement(summaryField.element, "");
    });
    summaryFields = [];
    initialized4 = false;
    logVerbose("Summary reset complete");
  }

  // index.ts
  var FormLibrary = class _FormLibrary {
    constructor() {
      this.initialized = false;
      this.rootElement = document;
      logVerbose("FormLibrary instance created");
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
      if (!_FormLibrary.instance) {
        _FormLibrary.instance = new _FormLibrary();
      }
      return _FormLibrary.instance;
    }
    /**
     * Initialize the form library
     */
    init(root = document) {
      if (this.initialized) {
        logVerbose("FormLibrary already initialized, reinitializing...");
        this.destroy();
      }
      this.rootElement = root;
      logVerbose("Initializing FormLibrary", {
        root: root === document ? "document" : "custom element"
      });
      const multistepForms = root.querySelectorAll(SELECTORS.MULTISTEP);
      const logicForms = root.querySelectorAll(SELECTORS.LOGIC);
      const stepElements = root.querySelectorAll(SELECTORS.STEP);
      logVerbose("Form detection results", {
        multistepForms: multistepForms.length,
        logicForms: logicForms.length,
        stepElements: stepElements.length
      });
      if (multistepForms.length === 0 && stepElements.length === 0) {
        logVerbose("No compatible forms found, library will not initialize");
        return;
      }
      try {
        initErrors(root);
        initValidation(root);
        if (logicForms.length > 0) {
          initBranching(root);
        }
        if (multistepForms.length > 0 || stepElements.length > 0) {
          initMultiStep(root);
        }
        initSummary(root);
        this.initialized = true;
        logVerbose("FormLibrary initialization complete");
        this.logCurrentState();
      } catch (error) {
        logVerbose("FormLibrary initialization failed", error);
        throw error;
      }
    }
    /**
     * Destroy and cleanup the form library
     */
    destroy() {
      if (!this.initialized) {
        logVerbose("FormLibrary not initialized, nothing to destroy");
        return;
      }
      logVerbose("Destroying FormLibrary");
      try {
        resetBranching();
      } catch (error) {
        logVerbose("Error during FormLibrary destruction", error);
      }
      FormState.clear();
      this.initialized = false;
      logVerbose("FormLibrary destruction complete");
    }
    /**
     * Check if library is initialized
     */
    isInitialized() {
      return this.initialized;
    }
    /**
     * Get current form state for debugging
     */
    getState() {
      return {
        initialized: this.initialized,
        formState: FormState.getDebugInfo(),
        branching: getBranchingState(),
        multiStep: getMultiStepState(),
        validation: getValidationState(),
        errors: getErrorState(),
        summary: getSummaryState()
      };
    }
    /**
     * Log current state to console
     */
    logCurrentState() {
      const state = this.getState();
      logVerbose("Current FormLibrary State", state);
    }
    /**
     * Validate entire form
     */
    validateForm() {
      if (!this.initialized) {
        logVerbose("Cannot validate form - library not initialized");
        return false;
      }
      logVerbose("Validating entire form");
      const isValid = validateAllVisibleFields();
      logVerbose("Form validation result", { isValid });
      return isValid;
    }
    /**
     * Reset form to initial state
     */
    resetForm() {
      if (!this.initialized) {
        logVerbose("Cannot reset form - library not initialized");
        return;
      }
      logVerbose("Resetting form to initial state");
      clearAllErrors();
      FormState.clear();
      clearSummary();
      try {
        goToStep(0);
      } catch (error) {
        logVerbose("Could not go to first step during reset", error);
      }
      logVerbose("Form reset complete");
    }
    /**
     * Get form data
     */
    getFormData() {
      return FormState.getAll();
    }
    /**
     * Set form data
     */
    setFormData(data) {
      Object.entries(data).forEach(([key, value]) => {
        FormState.setField(key, value);
      });
      updateSummary();
      logVerbose("Form data set", data);
    }
  };
  var FormLib = FormLibrary.getInstance();
  var index_default = FormLib;
  if (typeof window !== "undefined") {
    const autoInit = () => {
      const multistepForms = document.querySelectorAll(SELECTORS.MULTISTEP);
      const stepElements = document.querySelectorAll(SELECTORS.STEP);
      if (multistepForms.length > 0 || stepElements.length > 0) {
        logVerbose("Auto-initializing FormLibrary on DOM ready");
        FormLib.init();
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoInit);
    } else {
      autoInit();
    }
  }
  if (typeof window !== "undefined") {
    window.FormLib = FormLib;
    logVerbose("FormLib attached to window for debugging");
  }
  return __toCommonJS(index_exports);
})();
