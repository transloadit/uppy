/**
 * Boilerplate that all Plugins share - and should not be used
 * directly. It also shows which methods final plugins should implement/override,
 * this deciding on structure.
 *
 * @param {object} main Uppy core object
 * @param {object} object with plugin options
 * @return {array | string} files or success/fail message
 */
export default class Plugin {

  constructor (core, opts) {
    this.core = core
    this.opts = opts
    this.type = 'none'
    this.name = this.constructor.name
  }

  // setProgress (percentage, current, total) {
  //   var finalPercentage = percentage
  //
  //   // if (current !== undefined && total !== undefined) {
  //   //   var percentageOfTotal = (percentage / total);
  //   //   // finalPercentage = percentageOfTotal;
  //   //   if (current > 1) {
  //   //     finalPercentage = percentage + (100 / (total * current));
  //   //   } else {
  //   //     finalPercentage = percentage;
  //   //   }
  //   // }
  //
  //   this.core.setProgress(this, finalPercentage)
  // }

  /**
   * Check if supplied `target` is a `string` or an `object`.
   * If object (that means its a plugin), search `plugins` for
   * a plugin with same name and return its target.
   *
   * @param {String|Object} target
   *
   */
  getTarget (target, callerPlugin) {
    if (typeof target === 'string') {
      this.core.log('string is a target')
      return target
    } else {
      this.core.log('plugin is a target')

      let targetPlugin = this.core.getPlugin(target.name)

      return targetPlugin.prepareTarget(callerPlugin)
    }
  }

  extractFiles (results) {
    console.log({
      class: 'Plugin',
      method: 'extractFiles',
      results: results
    })

    // check if the results array is empty
    // if (!results || !results.count) {
    //   return results
    // }

    const files = []
    results.forEach((result) => {
      try {
        Array.from(result.files).forEach((file) => files.push(file))
      } catch (e) {
        console.log(e)
      }
    })

    // const files = [];
    // for (let i in results) {
    //   for (let j in results[i].files) {
    //     files.push(results[i].files.item(j));
    //   for (let j in results[i].files) {
    //     // files.push(results[i].files.item(j));
    //   }
    // }

    // return Array.from(fileList);
    return files
  }

  focus () {
    console.log('focus pocus!')
    return
  }

  install () {
    return
  }

  run (results) {
    return results
  }
}
