# sentry-zustand-middleware

[![NPM](https://img.shields.io/npm/l/sentry-zustand-middleware)](https://github.com/thanaen/sentry-zustand-middleware/blob/master/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/thanaen/sentry-zustand-middleware)](https://github.com/Thanaen/sentry-zustand-middleware/graphs/contributors)
[![npm](https://img.shields.io/npm/v/sentry-zustand-middleware)](https://www.npmjs.com/package/sentry-zustand-middleware)
[![npm](https://img.shields.io/npm/dm/sentry-zustand-middleware)](https://www.npmjs.com/package/sentry-zustand-middleware)

A Zustand middleware to log state on Sentry

## How to use

```sh
npm install sentry-zustand-middleware
```

### Basic usage

```ts
import create from 'zustand';
import sentryMiddleware from 'sentry-zustand-middleware';

interface BearState {
  bears: number;
  increase: (by: number) => void;
}

const useStore = create<BearState>()(
  sentryMiddleware((set) => ({
    bears: 0,
    increase: (by) => set((state) => ({ bears: state.bears + by })),
  })),
);

export default useStore;
```

### With a state transformer

```ts
import create from 'zustand';
import sentryMiddleware from 'sentry-zustand-middleware';

interface BearState {
  bears: number;
  increase: (by: number) => void;
}

const stateTransformer = (state: BearState) => {
  const cleanedState = {
    ...state,
    bears:
      state.bears > 0 ? "There are some bears, but I won't tell you how many!" : 'No bears here',
  };

  // In zustand, actions are accessible from the store's state
  // We might want to remove them before sending the state to Sentry
  return Object.fromEntries(
    Object.entries(cleanedState).filter(
      ([key]) => typeof cleanedState[key as keyof typeof cleanedState] !== 'function',
    ),
  );
};

const useStore = create<BearState>()(
  sentryMiddleware(
    (set) => ({
      bears: 0,
      increase: (by) => set((state) => ({ bears: state.bears + by })),
    }),
    { stateTransformer: stateTransformer },
  ),
);

export default useStore;
```
