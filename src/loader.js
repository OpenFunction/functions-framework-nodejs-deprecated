import path from 'path'
import semver from 'semver'
import { readPackageUpAsync } from 'read-pkg-up'

// require cannot be used when "type" = "module" in package.json
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Dynamic import function required to load user code packaged as an
// ES module is only available on Node.js v13.2.0 and up.
//   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#browser_compatibility
const MIN_NODE_VERSION_ESMODULES = '13.2.0'

/**
 * Returns user's function from function file.
 * Returns null if function can't be retrieved.
 * @param {string} codeLocation - Directory with user's code.
 * @param {string} functionTarget - The function name.
 * TODO: A deeper explaination of two params
 * @return User's function or null.
 */
async function getUserFunction (codeLocation, functionTarget) {
  try {
    const functionModulePath = getFunctionModulePath(codeLocation)
    console.log('The functionModulePath is: ' + functionModulePath)
    if (functionModulePath === null) {
      console.error('Provided code is not a loadable module.')
      return null
    }

    let functionModule
    const esModule = await isEsModule(functionModulePath)
    if (esModule) {
      if (semver.lt(process.version, MIN_NODE_VERSION_ESMODULES)) {
        console.error(
          `Cannot load ES Module on Node.js ${process.version}. ` +
            `Please upgrade to Node.js v${MIN_NODE_VERSION_ESMODULES} and up.`
        )
        return null
      }
      functionModule = await import(functionModulePath)
    } else {
      functionModule = require(functionModulePath)
    }

    const userFunction = functionTarget
      .split('.')
      .reduce((code, functionTargetPart) => {
        if (typeof code === 'undefined') {
          return undefined
        } else {
          console.log(code)
          console.log(code[functionTargetPart])
          return code[functionTargetPart]
        }
      }, functionModule)
    console.log(userFunction)

    if (typeof userFunction === 'undefined') {
      console.error(
        `Function '${functionTarget}' is not defined in the provided ` +
          'module.\nDid you specify the correct target function to execute?'
      )
      return null
    }
    if (typeof userFunction !== 'function') {
      console.error(
        `'${functionTarget}' needs to be of type function. Got: ${typeof userFunction}`
      )
      return null
    }
    return userFunction
  } catch (err) {
    let additionalHint
    if (err.stack && err.stack.includes('Cannot find module')) {
      additionalHint =
        'Did you list all required modules in the package.json dependencies?\n'
    } else {
      additionalHint = 'Is there a syntax error in your code?\n'
    }
    console.error(
      `Provided module can't be loaded.\n${additionalHint}` +
        `Detailed stack trace: ${err.stack}`
    )
    return null
  }
}

/**
 * Returns resolved path to the module containing the user function.
 * Returns null if the module can not be identified.
 * @param {string} codeLocation - Directory with user's code.
 * @return {string | null} Resolved path or null.
 */
function getFunctionModulePath (codeLocation) {
  let path = null
  try {
    path = require.resolve(codeLocation)
  } catch (err) {
    console.log(err)
    return path
  }
  return path
}

/**
 * Determines whether the given module is an ES module.
 *
 * Implements "algorithm" described at:
 *   https://nodejs.org/api/packages.html#packages_type
 *
 * In words:
 *   1. A module with .mjs extension is an ES module.
 *   2. A module with .clj extension is not an ES module.
 *   3. A module with .js extensions where the nearest package.json's
 *      with "type": "module" is an ES module.
 *   4. Otherwise, it is not an ES module.
 *
 * @param {string} modulePath - The resolved module file path
 * @returns {Promise<boolean>} True if module is an ES module.
 */
async function isEsModule (modulePath) {
  const ext = path.extname(modulePath)
  console.log(ext)
  if (ext === '.mjs') {
    return true
  }
  if (ext === '.cjs') {
    return false
  }

  const pkg = await readPackageUpAsync({
    cwd: path.dirname(modulePath),
    normalize: false
  })

  // If package.json specifies type as 'module', it's an ES module.
  return pkg && pkg.packageJson.type === 'module'
}

export { getUserFunction }
