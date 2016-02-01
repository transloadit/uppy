const ru = {}

ru.strings = {
  chooseFile: 'Выберите файл',
  orDragDrop: 'или перенесите его сюда',
  youHaveChosen: 'Вы выбрали: %{file_name}',
  filesChosen: {
    0: 'Выбран %{smart_count} файл',
    1: 'Выбрано %{smart_count} файла',
    2: 'Выбрано %{smart_count} файлов'
  },
  upload: 'Загрузить'
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
