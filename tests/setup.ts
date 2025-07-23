/**
 * Jest test setup file
 * Configures DOM environment and global utilities for testing
 */

// Mock DOM environment for testing
import 'jest-environment-jsdom';

// Global test utilities
declare global {
  interface Window {
    FormLib?: any;
    Webflow?: {
      push: (fn: () => void) => void;
    };
  }
}

// Mock Webflow object for testing
Object.defineProperty(window, 'Webflow', {
  value: {
    push: jest.fn((callback: () => void) => callback())
  },
  writable: true
});

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset Webflow mock
  (window.Webflow!.push as jest.Mock).mockClear();
  
  // Suppress console output in tests unless explicitly needed
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Clean up any timers or async operations
  jest.clearAllTimers();
  jest.clearAllMocks();
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Utility function to create DOM elements for testing
export function createTestForm(html: string): HTMLFormElement {
  const form = document.createElement('form');
  form.innerHTML = html;
  document.body.appendChild(form);
  return form;
}

// Utility function to create multi-step form structure
export function createMultiStepForm(): HTMLFormElement {
  return createTestForm(`
    <form data-form="multistep" data-logic="true">
      <div data-form="step" class="multi-form_step">
        <div data-answer="step-1" class="step_wrapper">
          <input type="text" name="firstName" data-step-field-name="firstName" required>
          <input type="text" name="lastName" data-step-field-name="lastName" required>
        </div>
      </div>
      
      <div data-form="step" class="multi-form_step">
        <div data-answer="step-2" class="step_wrapper">
          <input type="email" name="email" data-step-field-name="email" required>
          <select name="role" data-step-field-name="role" data-go-to="step-3">
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>
      </div>
      
      <div data-form="step" class="multi-form_step">
        <div data-answer="step-3" class="step_wrapper">
          <textarea name="notes" data-step-field-name="notes"></textarea>
        </div>
      </div>
      
      <button type="button" data-form="back-btn">Back</button>
      <button type="button" data-form="next-btn">Next</button>
      <button type="submit" data-form="submit">Submit</button>
    </form>
  `);
}

// Utility to wait for async operations
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 