import { expect } from "@playwright/test"
import { describe, test } from "@jest/globals"

describe('Basic Tests', () => {
  test('should pass basic math', () => {
    expect(2 + 2).toBe(4)
  })

  test('should handle string operations', () => {
    expect('Hello'.toLowerCase()).toBe('hello')
  })

  test('should work with arrays', () => {
    const arr = [1, 2, 3]
    expect(arr.length).toBe(3)
    expect(arr.includes(2)).toBe(true)
  })
})
