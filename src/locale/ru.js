const ru = {}

ru.strings = {
  chooseFile: 'Выберите файл',
  youHaveChosen: 'или перенесите его сюда',
  orDragDrop: 'Вы выбрали: %{file_name}',
  filesChosen: {
    0: 'Выбран %{smart_count} файл',
    1: 'Выбрано %{smart_count} файла',
    2: 'Выбрано %{smart_count} файлов'
  }
}

ru.pluralize = function (n) {
  if (n % 10 === 1 && n % 100 !== 11) {
    return 0
  }

  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
    return 1
  }

  return 2
}

if (typeof window.Uppy !== 'undefined') {
  window.Uppy.locale.ru = ru
}

export default ru
