import test from 'tape'
import path from 'path'
import fs from 'fs'
import { Project } from 'ts-morph'
import { processProject } from '../src'
const WorkingDir = path.dirname(__filename)
const TestFile = 'ImportTest.ts'
const TestFilePath = path.join(WorkingDir, TestFile)

interface TestDefinition {
  message: string
  inputFile: string
  guardFile: string
}

// Test blueprint for running different test definitions
class Blueprint {
  inputContents: string
  expectedContents: string
  message: string
  constructor(message: string, inputFile: string, guardFile: string) {
    this.inputContents = inputFile
    this.expectedContents = guardFile
    this.message = message
  }
  createTestFile() {
    fs.writeFileSync(TestFilePath, this.inputContents)
  }
  deleteTestFile() {
    fs.unlinkSync(TestFilePath)
  }
  buildProject() {
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: { strict: true },
      useInMemoryFileSystem: false,
    })
    project.addSourceFileAtPath(TestFilePath)
    project.saveSync()
    return project
  }
  run() {
    test(this.message, t => {
      this.createTestFile()
      const project = this.buildProject()
      t.doesNotThrow(() => {
        processProject(project, { exportAll: true })
      })
      const guardFile = project.getSourceFiles()[0]
      guardFile.formatText()
      t.equal(guardFile.getText(), this.expectedContents)
      t.end()
      this.deleteTestFile()
    })
  }
}

function genBlueprint(def: TestDefinition) {
  return new Blueprint(def.message, def.inputFile, def.guardFile)
}

// Define grouping of tests
const blueprints = [
  genBlueprint({
    message: 'interfaces from node modules requires no import',
    inputFile: `import { InMemoryFileSystemHostOptions } from "@ts-morph/common";
export interface Foo {
  target: InMemoryFileSystemHostOptions
}`,
    guardFile: `import { Foo } from "./ImportTest";

export function isFoo(obj: any, _argumentName?: string): obj is Foo {
    return (
        (obj !== null &&
            typeof obj === "object" ||
            typeof obj === "function") &&
        (obj.target !== null &&
            typeof obj.target === "object" ||
            typeof obj.target === "function") &&
        (typeof obj.target.skipLoadingLibFiles === "undefined" ||
            obj.target.skipLoadingLibFiles === false ||
            obj.target.skipLoadingLibFiles === true)
    )
}
`,
  }),
  genBlueprint({
    message: 'type from node modules requires no import',
    inputFile: `import { ResolutionHostFactory } from "@ts-morph/common";
export interface Foo {
  target: ResolutionHostFactory
}`,
    guardFile: `import { Foo } from "./ImportTest";

export function isFoo(obj: any, _argumentName?: string): obj is Foo {
    return (
        (obj !== null &&
            typeof obj === "object" ||
            typeof obj === "function") &&
        typeof obj.target === "function"
    )
}
`,
  }),
  genBlueprint({
    message: 'using class from node modules should import correctly',
    inputFile: `import { CompilerOptionsContainer } from "@ts-morph/common";
export interface Foo {
  target: CompilerOptionsContainer
}`,
    guardFile: `import { CompilerOptionsContainer } from "@ts-morph/common";
import { Foo } from "./ImportTest";

export function isFoo(obj: any, _argumentName?: string): obj is Foo {
    return (
        (obj !== null &&
            typeof obj === "object" ||
            typeof obj === "function") &&
        obj.target instanceof CompilerOptionsContainer
    )
}
`,
  }),
  genBlueprint({
    message: 'using multiple classes from node modules should import correctly',
    inputFile: `import { CompilerOptionsContainer, TsConfigResolver, InMemoryFileSystemHost } from "@ts-morph/common";
export interface Foo {
  target: CompilerOptionsContainer,
  res: TsConfigResolver,
  fs: InMemoryFileSystemHost
}`,
    guardFile: `import { CompilerOptionsContainer, TsConfigResolver, InMemoryFileSystemHost } from "@ts-morph/common";
import { Foo } from "./ImportTest";

export function isFoo(obj: any, _argumentName?: string): obj is Foo {
    return (
        (obj !== null &&
            typeof obj === "object" ||
            typeof obj === "function") &&
        obj.target instanceof CompilerOptionsContainer &&
        obj.res instanceof TsConfigResolver &&
        obj.fs instanceof InMemoryFileSystemHost
    )
}
`,
  }),
]

// Run all tests
blueprints.forEach(bp => {
  bp.run()
})
