# Function Examples

> ⚠️ Note that your entry function file must be `index.js`

## Openfunction

Now openfunction function request only accepted one param, which is the json object in request body. The simplest function is just like below:

```js
/**
 * Send {"data": "Hello, World"}
 * @param data - data is the request body contents, which should be a json object
 */
exports.helloWorld = (data) => {
  return 'Hello, World';
};
```

Your `package.json`

```json
  "scripts": {
    "start": "functions-framework --target=helloWorld"
  }
```

You will get the response like:

```shell
$ curl localhost:8080
{"data": "Hello, World"}
```

With the assistance of [OpenFunction](https://github.com/OpenFunction/OpenFunction), you can let your function communicate with the middleware and do some cool things like pubsub and so on. If you want to learn about what happens in it, please dive into this [articles](./arch.md).

Here let's learn about how to write your functions quickly to connect to the middleware components.

### Test your function locally

To test your function-framework locally, you need to first install [docker](https://www.docker.com/) and [dapr](https://dapr.io/).

> ⚠️ Remember to run `dapr init` to init your local dapr environment

Now let's see our code.

#### Pub/sub

First, you need to specify the `input` or `outputs` or both in a json file called `config.json`, for example:

```json
{
  "input": {
    "name": "pubsub",
    "uri": "test",
    "params": {
      "type": "pubsub"
    }
  },
  "outputs": {
    "pubsub": {
      "uri": "test",
      "params": {
        "type": "pubsub"
      }
    }
  }
}
```

>  ⚠️ To understand all details of `config.json`, please read [OpenFunction Context Specs](https://github.com/OpenFunction/functions-framework/blob/main/docs/OpenFunction-context-specs.md).

**`input` means what type of your function is**. If you don't specify this field, our function is regarded as the normal HTTP request. Let's say thet you specify the filed is a `pubsub` (see `input.param.type` above), this means your function is now a subscriber in the OpenFunction, the pubsub middleware which the function subscribes is called `pubsub` (see `input.name`) and the topic is `test` (see `input.uri`).

**`outputs` means the destinations your function result goes to**. If you don't specify this field, the result just returns to the caller. Here let's say we want to send the result to `pubsub` middlware component (see `outputs.pubsub`), it's type is a `pubsub` (see `outputs.pubsub.params.type`), this means that your function is now a publisher, and your publish your result to the middleware component called `pubsub`.

The business logic in our example is easy:

```js
exports.helloWorld = async (data) => {
  console.log(data)
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
  await delay(5000)
  return data
}
```

It reads the data from request, sleep for 5 seconds the return the data. Now that I have explained the `input` and `outputs`, you can see that this function is both a publisher and a subscriber.

Your `package.json`

```json
  "scripts": {
    "start": "functions-framework --target=helloWorld --port 4000"
  }
```

Configure your pubsub middlware components:

`pubsub.yaml`

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub # midlleware component name
spec:
  type: pubsub.redis
  version: v1
  metadata:
  - name: redisHost
    value: ${YOUR_REDIS_ADDRESS}
  - name: redisPassword
    value: ""
```

Run your function by dapr:

```bash
$ dapr run --app-id hello-world --app-port 4000 --dapr-http-port 3500 --components-path ./pubsub.yaml  npm start
```

To trigger your function for the first time, send a request manually (note that pubsub mode respect the cloudevent style):

See [payload content](../mock/payload/structured.json)

```bash
$ curl -X POST \
     -d'@../mock/payload/structured.json' \
     -H'Content-Type:application/cloudevents+json' \
     http://localhost:4000/test
```

The data will be like:

```bash
== APP == { runtime: 'cloudevent' }
== APP == ::ffff:127.0.0.1 - - [07/Aug/2021:09:09:31 +0000] "POST /test HTTP/1.1" 200 - "-" "curl/7.58.0"
== APP == { data: { runtime: 'cloudevent' } }
== APP == ::ffff:127.0.0.1 - - [07/Aug/2021:09:09:36 +0000] "POST /test HTTP/1.1" 200 - "-" "fasthttp"
== APP == { data: { data: { runtime: 'cloudevent' } } }
== APP == ::ffff:127.0.0.1 - - [07/Aug/2021:09:09:41 +0000] "POST /test HTTP/1.1" 200 - "-" "fasthttp"
== APP == { data: { data: { data: [Object] } } }
== APP == ::ffff:127.0.0.1 - - [07/Aug/2021:09:09:46 +0000] "POST /test HTTP/1.1" 200 - "-" "fasthttp"
```

#### Bindings

The concept of bindings comes from dapr, see [Bindings Overview](https://docs.dapr.io/developing-applications/building-blocks/bindings/bindings-overview/) to have a deep understanding.

*<u>The logic of bindings usage is completely same as the [pub/sub](#pub/sub)</u>*, here we just show you example files:

`config.json`:

```json
{
  "input": {
    "name": "sample-topic",
    "uri": "test",
    "params": {
      "type": "bindings"
    }
  },
  "outputs": {
    "sample-topic": {
      "uri": "test",
      "params": {
        "type": "bindings",
        "operation": "create"
      }
    }
  }
}
```

`index.js`  and `package.json` are as same as files in [pub/sub](#pub/sub).

`bindings.yaml`:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: sample-topic
spec:
  type: bindings.kafka
  version: v1
  metadata:
  # Kafka broker connection setting
  - name: brokers
    value: localhost:9092
  # consumer configuration: topic and consumer group
  - name: topics
    value: sample
  - name: consumerGroup
    value: group1
  # publisher configuration: topic
  - name: publishTopic
    value: sample
  - name: authRequired
    value: "false"
```

Run your function by dapr:

```bash
$ dapr run --app-id hello-world --app-port 4000 --dapr-http-port 3500 --components-path ./bindings.yaml  npm start
```

To trigger your function for the first time, send a request manually:

See [payload content](../mock/payload/structured.json)

```bash
$ curl -X POST \
     -d'{"data": "hello"}' \
     -H'Content-Type:application/json' \
     http://localhost:4000/test
```

The data will be like:

```bash
== APP == { data: 'hello' }
== APP == ::ffff:127.0.0.1 - - [07/Aug/2021:09:09:31 +0000] "POST /test HTTP/1.1" 200 - "-" "curl/7.58.0"
== APP == { data: 'hello' }
== APP == ::ffff:127.0.0.1 - - [07/Aug/2021:09:09:36 +0000] "POST /test HTTP/1.1" 200 - "-" "fasthttp"
== APP == { data: 'hello' }
== APP == ::ffff:127.0.0.1 - - [07/Aug/2021:09:09:41 +0000] "POST /test HTTP/1.1" 200 - "-" "fasthttp"
== APP == { data: 'hello' }
== APP == ::ffff:127.0.0.1 - - [07/Aug/2021:09:09:46 +0000] "POST /test HTTP/1.1" 200 - "-" "fasthttp"
```

### Run in Kubernetes

>  TODO

## HTTP

The function framework is built on [Express](https://github.com/expressjs/express), so the function is `express style`.

### Plain text

```js
/**
 * Send "Hello, World!"
 * @param req https://expressjs.com/en/api.html#req
 * @param res https://expressjs.com/en/api.html#res
 */
exports.helloWorld = (req, res) => {
  res.send('Hello, World!')
}
```

Your `package.json`

```json
  "scripts": {
    "start": "functions-framework --target=helloWorld --source http"
  }
```

You will get the response like:

```shell
$ curl localhost:8080
Hello, World
```

### JSON object

```js
exports.helloJSON = (req, res) => { res.send({ hello: 'world' }) }
```

Your `package.json`

```json
  "scripts": {
    "start": "functions-framework --target=helloJSON --source http"
  }
```

You will get the response like:

```shell
$ curl localhost:8080
{"hello":"world"}
```

### Nested Function

```js
exports.helloNestedObj = {
  notFunctional: 'This is not a function, should return error if be called',
  helloWorld: (req, res) => {
    res.send('Hello World!')
  }
}
```

Your `package.json`

```json
  "scripts": {
    "start": "functions-framework --target=helloNestedObj.helloWorld --source http"
  }
```

You will get the response like:

```shell
$ curl localhost:8080
Hello, World
```

## Cloudevent

The functions framework can unmarshall incoming [CloudEvents](http://cloudevents.io/) payloads to a `cloudevent` object. Note that your function must use the `cloudevent-style` function signature.

```js
exports.helloCloudEvents = (cloudevent) => {
  return cloudevent
}
```

Your `package.json`

```json
  "scripts": {
    "start": "functions-framework --target=helloCloudEvents --source=cloudevent"
  }
```

**A binary one**

See [payload content](../mock/payload/binary.json)

```shell
$ curl -X POST \
     -d'@../mock/payload/binary.json' \
     -H'Content-Type:application/json' \
     -H'ce-specversion:1.0' \
     -H'ce-type:com.github.pull.create' \
     -H'ce-source:https://github.com/cloudevents/spec/pull/123' \
     -H'ce-id:45c83279-c8a1-4db6-a703-b3768db93887' \
     -H'ce-time:2019-11-06T11:17:00Z' \
     -H'ce-myextension:extension value' \
     http://localhost:8080/
# The response is
{
    "datacontenttype": "application/json",
    "data": {
        "runtime": "cloudevent"
    },
    "specversion": "1.0",
    "type": "com.github.pull.create",
    "source": "https://github.com/cloudevents/spec/pull/123",
    "id": "45c83279-c8a1-4db6-a703-b3768db93887",
    "time": "2019-11-06T11:17:00Z",
    "myextension": "extension value"
}
```

**A structed one**

See [payload content](../mock/payload/structured.json)

```shell
$ curl -X POST \
     -d'@../mock/payload/structured.json' \
     -H'Content-Type:application/cloudevents+json' \
     http://localhost:8080/
# The response is
{
    "specversion": "1.0",
    "type": "com.github.pull.create",
    "source": "https://github.com/cloudevents/spec/pull/123",
    "id": "b25e2717-a470-45a0-8231-985a99aa9416",
    "time": "2019-11-06T11:08:00Z",
    "datacontenttype": "application/json",
    "data": {
        "runtime": "cloudevent"
    }
}
```
