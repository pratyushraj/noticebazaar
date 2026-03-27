import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });

  it('should handle async', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});
