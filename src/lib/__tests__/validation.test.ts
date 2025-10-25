import { describe, it, expect } from 'vitest'
import { validateField, validateForm, commonRules } from '@/lib/validation'

describe('Validation Utils', () => {
  describe('validateField', () => {
    it('should validate required fields', () => {
      expect(validateField('', { required: true }, 'Name')).toBe('Name is required')
      expect(validateField('   ', { required: true }, 'Name')).toBe('Name is required')
      expect(validateField('John', { required: true }, 'Name')).toBeNull()
    })

    it('should validate email format', () => {
      expect(validateField('invalid-email', { email: true }, 'Email')).toBe('Email must be a valid email address')
      expect(validateField('user@example.com', { email: true }, 'Email')).toBeNull()
    })

    it('should validate string length', () => {
      expect(validateField('ab', { minLength: 3 }, 'Name')).toBe('Name must be at least 3 characters')
      expect(validateField('abc', { minLength: 3 }, 'Name')).toBeNull()
      expect(validateField('abcdefghij', { maxLength: 5 }, 'Name')).toBe('Name must be no more than 5 characters')
      expect(validateField('abcde', { maxLength: 5 }, 'Name')).toBeNull()
    })

    it('should validate numbers', () => {
      expect(validateField('abc', { number: true }, 'Age')).toBe('Age must be a valid number')
      expect(validateField('25', { number: true }, 'Age')).toBeNull()
      expect(validateField('5', { min: 10 }, 'Age')).toBe('Age must be at least 10')
      expect(validateField('15', { min: 10 }, 'Age')).toBeNull()
      expect(validateField('25', { max: 20 }, 'Age')).toBe('Age must be no more than 20')
      expect(validateField('15', { max: 20 }, 'Age')).toBeNull()
    })

    it('should validate dates', () => {
      expect(validateField('invalid-date', { date: true }, 'Date')).toBe('Date must be a valid date')
      expect(validateField('2023-12-01', { date: true }, 'Date')).toBeNull()
    })

    it('should validate URLs', () => {
      expect(validateField('not-a-url', { url: true }, 'URL')).toBe('URL must be a valid URL')
      expect(validateField('https://example.com', { url: true }, 'URL')).toBeNull()
    })

    it('should validate custom patterns', () => {
      const phonePattern = /^[\+]?[1-9][\d]{0,15}$/
      expect(validateField('abc', { pattern: phonePattern }, 'Phone')).toBe('Phone format is invalid')
      expect(validateField('+1234567890', { pattern: phonePattern }, 'Phone')).toBeNull()
    })

    it('should validate custom functions', () => {
      const customValidator = (value: string) => {
        if (value.includes('test')) return 'Value cannot contain "test"'
        return null
      }
      expect(validateField('hello test', { custom: customValidator }, 'Value')).toBe('Value cannot contain "test"')
      expect(validateField('hello world', { custom: customValidator }, 'Value')).toBeNull()
    })
  })

  describe('validateForm', () => {
    it('should validate multiple fields', () => {
      const data = {
        name: '',
        email: 'invalid-email',
        age: 'abc'
      }
      const rules = {
        name: { required: true },
        email: { required: true, email: true },
        age: { required: true, number: true }
      }
      
      const errors = validateForm(data, rules)
      
      expect(errors).toEqual({
        name: 'name is required',
        email: 'email must be a valid email address',
        age: 'age must be a valid number'
      })
    })

    it('should return empty errors for valid data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: '25'
      }
      const rules = {
        name: { required: true },
        email: { required: true, email: true },
        age: { required: true, number: true }
      }
      
      const errors = validateForm(data, rules)
      
      expect(errors).toEqual({})
    })
  })

  describe('commonRules', () => {
    it('should have correct validation rules', () => {
      expect(commonRules.required).toEqual({ required: true })
      expect(commonRules.email).toEqual({ required: true, email: true })
      expect(commonRules.password).toEqual({ required: true, minLength: 8 })
      expect(commonRules.positiveNumber).toEqual({ required: true, number: true, min: 0 })
      expect(commonRules.currency).toEqual({ required: true, number: true, min: 0 })
      expect(commonRules.date).toEqual({ required: true, date: true })
    })
  })
})
