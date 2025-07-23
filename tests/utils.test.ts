/**
 * Tests for utils module
 */

import { 
  logVerbose, 
  queryByAttr, 
  queryAllByAttr, 
  getAttrValue, 
  isVisible, 
  showElement, 
  hideElement 
} from '../modules/utils';
import { createTestForm } from './setup';

describe('Utils', () => {
  describe('DOM Query Functions', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-test="single" data-value="test-value">Single Element</div>
        <div data-test="multiple" data-value="value1">Multiple 1</div>
        <div data-test="multiple" data-value="value2">Multiple 2</div>
        <div data-other="different">Different Attribute</div>
      `;
    });

    describe('queryByAttr', () => {
      it('should find single element by attribute', () => {
        const element = queryByAttr('[data-test="single"]');
        expect(element).toBeTruthy();
        expect(element?.textContent).toBe('Single Element');
      });

      it('should return null for non-existent elements', () => {
        const element = queryByAttr('[data-nonexistent]');
        expect(element).toBeNull();
      });

      it('should find first element when multiple matches exist', () => {
        const element = queryByAttr('[data-test="multiple"]');
        expect(element).toBeTruthy();
        expect(element?.textContent).toBe('Multiple 1');
      });
    });

    describe('queryAllByAttr', () => {
      it('should find all matching elements', () => {
        const elements = queryAllByAttr('[data-test="multiple"]');
        expect(elements).toHaveLength(2);
        expect(elements[0].textContent).toBe('Multiple 1');
        expect(elements[1].textContent).toBe('Multiple 2');
      });

      it('should return empty array for non-existent elements', () => {
        const elements = queryAllByAttr('[data-nonexistent]');
        expect(elements).toHaveLength(0);
      });

      it('should find all elements with attribute regardless of value', () => {
        const elements = queryAllByAttr('[data-test]');
        expect(elements).toHaveLength(3); // single + multiple + multiple
      });
    });

    describe('getAttrValue', () => {
      it('should get attribute value from element', () => {
        const element = queryByAttr('[data-test="single"]');
        const value = getAttrValue(element!, 'data-value');
        expect(value).toBe('test-value');
      });

      it('should return empty string for non-existent attribute', () => {
        const element = queryByAttr('[data-test="single"]');
        const value = getAttrValue(element!, 'data-nonexistent');
        expect(value).toBe('');
      });

      it('should handle null element gracefully', () => {
        const value = getAttrValue(null as any, 'data-test');
        expect(value).toBe('');
      });
    });
  });

  describe('Element Visibility Functions', () => {
    let testElement: HTMLElement;

    beforeEach(() => {
      testElement = document.createElement('div');
      testElement.textContent = 'Test Element';
      document.body.appendChild(testElement);
    });

    describe('isVisible', () => {
      it('should return true for visible element', () => {
        expect(isVisible(testElement)).toBe(true);
      });

      it('should return false for element with display: none', () => {
        testElement.style.display = 'none';
        expect(isVisible(testElement)).toBe(false);
      });

      it('should return false for element with visibility: hidden', () => {
        testElement.style.visibility = 'hidden';
        expect(isVisible(testElement)).toBe(false);
      });

      it('should return false for element with opacity: 0', () => {
        testElement.style.opacity = '0';
        expect(isVisible(testElement)).toBe(false);
      });
    });

    describe('showElement', () => {
      it('should make hidden element visible', () => {
        testElement.style.display = 'none';
        showElement(testElement);
        expect(testElement.style.display).toBe('block');
      });

      it('should not change already visible element', () => {
        showElement(testElement);
        expect(testElement.style.display).toBe('block');
      });
    });

    describe('hideElement', () => {
      it('should hide visible element', () => {
        hideElement(testElement);
        expect(testElement.style.display).toBe('none');
      });

      it('should keep hidden element hidden', () => {
        testElement.style.display = 'none';
        hideElement(testElement);
        expect(testElement.style.display).toBe('none');
      });
    });
  });

  describe('logVerbose', () => {
    it('should not throw when called', () => {
      expect(() => {
        logVerbose('Test message');
        logVerbose('Test with data', { key: 'value' });
      }).not.toThrow();
    });
  });
}); 