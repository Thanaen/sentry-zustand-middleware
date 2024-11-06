import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import * as Sentry from '@sentry/browser';

type Context = Record<string, unknown>;

interface SentryMiddlewareConfig<T> {
  /**
   * A function that takes the current state as parameter and return the state that will be stored on Sentry.
   */
  stateTransformer?: (state: T) => Context;
}

type SentryMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  fn: StateCreator<T, Mps, Mcs>,
  config?: SentryMiddlewareConfig<T>,
) => StateCreator<T, Mps, Mcs>;

type SentryMiddlewareImpl = <T extends Context>(
  fn: StateCreator<T>,
  config?: SentryMiddlewareConfig<T>,
) => StateCreator<T>;

/**
 * A Sentry middleware for zustand that will store the latest state in Sentry's context.
 */
const baseSentryMiddleware: SentryMiddlewareImpl = (fn, sentryConfig) => (set, get, store) => {
  // Add set proxy
  const sentrySet: typeof set = (...a) => {
    set(...(a as Parameters<typeof set>));
    setSentryContext(get());
  };

  // Add setState proxy
  const setState = store.setState;

  store.setState = (...a) => {
    setState(...(a as Parameters<typeof setState>));
    setSentryContext(store.getState());
  };

  return fn(sentrySet, get, store);

  function setSentryContext(state: ReturnType<typeof fn>): void {
    const currentScope = Sentry.getCurrentScope();

    const transformedState = sentryConfig?.stateTransformer
      ? sentryConfig.stateTransformer(state)
      : state;

    currentScope.setContext('state', {
      state: {
        type: 'zustand',
        value: transformedState,
      },
    });
  }
};

/**
 * A Sentry middleware for zustand that will store the latest state in Sentry's context.
 */
const sentryMiddleware = baseSentryMiddleware as unknown as SentryMiddleware;

export default sentryMiddleware;
