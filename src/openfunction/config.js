import { env } from 'process'
import { isEmpty } from 'lodash'
import { MIDDLEWARE_TYPE } from '../const.js'
// require cannot be used when "type" = "module" in package.json
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const config = require(process.cwd() + '/config.json')

const stateName = env.STATE_NAME || config.stateName || ''
const pubsubName = env.PUBSUB_NAME || config.pubsubName || ''
const pubsubTopic = env.PUBSUB_TOPIC || config.pubsubTopic || ''
const bindingName = env.BINDING_NAME || config.bindingName || ''

// check user input here to simplify the business logic
let input = config.input || {}
const isInputEmpty = isEmpty(input)
if (!isInputEmpty) {
  if (isEmpty(input.name) || isEmpty(input.uri) ||
  isEmpty(input.params) || isEmpty(input.params.type)) {
    console.error('properties in input should not be empty if input is specified')
    process.exit(1)
  }
  if (input.params.type !== MIDDLEWARE_TYPE.PUBSUB ||
    input.params.type !== MIDDLEWARE_TYPE.BINDINGS ||
    input.params.type !== MIDDLEWARE_TYPE.INVOKE) {
    console.error('params.type in input is invalid, valid: pubsub, bindings, invoke')
    process.exit(1)
  }
}
input = {
  ...input,
  isEmpty: isInputEmpty
}
// check user outputs here to simplify the business logic
//   1. convert map to array first;
//   2. do the validation.
let outputs = config.outputs || {}
const isOutputsEmpty = isEmpty(outputs)
let outputArr = []
if (!isOutputsEmpty) {
  // map outputs object
  for (const key in outputs) {
    if (Object.prototype.hasOwnProperty.call(outputs, key)) {
      outputArr = [
        ...outputArr,
        {
          ...outputs[key],
          name: key
        }
      ]
    }
  }
  // do the validation
  outputArr.forEach(output => {
    if (isEmpty(output.uri) || isEmpty(output.params) || isEmpty(output.params.type)) {
      console.error(`properties in outputs.${output.name} should not be empty if it is specified`)
      process.exit(1)
    }
    if (output.params.type !== MIDDLEWARE_TYPE.PUBSUB ||
      output.params.type !== MIDDLEWARE_TYPE.BINDINGS ||
      output.params.type !== MIDDLEWARE_TYPE.INVOKE) {
      console.error(`params.type in outputs.${output.name} is invalid, valid: pubsub, bindings, invoke`)
      process.exit(1)
    }
    if (output.params.type === MIDDLEWARE_TYPE.BINDINGS && isEmpty(output.params.operation)) {
      console.error(`params.operation in outputs.${output.name} should not be empty`)
      process.exit(1)
    }
  })
}
outputs = {
  isEmpty: isOutputsEmpty,
  data: outputArr
}

const openfuncConfig = {
  stateName,
  pubsubName,
  pubsubTopic,
  bindingName,
  input,
  outputs
}

export { openfuncConfig }
