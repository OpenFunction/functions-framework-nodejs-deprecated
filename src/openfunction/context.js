import { DaprClient } from '@roadwork/dapr-js-sdk/http/index.js'

const daprHost = '127.0.0.1'
const daprPort = process.env.DAPR_HTTP_PORT || 3500 // Dapr Sidecar Port of this Example Server

// TODO: handle statestore later
// we now provide interface to connect to the state, but it will not be used now
const stateName = ''

const daprClient = new DaprClient(daprHost, daprPort)

/**
 * Persist the data to the state middleware
 * @param { string } key - The key of the data to be persisted.
 * @param { string } value - The value of the data to be persisted.
 * @return { Promise } response situation.
 */
async function saveState (key, value) {
  if (stateName === '') {
    console.error('statestore name should be specified in env or config.json if you want to use \'save\'')
    return
  }
  await daprClient.state.save(
    stateName,
    [{ key, value }]
  )
}

/**
 * Get data from the state middleware.
 * @param { string } key - The key of the data.
 * @return { string  | undefined } the value of the key, returns an empty string if not exist.
 */
async function getState (key) {
  if (stateName === '') {
    console.error('statestore name should be specified in env or config.json if you want to use \'get\'')
    return
  }
  return await daprClient.state.get(stateName, key)
}

/**
 * Delete the data from the state middleware.
 * @param { string } key - The key of the data.
 */
async function deleteState (key) {
  if (stateName === '') {
    console.error('statestore name should be specified in env or config.json if you want to use \'delete\'')
    return
  }
  await daprClient.state.delete(stateName, key)
}

/**
 * Publish data to the pubsub middleware.
 * @param { string } pubsubName - The name of publish component.
 * @param { string } topic - The name of publish topic.
 * @param { Object } data - The data to be published.
 */
async function publish (pubsubName, topic, data) {
  await daprClient.pubsub.publish(pubsubName, topic, data)
}

/**
 * Send data to the binding middleware.
 * @param { string } bindingName - The name of the binding middleware.
 * @param { string } operation - The operation for the binding middleware, e.g. 'create', 'delete'.
 * @param { any } data - The data to be sent.
 */
async function send (bindingName, operation, data) {
  // FIXME: consider meatadata for the binding send
  await daprClient.binding.send(bindingName, operation, data)
}

export const openfuncContext = {
  state: {
    save: saveState,
    get: getState,
    delete: deleteState
  },
  pubsub: {
    publish
  },
  bindings: {
    send
  }
}
