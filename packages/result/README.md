# @rectangular-labs/result

A TypeScript library providing a Result type (`Ok<T>` | `Err<E>`) for explicit and robust error handling, inspired by Rust. Instead of throwing exceptions, functions return a `Result` object, forcing callers to consciously handle potential errors.

## Installation

```bash
npm install @rectangular-labs/result
# or
yarn add @rectangular-labs/result
# or
bun install @rectangular-labs/result
```

## Usage

```typescript
import { ok, err, Result } from '@rectangular-labs/result';

// Using pipe (Note: pipe is async by default, use pipeSync for sync operations)
async function processNumber(input: number): Promise<Result<string, string>> {
  const double = (n: number): Result<number, string> => ok(n * 2);
  const add5 = (n: number): Result<number, string> => ok(n + 5);
  const toString = (n: number): Result<string, string> => ok(`Final result: ${n}`);

  return pipe(input, double, add5, toString);
}

const pipedResult = await processNumber(10); // ok("Final result: 25")
if (!pipedResult.ok) {
  console.error(`Pipe Error: ${pipedResult.error}`);
}

// Using safe to wrap a potentially throwing async function
async function potentiallyFailingAsyncOperation(shouldFail: boolean): Promise<number> {
  if (shouldFail) {
    throw new Error('Async operation failed!');
  }
  return Promise.resolve(100);
}

const safeResult = await safe(() => potentiallyFailingAsyncOperation(true));
if (!safeResult.ok) {
  console.error(`Safe Error: ${safeResult.error.message}`); // Output: Safe Error: Async operation failed!
}

// Using safeSync to wrap a potentially throwing sync function
function potentiallyFailingSyncOperation(shouldFail: boolean): number {
  if (shouldFail) {
    throw new Error('Sync operation failed!');
  }
  return 200;
}

const safeSyncResult = safeSync(() => potentiallyFailingSyncOperation(false));
if (safeSyncResult.ok) {
  console.log(`SafeSync Success: ${safeSyncResult.value}`); // Output: SafeSync Success: 200
}

// Using safeFetch, okay only when we get back a status 2xx response!
const fetchResult = await safeFetch('https://jsonplaceholder.typicode.com/todos/1');
if (fetchResult.ok) {
  const data = await fetchResult.value.json();
  console.log('Fetch Success:', data);
} else {
  console.error(`Fetch Error: ${fetchResult.error.message}`);
}
```
