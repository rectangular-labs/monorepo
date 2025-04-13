export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Creates a successful Result
 * @param data The success data
 * @returns A successful Result containing the data
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Creates a failure Result
 * @param error The error value
 * @returns A failure Result containing the error
 */
export function err<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * @internal
 * Handles an error by returning an Error instance
 * @param error The error value
 * @returns An Error instance
 */
function handleError<E>(
  error: unknown,
  mapError?: (error: Error) => E,
): E | Error {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error));
  if (mapError) {
    return mapError(normalizedError);
  }
  return normalizedError;
}

/**
 * Safely executes a function and returns a Result type
 * @param fn The function to execute
 * @param mapError Optional callback that will be called with the error before returning. If it returns a value, that value will be used as the error.
 * @returns A Promise containing the Result type containing either the successful data or an error
 */
export async function safe<T, E>(
  fn: () => Promise<T> | T,
  mapError: (error: Error) => E,
): Promise<Result<T, E>>;
export async function safe<T>(
  fn: () => Promise<T> | T,
): Promise<Result<T, Error>>;
export async function safe<T, E>(
  fn: () => Promise<T> | T,
  mapError?: (error: Error) => E,
): Promise<Result<T, E | Error>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    const normalizedError = handleError(error, mapError);
    return err(normalizedError);
  }
}

/**
 * Safely executes a synchronous function and returns a Result type
 * @param fn The function to execute
 * @param mapError Optional callback that will be called with the error before returning. If it returns a value, that value will be used as the error.
 * @returns A Result type containing either the successful data or an error
 */
export function safeSync<T, E>(
  fn: () => T,
  mapError: (error: Error) => E,
): Result<T, E>;
export function safeSync<T>(fn: () => T): Result<T, Error>;
export function safeSync<T, E>(
  fn: () => T,
  mapError?: (error: Error) => E,
): Result<T, E | Error> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    const normalizedError = handleError(error, mapError);
    return err(normalizedError);
  }
}

/**
 * Safely executes a fetch request and returns a Result type
 * @param input The URL or Request object to fetch
 * @param init Optional fetch initialization options
 * @param mapError Optional callback that will be called with the error before returning. If it returns a value, that value will be used as the error.
 * @returns A Result type containing either the successful Response or an error
 */
export async function safeFetch<E>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  mapError: (error: Error) => E,
): Promise<Result<Response, E>>;
export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
): Promise<Result<Response, Error>>;
export async function safeFetch<E>(
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
  mapError?: (error: Error) => E,
): Promise<Result<Response, E | Error>> {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Failed to read response body");
      const error = new Error(
        `Request failed: ${response.status}. Status: ${response.statusText}. ${errorText ? `\n${errorText}` : ""}`,
      );
      const normalizedError = handleError(error, mapError);
      return err(normalizedError);
    }

    return ok(response);
  } catch (error) {
    const normalizedError = handleError(error, mapError);
    return err(normalizedError);
  }
}

/**
 * Pipes a value through a series of synchronous functions and returns a Result type.
 * Pipe will short-circuit on any error and return the error immediately.
 * @param value The value to pipe
 * @param operations The operations to pipe the value through
 * @returns A Result type containing either the successful data or an error
 */
