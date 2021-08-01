import { env } from 'process'
// require cannot be used when "type" = "module" in package.json
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const config = require(process.cwd() + '/config.json')

const stateName = env.STATE_NAME || config.stateName || ''
const pubsubName = env.PUBSUB_NAME || config.pubsubName || ''
const pubsubTopic = env.PUBSUB_TOPIC || config.pubsubTopic || ''
const bindingName = env.BINDING_NAME || config.bindingName || ''

const openfnConfig = {
  stateName,
  pubsubName,
  pubsubTopic,
  bindingName
}

export { openfnConfig }
