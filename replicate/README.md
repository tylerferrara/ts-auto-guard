# Replicating Issue [#162](https://github.com/rhys-vdw/ts-auto-guard/issues/162)

**TLDR:** If a user defines an object which includes a class from an external package, like this:

```ts
// Person.ts
import { Timestamp } from '@google-cloud/firestore'

export interface Person {
  name: string
  age?: number
  children: Person[]
  time: Timestamp
}
```

uppon generating type guards

```zsh
$ ts-auto-guard --export-all
```

the guard file would look like the following:

```ts
import { Timestamp } from './node_modules/@google-cloud/firestore/types/firestore'
import { Person } from './Person'

export function isPerson(obj: any, _argumentName?: string): obj is Person {
  return (
    ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
    typeof obj.name === 'string' &&
    (typeof obj.age === 'undefined' || typeof obj.age === 'number') &&
    Array.isArray(obj.children) &&
    obj.children.every((e: any) => isPerson(e) as boolean) &&
    obj.time instanceof Timestamp
  )
}
```

`Timestamp` is not only imported incorrectly, but referenced as a relative import within node_modules.

**NOTE:** I've only been able to reproduce this with class definitions.
For example, if we replace the `Timestamp class` with the `DocumentData type`, the import disapears.

## Solution

Below are the steps to replicate the fix, from start to finish.

```zsh
# Clone the project (fix is in master branch)
git clone git@github.com:tylerferrara/ts-auto-guard.git
cd ts-auto-guard
# Install ts-auto-guard dependencies
npm install
# Install dummy project dependencies
cd replicate
npm install
# Run the local build of ts-auto-guard on the dummy project
npx ts-node ../src/cli.ts --project . --export-all
```

This will produce the following file: `ts-auto-guard/replicate/Person.guard.ts`

```zsh
/*
 * Generated type guards for "Person.ts".
 * WARNING: Do not manually change this file.
 */
import { Timestamp } from "@google-cloud/firestore";
import { Person } from "./Person";

export function isPerson(obj: any, _argumentName?: string): obj is Person {
    return (
        (obj !== null &&
            typeof obj === "object" ||
            typeof obj === "function") &&
        typeof obj.name === "string" &&
        (typeof obj.age === "undefined" ||
            typeof obj.age === "number") &&
        Array.isArray(obj.children) &&
        obj.children.every((e: any) =>
            isPerson(e) as boolean
        ) &&
        obj.time instanceof Timestamp
    )
}
```
