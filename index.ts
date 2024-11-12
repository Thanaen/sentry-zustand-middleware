import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import * as Sentry from '@sentry/browser';

type Context = Record<string, unknown>;

interface SentryMiddlewareConfig<T> {
  /**
   * A function that takes the current state as parameter and return the state that will be stored on Sentry.
   * Return null to not attach the state
   * @link https://docs.sentry.io/platforms/javascript/guides/react/features/redux/#redux-enhancer-options
   */
  stateTransformer?: (state: T) => Context | null;
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

    if (transformedState !== null) {
      currentScope.setContext('state', {
        state: {
          type: 'zustand',
          value: transformedState,
        },
      });
    } else {
      // Same as https://github.com/getsentry/sentry-javascript/blob/8.37.1/packages/react/src/redux.ts#L149
      currentScope.setContext('state', null);
    }
  }
};

/**
 * A Sentry middleware for zustand that will store the latest state in Sentry's context.
 */
const sentryMiddleware = baseSentryMiddleware as unknown as SentryMiddleware;

export default sentryMiddleware;
