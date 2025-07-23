/**
 * Integration tests for the complete form library system
 */

import FormLib from '../index';
import { createMultiStepForm, waitFor } from './setup';

describe('Form Library Integration', () => {
  beforeEach(() => {
    // Reset the library state
    if (FormLib.isInitialized()) {
      FormLib.destroy();
    }
  });

  afterEach(() => {
    if (FormLib.isInitialized()) {
      FormLib.destroy();
    }
  });

  describe('Library Initialization', () => {
    it('should initialize successfully with a multi-step form', () => {
      const form = createMultiStepForm();
      
      // Initialize the library
      FormLib.init();
      
      expect(FormLib.isInitialized()).toBe(true);
    });

    it('should not initialize without compatible forms', () => {
      // Create a form without required attributes
      const form = document.createElement('form');
      form.innerHTML = '<input type="text" name="test">';
      document.body.appendChild(form);
      
      FormLib.init();
      
      expect(FormLib.isInitialized()).toBe(false);
    });

    it('should provide access to state and debugging functions', () => {
      const form = createMultiStepForm();
      FormLib.init();
      
      // Check that debugging functions are available
      expect(typeof FormLib.getState).toBe('function');
      expect(typeof FormLib.getFormData).toBe('function');
      expect(typeof FormLib.validateForm).toBe('function');
      expect(typeof FormLib.resetForm).toBe('function');
      
      const state = FormLib.getState();
      expect(state).toHaveProperty('initialized');
      expect(state.initialized).toBe(true);
    });
  });

  describe('Form Data Management', () => {
    it('should handle form data operations', () => {
      const form = createMultiStepForm();
      FormLib.init();
      
      // Set some form data
      FormLib.setFormData({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      });
      
      // Get form data back
      const formData = FormLib.getFormData();
      expect(formData).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      });
    });

    it('should reset form data correctly', () => {
      const form = createMultiStepForm();
      FormLib.init();
      
      FormLib.setFormData({ test: 'value' });
      expect(FormLib.getFormData()).toEqual({ test: 'value' });
      
      FormLib.resetForm();
      expect(FormLib.getFormData()).toEqual({});
    });
  });

  describe('Module Integration', () => {
    it('should have all required modules integrated', () => {
      const form = createMultiStepForm();
      FormLib.init();
      
      const state = FormLib.getState();
      
      // Check that all expected module states are present
      expect(state).toHaveProperty('formState');
      expect(state).toHaveProperty('validation');
      expect(state).toHaveProperty('errors');
      expect(state).toHaveProperty('summary');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', () => {
      // Create malformed form structure
      const form = document.createElement('form');
      form.setAttribute('data-form', 'multistep');
      form.innerHTML = '<div>No proper step structure</div>';
      document.body.appendChild(form);
      
      expect(() => {
        FormLib.init();
      }).not.toThrow();
    });

    it('should handle multiple initialization calls', () => {
      const form = createMultiStepForm();
      
      expect(() => {
        FormLib.init();
        FormLib.init(); // Second call should not throw
      }).not.toThrow();
      
      expect(FormLib.isInitialized()).toBe(true);
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should properly cleanup when destroyed', () => {
      const form = createMultiStepForm();
      FormLib.init();
      
      expect(FormLib.isInitialized()).toBe(true);
      
      FormLib.destroy();
      
      expect(FormLib.isInitialized()).toBe(false);
      expect(FormLib.getFormData()).toEqual({});
    });
  });
}); 