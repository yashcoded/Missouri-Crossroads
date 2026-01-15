// Minimal ambient module to satisfy TypeScript when @jest/globals types are not picked up.
// Prefer installing @types/jest; this file is a small fallback.

declare module '@jest/globals' {
  export const describe: any;
  export const it: any;
  export const test: any;
  export const expect: any;
  export const beforeAll: any;
  export const beforeEach: any;
  export const afterAll: any;
  export const afterEach: any;
}
