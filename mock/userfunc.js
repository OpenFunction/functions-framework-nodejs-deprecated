export const helloHttp = (req, res) => { res.send('Hello HTTP!') }

export const helloNestedObj = {
  notFunctional: 'This is not a function, should return error if be called',
  helloWorld: (req, res) => {
    res.send('Hello World!')
  }
}

export const helloJSON = (req, res) => { res.send({ hello: 'world' }) }

export const helloCloudEvents = (cloudevent) => {
  return cloudevent
}
