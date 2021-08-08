# Arch

In order to make full use of OpenFunction, we can add a `config.js` for the user function. However, you may not understand how does `config.js` work in our framework.

Here, we demonstrate an example to show the dataflow in the openfunction with the configuration:

> ⚠️ Before continuing reding, it would be better to read [function examples](./function-examples.md) first. Or you may be confused to the following contents.

Assume that you write two functions: Func A has a role of publisher, and Func B has a role of subscriber. To declare these two roles, you need to specify it in your `config.json`

Func B - `config.json`:

```json
{
  "input": {
    "name": "middleware",
    "uri": "test",
    "params": {
      "type": "pubsub"
    }
  }
}
```

This means that Func B has a role of *<u>subscriber</u>*, the pubsub middleware is called "middleware" and the topic that Func B subscribes is called "test".

Func A - `config.json`

```json
{
  "outputs": {
    "middleware": {
      "uri": "test",
      "params": {
        "type": "pubsub"
      }
    }
  }
}
```

`outputs` is a map data structure, as you can declare many output middleware. Here it means that the pubsub middleware is called "middleware" and the topic that Func A published is called "test".

So now let's see how does data flow in OpenFunction:

![image-20210808113548809](img/image-20210808113548809.png)

Note that now we take advantage of [dapr](https://www.dapr.io), so the graph above has a dapr sidecar.

1. Someone trigger the Func A and the data is blocked in the Dapr sidecar first;
2. Dapr sidecar forwards the data to the user function and does the business logic;
3. Function A calculates the result and publishes the result, again, it is blocked in the Dapr sidecar;
4. Because we have configured component in dapr, so the dapr sidecar sends the data to the pubsub middleware;
5. Pubsub middleware gets the data and publishes to the Func B;
6. Dapr sidecar gets the data from middleware and sends it to func B to do the subsequent business logic.