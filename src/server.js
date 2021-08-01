import express from 'express'
import morgan from 'morgan'
import { FUNCTION_SOURCE } from './const.js'
import { cloudeventsHandler, httpHandler, openfunctionHandler } from './handler.js'

/**
 * Creates and configures an Express application and returns an HTTP server
 * which will run it.
 * @param { function } userFunction - User's function.
 * @param { string } functionSignatureType - Type of user's function signature.
 * @param { string } functionMode - Type of user's function mode, only used when function signature is openfunction
 * @return { import('express').Application } HTTP server.
 */
function getServer (userFunction, functionSignatureType, functionMode) {
  const app = express()

  // add logger
  app.use(morgan('combined'))
  // parse application/json
  // To respect X-Forwarded-For header.
  app.enable('trust proxy')
  // disable Express 'x-powered-by' header:
  // http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
  app.disable('x-powered-by')

  registerFunctionRoutes(app, userFunction, functionSignatureType, functionMode)

  return app
}

/**
 * Registers handler functions for route paths.
 * @param { import('express').Application } app - Express application object.
 * @param { function } userFunction - User's function.
 * @param { string } functionSignatureType - Type of user's function signature.
 * @param { string } functionMode - Type of user's function mode, only used when function signature is openfunction
 */
function registerFunctionRoutes (app, userFunction, functionSignatureType, functionMode) {
  if (functionSignatureType === FUNCTION_SOURCE.HTTP) {
    httpHandler(app, userFunction)
  } else if (functionSignatureType === FUNCTION_SOURCE.CLOUDEVENT) {
    cloudeventsHandler(app, userFunction)
  } else if (functionSignatureType === FUNCTION_SOURCE.OPENFUNCTION) {
    openfunctionHandler(app, userFunction, functionMode)
  }
}

export { getServer }
