export const helloHttp = (req, res) => { res.send('Hello HTTP!') }

export const helloNestedObj = {
  notFunctional: 'This is not a function, should return error if be called',
  helloWorld: (req, res) => {
    res.send('Hello World!')
  }
}

export const helloCloudEvents = (cloudevent) => {
  console.log(cloudevent.specversion)
  console.log(cloudevent.type)
  console.log(cloudevent.source)
  console.log(cloudevent.subject)
  console.log(cloudevent.id)
  console.log(cloudevent.time)
  console.log(cloudevent.datacontenttype)
  return cloudevent
}
