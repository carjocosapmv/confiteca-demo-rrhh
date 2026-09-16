import { describe, it, expect, vi, afterEach } from 'vitest';
import { waitForElement } from './waitForElement';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('waitForElement', () => {
  it('resolves immediately when the element already exists', async () => {
    document.body.innerHTML = '<div data-tour="chrome:sidebar-trigger">x</div>';

    const el = await waitForElement('[data-tour="chrome:sidebar-trigger"]');

    expect(el).toBeInstanceOf(HTMLElement);
    expect(el?.getAttribute('data-tour')).toBe('chrome:sidebar-trigger');
  });

  it('resolves once the element is added to the DOM later', async () => {
    const pending = waitForElement('[data-tour="nav:/rotacion"]', { timeoutMs: 1000 });

    setTimeout(() => {
      const node = document.createElement('a');
      node.setAttribute('data-tour', 'nav:/rotacion');
      document.body.appendChild(node);
    }, 10);

    const el = await pending;
    expect(el).not.toBeNull();
    expect(el?.tagName).toBe('A');
  });

  it('resolves null after the timeout when the element never appears', async () => {
    const el = await waitForElement('[data-tour="never:here"]', { timeoutMs: 30 });
    expect(el).toBeNull();
  });

  it('disconnects the observer when it resolves with an element', async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');

    const pending = waitForElement('[data-tour="late"]', { timeoutMs: 1000 });
    setTimeout(() => {
      const node = document.createElement('div');
      node.setAttribute('data-tour', 'late');
      document.body.appendChild(node);
    }, 5);
    await pending;

    expect(disconnect).toHaveBeenCalled();
  });

  it('disconnects the observer when it times out', async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');

    await waitForElement('[data-tour="nope"]', { timeoutMs: 20 });

    expect(disconnect).toHaveBeenCalled();
  });
});
