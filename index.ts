import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import * as Sentry from '@sentry/browser';

interface SentryMiddlewareConfig<T> {
  /**
   * A function that takes the current state as parameter and return the state that will be stored on Sentry.
   */
  stateTransformer?: (state: T) => object;
}

type SentryMiddleware = <
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  config?: SentryMiddlewareConfig<T>,
) => StateCreator<T, Mps, Mcs>;

type SentryMiddlewareImpl = <T extends object>(
  f: StateCreator<T>,
  config?: SentryMiddlewareConfig<T>,
) => StateCreator<T>;

/**
 * A Sentry middleware for zustand that will store the latest state in Sentry's context.
 */
const baseSentryMiddleware: SentryMiddlewareImpl = (config, sentryConfig) => (set, get, api) => {
  // Add set proxy
  const sentrySet: typeof set = (...a) => {
    set(...(a as Parameters<typeof set>));
    setSentryContext(get());
  };

  // Add setState proxy
  const setState = api.setState;

  api.setState = (...a) => {
    setState(...(a as Parameters<typeof setState>));
    setSentryContext(api.getState());
  };

  return config(sentrySet, get, api);

  function setSentryContext(state: ReturnType<typeof config>): void {
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
