/**
 * Tests for FormState module
 */

import { FormState } from '../modules/formState';

describe('FormState', () => {
  beforeEach(() => {
    FormState.clear();
  });

  describe('setField and getField', () => {
    it('should set and get field values correctly', () => {
      FormState.setField('testField', 'testValue');
      expect(FormState.getField('testField')).toBe('testValue');
    });

    it('should handle different data types', () => {
      FormState.setField('string', 'hello');
      FormState.setField('number', 42);
      FormState.setField('boolean', true);
      FormState.setField('object', { key: 'value' });

      expect(FormState.getField('string')).toBe('hello');
      expect(FormState.getField('number')).toBe(42);
      expect(FormState.getField('boolean')).toBe(true);
      expect(FormState.getField('object')).toEqual({ key: 'value' });
    });

    it('should return undefined for non-existent fields', () => {
      expect(FormState.getField('nonExistent')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all form data', () => {
      FormState.setField('field1', 'value1');
      FormState.setField('field2', 'value2');

      const allData = FormState.getAll();
      expect(allData).toEqual({
        field1: 'value1',
        field2: 'value2'
      });
    });

    it('should return a copy of the data, not the original', () => {
      FormState.setField('test', 'original');
      const allData = FormState.getAll();
      
      allData.test = 'modified';
      expect(FormState.getField('test')).toBe('original');
    });
  });

  describe('clear', () => {
    it('should clear all form data', () => {
      FormState.setField('field1', 'value1');
      FormState.setField('field2', 'value2');

      FormState.clear();

      expect(FormState.getAll()).toEqual({});
      expect(FormState.getField('field1')).toBeUndefined();
    });
  });

  describe('clearFields', () => {
    it('should clear only specified fields', () => {
      FormState.setField('keep1', 'value1');
      FormState.setField('clear1', 'value2');
      FormState.setField('keep2', 'value3');
      FormState.setField('clear2', 'value4');

      FormState.clearFields(['clear1', 'clear2']);

      expect(FormState.getField('keep1')).toBe('value1');
      expect(FormState.getField('keep2')).toBe('value3');
      expect(FormState.getField('clear1')).toBeUndefined();
      expect(FormState.getField('clear2')).toBeUndefined();
    });

    it('should handle non-existent field names gracefully', () => {
      FormState.setField('existing', 'value');
      
      expect(() => {
        FormState.clearFields(['existing', 'nonExistent']);
      }).not.toThrow();

      expect(FormState.getField('existing')).toBeUndefined();
    });
  });

  describe('getDebugInfo', () => {
    it('should return debug information', () => {
      FormState.setField('test1', 'value1');
      FormState.setField('test2', 'value2');

      const debugInfo = FormState.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('data');
      expect(debugInfo).toHaveProperty('fieldCount');
      expect(debugInfo.fieldCount).toBe(2);
      expect(debugInfo.data).toEqual({
        test1: 'value1',
        test2: 'value2'
      });
    });
  });
}); 