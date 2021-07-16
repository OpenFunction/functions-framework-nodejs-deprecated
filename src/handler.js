import express from 'express'

/**
 * Handle the business logic of HTTP requests.
 * @param { import('express').Application } app - Express application object.
 * @param { function } userFunction - User's function.
 */
function httpHandler (app, userFunction) {
  app.use(express.json())
  app.all('/*', (req, res) => {
    try {
      userFunction(req, res)
    } catch (err) {
      console.error(err)
      res.status(415).header('Content-Type', 'application/json').send(JSON.stringify(err))
    }
  })
}

/**
 * Handle the business logic of HTTP requests.
 * @param { import('express').Application } app - Express application object.
 * @param { function } userFunction - User's function.
 * TODO: Now only support json format
 */
function cloudeventsHandler (app, userFunction) {
  app.use('/*', (req, res, next) => {
    // if 'content-type' is undefined, then
    // the cloudevents see the datacontenttype as 'application/json' by default
    if (!req.headers['content-type']) {
      req.headers['content-type'] = 'application/json'
    }
    next()
  })
  app.use(express.json({ type: ['application/cloudevents+json', 'application/json'] }))

  app.post('/*', (req, res) => {
    try {
      const ceObj = constructCloudEventObj(req, isBinaryCloudEvent(req))

      let result = userFunction(ceObj)
      if (result === null || result === undefined) {
        result = {}
      }
      res.send(result)
    } catch (err) {
      console.error(err)
      res.status(415).header('Content-Type', 'application/json').send(JSON.stringify(err))
    }
  })
}

/**
 * Checks whether the incoming request is a CloudEvents event in binary content
 * mode. This is verified by checking the presence of required headers.
 *   https://github.com/cloudevents/spec/blob/master/http-protocol-binding.md#3-http-message-mapping
 *
 * @param { import('express').Request } req - Express request object.
 * @return { boolean } True if the request is a CloudEvents event in binary content mode,
 * false otherwise.
 */
function isBinaryCloudEvent (req) {
  return !!(
    req.header('ce-type') &&
    req.header('ce-specversion') &&
    req.header('ce-source') &&
    req.header('ce-id')
  )
}

/**
 * Construct a CloudEvents object from the incoming request.
 * @param { import('express').Request } req - Express request object.
 * @param { boolean } isBinaryMode - Check the type of the incoming request
 * @return { object } CloudEvents object.
 */
function constructCloudEventObj (req, isBinaryMode) {
  let ce = {}
  if (isBinaryMode) {
    for (const name in req.headers) {
      if (name.startsWith('ce-')) {
        const attributeName = name.substr(
          'ce-'.length
        )
        ce[attributeName] = req.header(name)
      }
      ce.datacontenttype = req.headers['content-type']
      ce.data = req.body
    }
  } else {
    if (req.body !== undefined) {
      ce = req.body
    }
  }
  return ce
}

export { httpHandler, cloudeventsHandler }
