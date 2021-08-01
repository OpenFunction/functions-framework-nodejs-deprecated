import express from 'express'
import { HTTP_CODE } from '../const.js'
import { openfnContext } from './context.js'
import { openfnConfig } from './config.js'

/**
 * Handle the business logic of general openfunction requests.
 * @param { import('express').Application } app - Express application object.
 * @param { function } userFunction - User's function.
 */
function openfnGeneralHandler (app, userFunction) {
  app.use(express.json())
  app.all('/*', (req, res) => {
    try {
      userFunction(req, res, openfnContext)
    } catch (err) {
      console.error(err)
      res.status(HTTP_CODE.ERROR_UNSUPPORTED)
        .header('Content-Type', 'application/json').send(JSON.stringify(err))
    }
  })
}

/**
 * Handle the business logic of openfunction subscriber requests.
 * @param { import('express').Application } app - Express application object.
 * @param { function } userFunction - User's function.
 */
function openfnSubscribeHandler (app, userFunction) {
  if (openfnConfig.pubsubName === '' || openfnConfig.pubsubTopic === '') {
    console.error('pubsub name and pubsub topic should be specified if the mode option is \'subscribe\'')
    process.exit(1)
  }
  // the Header of pubsub mode is 'application/cloudevent+json'
  app.use(express.json({ type: ['application/*+json'] }))
  // construct dapr subscriber route
  app.get('/dapr/subscribe', (_req, res) => {
    res.json([
      {
        pubsubname: openfnConfig.pubsubName,
        topic: openfnConfig.pubsubTopic,
        route: '/'
      }
    ])
  })

  app.post('/', (req, res) => {
    try {
      userFunction(req, res, openfnContext)
    } catch (err) {
      console.error(err)
      res.status(HTTP_CODE.ERROR_UNSUPPORTED)
        .header('Content-Type', 'application/json').send(JSON.stringify(err))
    }
  })
}

/**
 * Handle the business logic of openfunction binding requests.
 * @param { import('express').Application } app - Express application object.
 * @param { function } userFunction - User's function.
 */
function openfnBindingHandler (app, userFunction) {
  if (openfnConfig.bindingName) {
    console.error('binding name should be specified if the mode option is \'binding-receive\'')
    process.exit(1)
  }
  // the Header of pubsub mode is 'application/cloudevent+json'
  app.use(express.json())
  // redirect the dapr binding receive url to the '/' silently
  app.use((req, _res, next) => {
    if (req.url === '/' + openfnConfig.bindingName) {
      req.url = '/'
    }
    next()
  })

  app.post('/', (req, res) => {
    try {
      userFunction(req, res, openfnContext)
    } catch (err) {
      console.error(err)
      res.status(HTTP_CODE.ERROR_UNSUPPORTED)
        .header('Content-Type', 'application/json').send(JSON.stringify(err))
    }
  })
}

export { openfnGeneralHandler, openfnSubscribeHandler, openfnBindingHandler }
