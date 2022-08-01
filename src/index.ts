import type { StateCreator, StoreMutatorIdentifier } from "zustand";
import type * as Sentry from "@sentry/hub";

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never;

interface SentryMiddlewareConfig<T> {
  /**
   * The Sentry SDK to use.
   */
  sentry: Pick<typeof Sentry, "configureScope">;
  /**
   * A function that takes the current state as parameter and return the state that will be stored on Sentry.
   */
  stateTransformer?: (state: T) => object;
}

type SentryMiddleware = <
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  config?: SentryMiddlewareConfig<T>
) => StateCreator<T, Mps, Mcs>;

type SentryMiddlewareImpl = <T extends object>(
  f: PopArgument<StateCreator<T, [], []>>,
  config: SentryMiddlewareConfig<T>
) => PopArgument<StateCreator<T, [], []>>;

/**
 * A Sentry middleware for zustand that will store the latest state in Sentry's context.
 */
const baseSentryMiddleware: SentryMiddlewareImpl =
  (config, sentryConfig) => (set, get, api) =>
    config(
      (...args) => {
        set(...args);
        const newState = get();

        const sentry = sentryConfig.sentry;

        sentry.configureScope((scope) => {
          if (newState) {
            const transformedState = sentryConfig?.stateTransformer
              ? sentryConfig.stateTransformer(newState)
              : newState;

            scope.setContext("state", {
              type: "zustand",
              value: transformedState as Record<string, unknown>,
            });
          } else {
            scope.setContext("state", null);
          }
        });
      },
      get,
      api
    );

/**
 * A Sentry middleware for zustand that will store the latest state in Sentry's context.
 */
const sentryMiddleware = baseSentryMiddleware as unknown as SentryMiddleware;

export default sentryMiddleware;
