import '@testing-library/jest-dom'

// Node.js v25 exposes a native `localStorage` that is broken without
// a `--localstorage-file` flag.  Override it with an in-memory
// implementation so tests that rely on localStorage work correctly.
const createInMemoryStorage = (): Storage => {
  const store: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(store).length
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null
    },
    getItem(key: string) {
      return key in store ? store[key] : null
    },
    setItem(key: string, value: string) {
      store[key] = String(value)
    },
    removeItem(key: string) {
      delete store[key]
    },
    clear() {
      Object.keys(store).forEach(k => delete store[k])
    },
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: createInMemoryStorage(),
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, 'sessionStorage', {
  value: createInMemoryStorage(),
  writable: true,
  configurable: true,
})
