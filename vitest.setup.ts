// @CODE:AUTH-TEST-SETUP | Chain: SPEC-AUTH-001 -> TEST-AUTH-001
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage with length property
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
});

// Mock fetch globally with proper Promise return
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({}),
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  } as Response)
);

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
