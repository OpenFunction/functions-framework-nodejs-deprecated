# functions-framework-nodejs

The Functions Framework lets you write lightweight functions that run in [OpenFunction](https://github.com/OpenFunction/OpenFunction), supports different kinds of function signature type. All you need to do is providing a function and specify a few params.

## Quickstarts

### Openfunction Style

#### Quickstart: "Hello, World" on your local machine

1. Install the functions framework:

   ```bash
   $ npm install -g @openfunction/functions-framework
   ```

2. Create an `index.js` file with the following contents:

   ```js
   exports.helloWorld = (data) => {
     return 'Hello, World';
   };
   ```

3. Run the following command:

   ```bash
   $ npx @openfunction/functions-framework --target=helloWorld --source openfunction
   ```

4. Open `http://localhost:8080/` in your browser and see *`{"data": "Hello, World"}`*.

#### Quickstart: Set up a new project

1. Create a `package.json` file using `npm init`:

   ```bash
   $ npm init
   ```

2. Create an `index.js` file with the following contents:

   ```js
   exports.helloWorld = (data) => {
     return 'Hello, World';
   };
   ```

3. Now install the Functions Framework:

   ```bash
   $ npm install @openfunction/functions-framework
   ```

4. Add a `start` script to `package.json`, with configuration passed via command-line arguments:

   ```json
     "scripts": {
       "start": "functions-framework --target=helloWorld --source openfunction"
     }
   ```

5. Use `npm start` to start the built-in local development server:

   ```shell
   $ npm start
   ...
   The functionModulePath is: /.../.../index.js
   Openfunction functions framework listening at http://localhost:8080
   ```

6. Send requests to this function using `curl` from another terminal window:

   ```shell
   $ curl localhost:8080
   # Output: {"data": "Hello, World"}
   ```

### HTTP Style

#### Quickstart: Set up a new project

1. Create a `package.json` file using `npm init`:

   ```bash
   $ npm init
   ```

2. Create an `index.js` file with the following contents:

   ```js
   exports.helloWorld = (req, res) => {
     res.send('Hello, World');
   };
   ```

3. Now install the Functions Framework:

   ```bash
   $ npm install @openfunction/functions-framework
   ```

4. Add a `start` script to `package.json`, with configuration passed via command-line arguments:

   ```json
     "scripts": {
       "start": "functions-framework --target=helloWorld --source openfunction http"
     }
   ```

5. Use `npm start` to start the built-in local development server:

   ```shell
   $ npm start
   ...
   The functionModulePath is: /.../.../index.js
   Openfunction functions framework listening at http://localhost:8080
   ```

6. Send requests to this function using `curl` from another terminal window:

   ```shell
   $ curl localhost:8080
   # Output: Hello, World
   ```

## Define Your Function

By default, functions framework see the incoming request as a Openfunction request, so the simplest function can be like this:

```js
/**
 * Send {"data": "Hello, World"}
 * @param data - data is the request body contents, which should be a json object
 */
exports.helloWorld = (data) => {
  return 'Hello, World';
};
```

Function framework support the following type of function source:

* **OpenFunction** (OpenFunction native type)
* HTTP
* CloudEvent

**Here are some [examples](doc/function-examples.md) to give you a quick view of functions definition in different function source type**.

## Configure the Functions Framework

You can configure the Functions Framework using command-line flags.

| Flag           | Required | Description                                                  |      |
| -------------- | -------- | ------------------------------------------------------------ | ---- |
| `-p, --port`   | False    | The port on which the Functions Framework listens for requests. Default: `8080` |      |
| `-t, --target` | True     | The name of the exported function to be invoked in response to requests. |      |
| `-s, --source` | False    | Function source type. Default: `http`; accepted values: `http` or  or `cloudevent` or `openfunction` |      |

You can set command-line flags in your `package.json` via the `start` script. For example:

```json
  "scripts": {
    "start": "functions-framework --target=helloWorld --source cloudevent"
  }
```

