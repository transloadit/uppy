export default class Plugin {
  // This contains boilerplate that all Plugins share - and should not be used
  // directly. It also shows which methods final plugins should implement/override,
  // this deciding on structure.
  constructor(core, opts) {
    this.core = core;
    this.opts = opts;
    this.type = 'none';
    this.name = this.constructor.name;
  }

  setProgress(percentage, current, total) {
    var finalPercentage = percentage;

    if (current !== undefined && total !== undefined) {
      var percentageOfTotal = (percentage / total);
      finalPercentage = percentageOfTotal;
      if (current > 0) {
        finalPercentage = percentage + (100/total*current);
      } else {
        finalPercentage = (current * percentage);
      }
    }

    this.core.setProgress(this, finalPercentage);
  }

  extractFiles(results) {
    console.log({
      class  : 'Plugin',
      method : 'extractFiles',
      results: results
    });

    const files = [];
    for (let i in results) {
      for (let j in results[i].files) {
        files.push(results[i].files.item(j));
      }
    }

    return files;
  }

  run(results) {
    return results;
  }
}