export function pipeSync<A, E>(value: A): Result<A, E>;
export function pipeSync<A, B, E1>(
  value: A,
  op1: (a: A) => Result<B, E1>,
): Result<B, E1>;
export function pipeSync<A, B, C, E1, E2>(
  value: A,
  op1: (a: A) => Result<B, E1>,
  op2: (b: B) => Result<C, E2>,
): Result<C, E1 | E2>;
export function pipeSync<A, B, C, D, E1, E2, E3>(
  value: A,
  op1: (a: A) => Result<B, E1>,
  op2: (b: B) => Result<C, E2>,
  op3: (c: C) => Result<D, E3>,
): Result<D, E1 | E2 | E3>;
export function pipeSync<A, B, C, D, F, E1, E2, E3, E4>(
  value: A,
  op1: (a: A) => Result<B, E1>,
  op2: (b: B) => Result<C, E2>,
  op3: (c: C) => Result<D, E3>,
  op4: (d: D) => Result<F, E4>,
): Result<F, E1 | E2 | E3 | E4>;
export function pipeSync<A, B, C, D, F, G, E1, E2, E3, E4, E5>(
  value: A,
  op1: (a: A) => Result<B, E1>,
  op2: (b: B) => Result<C, E2>,
  op3: (c: C) => Result<D, E3>,
  op4: (d: D) => Result<F, E4>,
  op5: (f: F) => Result<G, E5>,
): Result<G, E1 | E2 | E3 | E4 | E5>;
export function pipeSync<A, B, C, D, F, G, H, E1, E2, E3, E4, E5, E6>(
  value: A,
  op1: (a: A) => Result<B, E1>,
  op2: (b: B) => Result<C, E2>,
  op3: (c: C) => Result<D, E3>,
  op4: (d: D) => Result<F, E4>,
  op5: (f: F) => Result<G, E5>,
  op6: (g: G) => Result<H, E6>,
): Result<H, E1 | E2 | E3 | E4 | E5 | E6>;
export function pipeSync<A, B, C, D, F, G, H, I, E1, E2, E3, E4, E5, E6, E7>(
  value: A,
  op1: (a: A) => Result<B, E1>,
  op2: (b: B) => Result<C, E2>,
  op3: (c: C) => Result<D, E3>,
  op4: (d: D) => Result<F, E4>,
  op5: (f: F) => Result<G, E5>,
  op6: (g: G) => Result<H, E6>,
  op7: (h: H) => Result<I, E7>,
): Result<I, E1 | E2 | E3 | E4 | E5 | E6 | E7>;
export function pipeSync<
  A,
  B,
  C,
  D,
  F,
  G,
  H,
  I,
  J,
  E1,
  E2,
  E3,
  E4,
  E5,
  E6,
  E7,
  E8,
>(
  value: A,
  op1: (a: A) => Result<B, E1>,
  op2: (b: B) => Result<C, E2>,
  op3: (c: C) => Result<D, E3>,
  op4: (d: D) => Result<F, E4>,
  op5: (f: F) => Result<G, E5>,
  op6: (g: G) => Result<H, E6>,
  op7: (h: H) => Result<I, E7>,
  op8: (i: I) => Result<J, E8>,
): Result<J, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8>;

export function pipeSync(
  value: unknown,
  ...operations: Array<(input: unknown) => Result<unknown, unknown>>
): Result<unknown, unknown> {
  let currentResult: Result<unknown, unknown> = ok(value);

  for (const operation of operations) {
    if (!currentResult.ok) {
      return currentResult;
    }
    currentResult = operation(currentResult.value);
  }

  return currentResult;
}

/**
 * Pipes a value through a series of async or sync functions and returns a Promise<Result>.
 * Pipe will short-circuit on any error and return the error immediately.
 * @param value The value to pipe
 * @param operations The operations to pipe the value through. Operations can return Result or Promise<Result>.
 * @returns A Promise containing a Result type with either the successful data or an error
 */
