# sentry-zustand-middleware

A Zustand middleware to log state on Sentry

## How to use

`npm install sentry-zustand-middleware`
or
`yarn add sentry-zustand-middleware`

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
