import { getUserFunction } from './src/loader.js'
import { FUNCTION_TYPE } from './src/const.js'
import { getServer } from './src/server.js'

const PORT = 3000
const CODE_LOCATION = '../mock/userfunc'
// const FUNCTION_TARGET = 'helloNestedObj.helloWorld'
const FUNCTION_TARGET = 'helloCloudEvents'

const SIGNATURE_TYPE = FUNCTION_TYPE.CLOUDEVENTS

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

  app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
  })
})
