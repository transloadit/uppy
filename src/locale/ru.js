const ru = {};

ru.strings = {
  'choose_file': 'Выберите файл',
  'or_drag_drop': 'или перенесите его сюда',
  // 'files_chosen': 'выбран %{smart_count} файл |||| выбрано %{smart_count} файла |||| выбрано %{smart_count} файлов'
  'files_chosen': {
    0: 'выбран %{smart_count} файл',
    1: 'выбрано %{smart_count} файла',
    2: 'выбрано %{smart_count} файлов'
  }
};

ru.pluralize = function (n) {
  // return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;

  if (n % 10 === 1 && n % 100 !== 11) {
    return 0;
  }

  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
    return 1;
  }

  return 2;
};

Uppy.locale.ru = ru;
export default ru;
