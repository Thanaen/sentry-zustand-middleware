import create from "zustand/vanilla";
import sentryMiddleware from "../src";

// Mock Sentry's configureScope method.
const setContextMock = jest.fn();
const scopeMock = {
  setContext: setContextMock,
};

jest.mock("@sentry/browser", () => ({
  configureScope: (callback: any) => callback(scopeMock),
}));

interface BearState {
  bears: number;
  increase: (by: number) => void;
}

const store = create<BearState>()(
  sentryMiddleware(
    (set) => ({
      bears: 0,
      increase: (by) => set((state) => ({ bears: state.bears + by })),
    }),
  )
);

beforeEach(() => {
  setContextMock.mockClear();
});

test("sentryMiddleware", () => {
  const { increase } = store.getState();
  increase(1);
  expect(setContextMock).toHaveBeenCalledWith("state", {
    type: "zustand",
    value: { bears: 1, increase: expect.any(Function) },
  });
});
