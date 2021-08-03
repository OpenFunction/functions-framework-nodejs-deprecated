import express from 'express'
import { HTTP_CODE, MIDDLEWARE_TYPE } from '../const.js'
import { openfuncContext } from './context.js'
import { openfuncConfig } from './config.js'

/**
 * Handle the business logic of openfunction requests.
 * @param { import('express').Application } app - Express application object.
 * @param { function } userFunction - User's function.
 */
function openfuncHandler (app, userFunction) {
  if (openfuncConfig.input.isEmpty) {
    openfuncGeneralHandler(app, userFunction)
  }
  if (openfuncConfig.input.params.type === MIDDLEWARE_TYPE.PUBSUB) {
    openfuncSubscribeHandler(app, userFunction)
  }
  if (openfuncConfig.input.params.types === MIDDLEWARE_TYPE.BINDINGS) {
    openfuncBindingHandler(app, userFunction)
  }
}

/**
 * Handle the business logic of general openfunction requests.
 * Note that openfunction request body should be a json object.
 * @param { import('express').Application } app - Express application object.
 * @param { function } userFunction - User's function.
 */
function openfuncGeneralHandler (app, userFunction) {
  app.use(express.json())
  app.all('/', async (req, res) => {
    try {
      const data = req.body
      const result = await userFunction(data)
      if (openfuncConfig.outputs.isEmpty) {
        res.status(HTTP_CODE.SUCCESS).json({ data: result })
      } else {
        await sendResultToOutputs(result, openfuncConfig.outputs.data)
        res.status(HTTP_CODE.SUCCESS).send()
      }
    } catch (err) {
      console.error(err)
      res.status(HTTP_CODE.ERROR_UNSUPPORTED).json({ error: err })
    }
  })
}

/**
 * Handle the business logic of openfunction subscriber requests.
 * @param { import('express').Application } app - Express application object.
 * @param { function } userFunction - User's function.
 */
function openfuncSubscribeHandler (app, userFunction) {
  if (openfuncConfig.pubsubName === '' || openfuncConfig.pubsubTopic === '') {
    console.error('pubsub name and pubsub topic should be specified if the mode option is \'subscribe\'')
    process.exit(1)
  }
  // the Header of pubsub mode is 'application/cloudevent+json'
  app.use(express.json({ type: ['application/*+json'] }))
  // construct dapr subscriber route
  app.get('/dapr/subscribe', (_req, res) => {
    res.json([
      {
        pubsubname: openfuncConfig.pubsubName,
        topic: openfuncConfig.pubsubTopic,
        route: '/'
      }
    ])
  })

  app.post('/', async (req, res) => {
    try {
      await userFunction(req, res, openfuncContext)
    } catch (err) {
      console.error(err)
      res.status(HTTP_CODE.ERROR_UNSUPPORTED).json({ error: err })
    }
  })
}

/**
 * Handle the business logic of openfunction binding requests.
 * @param { import('express').Application } app - Express application object.
 * @param { function } userFunction - User's function.
 */
function openfuncBindingHandler (app, userFunction) {
  if (openfuncConfig.bindingName) {
    console.error('binding name should be specified if the mode option is \'binding-receive\'')
    process.exit(1)
  }
  // the Header of pubsub mode is 'application/cloudevent+json'
  app.use(express.json())
  // redirect the dapr binding receive url to the '/' silently
  app.use((req, _res, next) => {
    if (req.url === '/' + openfuncConfig.bindingName) {
      req.url = '/'
    }
    next()
  })

  app.post('/', async (req, res) => {
    try {
      await userFunction(req, res, openfuncContext)
    } catch (err) {
      console.error(err)
      res.status(HTTP_CODE.ERROR_UNSUPPORTED).json({ error: err })
    }
  })
}

/**
 * Send function result to the output components.
 * @param { object } result - User function result.
 * @param { array } outputs - An array of outputs to send result to.
 */
async function sendResultToOutputs (result, outputs) {
  const data = { data: result }
  try {
    await Promise.all(outputs.map(async output => {
      if (output.params.type === MIDDLEWARE_TYPE.PUBSUB) {
        await openfuncContext.pubsub.publish(data)
      }
      if (output.params.type === MIDDLEWARE_TYPE.BINDINGS) {
        await openfuncContext.bindings.send(output.params.operation, data)
      }
    }))
  } catch (err) {
    throw new Error(err)
  }
}

export { openfuncHandler }
