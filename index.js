#!/usr/bin/env node

import { program, Option } from 'commander'
import { getUserFunction } from './src/loader.js'
import { FUNCTION_SOURCE, FUNCTION_MODE } from './src/const.js'
import { getServer } from './src/server.js'

const { HTTP, CLOUDEVENT, OPENFUNCTION } = FUNCTION_SOURCE
const { SUBSCRIBE, BINDING } = FUNCTION_MODE

program
  .requiredOption('-t, --target <target>', 'function target name, support nested function name')
  .addOption(new Option('-p, --port <port>', 'the exposed port of the function server').default('8080'))
  .addOption(new Option('-s, --source <type>', 'function source type')
    .default(HTTP).choices([HTTP, CLOUDEVENT, OPENFUNCTION]))
  .addOption(new Option('-,, --mode <mode>', 'the mode of the function server')
    .choices([SUBSCRIBE, BINDING]))
program.parse(process.argv)

const options = program.opts()

const SERVER_PORT = options.port
const FUNCTION_TARGET = options.target
const SIGNATURE_TYPE = options.source
const CODE_LOCATION = process.cwd() + '/index.js'
const RUNTIME_MODE = options.mode
if (RUNTIME_MODE !== '' && SIGNATURE_TYPE !== OPENFUNCTION) {
  console.errpr('source option must be \'openfunction\' if mode option is specified')
  process.exit(1)
}

let userFunction
getUserFunction(CODE_LOCATION, FUNCTION_TARGET).then(fn => {
  if (fn === null) {
    console.error('Could not load the function, shutting down.')
    process.exit(1)
  }
  userFunction = fn

  // To catch unhandled exceptions thrown by user code async callbacks,
  // these exceptions cannot be catched by try-catch in user function invocation code below
  process.on('uncaughtException', (err) => {
    console.error(`Caught exception: ${err}`)
  })

  const app = getServer(userFunction, SIGNATURE_TYPE, RUNTIME_MODE)

  app.listen(SERVER_PORT, () => {
    console.log(`Openfunction functions framework listening at http://localhost:${SERVER_PORT}`)
  })
})
