export default function (strings) {
  return `<form class="UppyDragDrop-form"
        method="post"
        action="/"
        enctype="multipart/form-data">
      <img class="UppyDragDrop-puppy" src="/images/uppy.svg">
      <input class="UppyDragDrop-input"
             type="file"
             name="files[]"
             data-multiple-caption="{count} files selected"
             multiple />
      <label class="UppyDragDrop-label" for="UppyDragDrop-input">
        <strong>${strings.chooseFile}</strong>
        <span class="UppyDragDrop-dragText">${strings.orDragDrop}</span>.
      </label>
      <button class="UppyDragDrop-btn" type="submit">Upload</button>
    <div class="UppyDragDrop-status"></div>
  </form>`
}
