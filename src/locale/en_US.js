const en_US = {
  "Choose a file": "Choose a file",
  "or drag & drop": "or drag & drop"
};

en_US.pluralize = function (num) {
  if (num === 1) {
    return 'one';
  }
  return 'other';
};

Uppy.locale.en_US = en_US;
export default en_US;
