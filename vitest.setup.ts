import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

const nativeGetComputedStyle = window.getComputedStyle.bind(window);

window.getComputedStyle = ((element: Element, pseudoElt?: string) => {
  return nativeGetComputedStyle(
    element,
    pseudoElt ? undefined : pseudoElt,
  );
}) as typeof window.getComputedStyle;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock;

HTMLElement.prototype.scrollIntoView = vi.fn();