export async function pipe<A, E>(value: A): Promise<Result<A, E>>;
export async function pipe<A, B, E1>(
  value: A,
  op1: (a: A) => Promise<Result<B, E1>> | Result<B, E1>,
): Promise<Result<B, E1>>;
export async function pipe<A, B, C, E1, E2>(
  value: A,
  op1: (a: A) => Promise<Result<B, E1>> | Result<B, E1>,
  op2: (b: B) => Promise<Result<C, E2>> | Result<C, E2>,
): Promise<Result<C, E1 | E2>>;
export async function pipe<A, B, C, D, E1, E2, E3>(
  value: A,
  op1: (a: A) => Promise<Result<B, E1>> | Result<B, E1>,
  op2: (b: B) => Promise<Result<C, E2>> | Result<C, E2>,
  op3: (c: C) => Promise<Result<D, E3>> | Result<D, E3>,
): Promise<Result<D, E1 | E2 | E3>>;
export async function pipe<A, B, C, D, F, E1, E2, E3, E4>(
  value: A,
  op1: (a: A) => Promise<Result<B, E1>> | Result<B, E1>,
  op2: (b: B) => Promise<Result<C, E2>> | Result<C, E2>,
  op3: (c: C) => Promise<Result<D, E3>> | Result<D, E3>,
  op4: (d: D) => Promise<Result<F, E4>> | Result<F, E4>,
): Promise<Result<F, E1 | E2 | E3 | E4>>;
export async function pipe<A, B, C, D, F, G, E1, E2, E3, E4, E5>(
  value: A,
  op1: (a: A) => Promise<Result<B, E1>> | Result<B, E1>,
  op2: (b: B) => Promise<Result<C, E2>> | Result<C, E2>,
  op3: (c: C) => Promise<Result<D, E3>> | Result<D, E3>,
  op4: (d: D) => Promise<Result<F, E4>> | Result<F, E4>,
  op5: (f: F) => Promise<Result<G, E5>> | Result<G, E5>,
): Promise<Result<G, E1 | E2 | E3 | E4 | E5>>;
export async function pipe<A, B, C, D, F, G, H, E1, E2, E3, E4, E5, E6>(
  value: A,
  op1: (a: A) => Promise<Result<B, E1>> | Result<B, E1>,
  op2: (b: B) => Promise<Result<C, E2>> | Result<C, E2>,
  op3: (c: C) => Promise<Result<D, E3>> | Result<D, E3>,
  op4: (d: D) => Promise<Result<F, E4>> | Result<F, E4>,
  op5: (f: F) => Promise<Result<G, E5>> | Result<G, E5>,
  op6: (g: G) => Promise<Result<H, E6>> | Result<H, E6>,
): Promise<Result<H, E1 | E2 | E3 | E4 | E5 | E6>>;
export async function pipe<A, B, C, D, F, G, H, I, E1, E2, E3, E4, E5, E6, E7>(
  value: A,
  op1: (a: A) => Promise<Result<B, E1>> | Result<B, E1>,
  op2: (b: B) => Promise<Result<C, E2>> | Result<C, E2>,
  op3: (c: C) => Promise<Result<D, E3>> | Result<D, E3>,
  op4: (d: D) => Promise<Result<F, E4>> | Result<F, E4>,
  op5: (f: F) => Promise<Result<G, E5>> | Result<G, E5>,
  op6: (g: G) => Promise<Result<H, E6>> | Result<H, E6>,
  op7: (h: H) => Promise<Result<I, E7>> | Result<I, E7>,
): Promise<Result<I, E1 | E2 | E3 | E4 | E5 | E6 | E7>>;
export async function pipe<
  A,
  B,
  C,
  D,
  F,
  G,
  H,
  I,
  J,
  E1,
  E2,
  E3,
  E4,
  E5,
  E6,
  E7,
  E8,
>(
  value: A,
  op1: (a: A) => Promise<Result<B, E1>> | Result<B, E1>,
  op2: (b: B) => Promise<Result<C, E2>> | Result<C, E2>,
  op3: (c: C) => Promise<Result<D, E3>> | Result<D, E3>,
  op4: (d: D) => Promise<Result<F, E4>> | Result<F, E4>,
  op5: (f: F) => Promise<Result<G, E5>> | Result<G, E5>,
  op6: (g: G) => Promise<Result<H, E6>> | Result<H, E6>,
  op7: (h: H) => Promise<Result<I, E7>> | Result<I, E7>,
  op8: (i: I) => Promise<Result<J, E8>> | Result<J, E8>,
): Promise<Result<J, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8>>;

export async function pipe(
  value: unknown,
  ...operations: ((
    input: unknown,
  ) => Promise<Result<unknown, unknown>> | Result<unknown, unknown>)[]
): Promise<Result<unknown, unknown>> {
  let currentResult: Result<unknown, unknown> = ok(value);

  for (const operation of operations) {
    if (!currentResult.ok) {
      return currentResult;
    }
    // Await potentially async operation
    currentResult = await operation(currentResult.value);
  }

  return currentResult;
}
