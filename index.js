#!/usr/bin/env node

import { program, Option } from 'commander'
import { getUserFunction } from './src/loader.js'
import { FUNCTION_SOURCE } from './src/const.js'
import { getServer } from './src/server.js'

const { HTTP, KNATIVE, CLOUDEVENTS, ASYNC_FUNCTION } = FUNCTION_SOURCE

program
  .requiredOption('-t, --target <target>', 'function target name, support nested function name')
  .addOption(new Option('-p, --port <port>', 'the exposed port of the function server').default('3000'))
  .addOption(new Option('-s, --source <type>', 'function source type')
    .default(HTTP).choices([HTTP, KNATIVE, CLOUDEVENTS, ASYNC_FUNCTION]))

program.parse(process.argv)

const options = program.opts()

const SERVER_PORT = options.port
const FUNCTION_TARGET = options.target
const SIGNATURE_TYPE = options.source
const CODE_LOCATION = process.cwd() + '/index.js'

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

  const app = getServer(userFunction, SIGNATURE_TYPE)

  app.listen(SERVER_PORT, () => {
    console.log(`Example app listening at http://localhost:${SERVER_PORT}`)
  })
})
