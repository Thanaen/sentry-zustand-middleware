import create from 'zustand/vanilla';
import sentryMiddleware from '..';

// Mock Sentry's configureScope method.
const setContextMock = jest.fn();
const scopeMock = {
  setContext: setContextMock,
};

jest.mock('@sentry/browser', () => ({
  configureScope: (callback: (store: typeof scopeMock) => void) => {
    callback(scopeMock);
  },
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

beforeEach(() => {
  setContextMock.mockClear();
});

describe('sentryMiddleware', () => {
  test("adds the state to sentry's context", () => {
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

  test("adds the state to sentry's context with a custom transformer", () => {
    const { increase } = storeWithTransformer.getState();
    increase(1);
    expect(setContextMock).toHaveBeenCalledWith('state', {
      state: {
        type: 'zustand',
        value: { bears: 1 },
      },
    });
  });
});
