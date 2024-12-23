import create from 'zustand/vanilla';
import sentryMiddleware from '../index';
import { describe, it, vi, beforeEach, expect } from 'vitest';

// Mock Sentry's configureScope method.
const setContextMock = vi.fn();
const scopeMock = {
  setContext: setContextMock,
};

vi.mock('@sentry/browser', () => ({
  getCurrentScope: () => scopeMock,
}));

interface BearState {
  bears: number;
  increase: (by: number) => void;
}

const store = create<BearState>()(
  sentryMiddleware((set) => ({
    bears: 0,
    increase: (by) => {
      set((state) => ({ bears: state.bears + by }));
    },
  })),
);

const storeWithTransformer = create<BearState>()(
  sentryMiddleware(
    (set) => ({
      bears: 0,
      increase: (by) => {
        set((state) => ({ bears: state.bears + by }));
      },
    }),
    {
      stateTransformer: (state) => ({ bears: state.bears }),
    },
  ),
);

const storeWithTransformerDoNotSend = create<BearState>()(
  sentryMiddleware(
    (set) => ({
      bears: 0,
      increase: (by) => {
        set((state) => ({ bears: state.bears + by }));
      },
    }),
    {
      stateTransformer: () => null,
    },
  ),
);

beforeEach(() => {
  setContextMock.mockClear();
});

describe('sentryMiddleware', () => {
  it("adds the state to sentry's context", () => {
    const { increase } = store.getState();
    increase(1);
    expect(setContextMock).toHaveBeenCalledWith('state', {
      state: {
        type: 'zustand',
        // Go home Typescript, you're drunk.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value: { bears: 1, increase: expect.any(Function) },
      },
    });
  });

  it("adds the state to sentry's context with a custom transformer", () => {
    const { increase } = storeWithTransformer.getState();
    increase(1);
    expect(setContextMock).toHaveBeenCalledWith('state', {
      state: {
        type: 'zustand',
        value: { bears: 1 },
      },
    });
  });

  it("adds the state to sentry's context with a custom tranformer that returns null", () => {
    const { increase } = storeWithTransformerDoNotSend.getState();
    increase(1);
    expect(setContextMock).toHaveBeenCalledWith('state', null);
  });

  // https://github.com/pmndrs/zustand?tab=readme-ov-file#using-zustand-without-react
  it("adds the state to sentry's context using store.setState", () => {
    store.setState({ bears: 1 });

    expect(setContextMock).toHaveBeenCalledWith('state', {
      state: {
        type: 'zustand',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value: { bears: 1, increase: expect.any(Function) },
      },
    });
  });
});
