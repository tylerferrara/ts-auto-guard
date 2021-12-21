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

## Quick-n Dirty Solution

Copy the original import when a package from `node_modules` is found.

If you instead use the local version of ts-auto-guard, like so:

```zsh
$ npx ts-node src/cli.ts --project ./replicate --export-all
```

We generate the correct guard file import statement:

```ts
import { Timestamp } from "@google-cloud/firestore";
import { Person } from "./Person";

export function isPerson(obj: any, _argumentName?: string): obj is Person {
    return ( ...
```

**Git it try!**
