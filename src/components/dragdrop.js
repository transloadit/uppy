export default (context) => {
  return `<form class="UppyDragDrop-inner"
      method="post"
      action="${context.endpoint}"
      enctype="multipart/form-data">
    <img class="UppyDragDrop-puppy" src="/images/uppy.svg" />
    <input class="UppyDragDrop-input"
           id="UppyDragDrop-input"
           type="file"
           name="files[]"
           data-multiple-caption="{count} files selected"
           multiple />
    <label class="UppyDragDrop-label" for="UppyDragDrop-input">
      <strong>${context.chooseFile}</strong>
      <span class="UppyDragDrop-dragText">${context.orDragDrop}</span>.
    </label>
  ${!context.showUploadBtn
    ? `<button class="UppyDragDrop-uploadBtn" type="submit">${context.upload}</button>`
    : ''}
  <div class="UppyDragDrop-status"></div>
  <div class="UppyDragDrop-progress"><div class="UppyDragDrop-progressInner"></div></div>
</form>`
}
