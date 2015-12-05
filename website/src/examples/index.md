---
title: Playground
type: examples
order: 0
---

> Playground

  <!-- Primary Page Layout
  –––––––––––––––––––––––––––––––––––––––––––––––––– -->
  <div class="container">
    <div class="row">
      <div class="twelve columns" style="margin-top: 10%">
        <h1>
          Loading..
        </h1>

        <h4>uppy</h4>
        <p>
          With this file we can easily test the built js client locally (via <code>npm run preview</code>)
          and online.
        </p>

        <form id="upload-target" class="UppyDragDrop" method="post" action="/" enctype="multipart/form-data">
            <svg class="UppyDragDrop-puppy" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125" enable-background="new 0 0 100 100"><path d="M16.582 21.3L-.085 62.713l32.94 13.295zM99.915 62.714L66.975 76.01 83.25 21.3zM50.917 68.117L62.443 56.59H37.386l11.527 11.526v5.905l-3.063 3.32 1.474 1.36 2.59-2.807 2.59 2.807 1.475-1.358-3.063-3.32zM66.976 41.415c-3.972 0-7.193-3.22-7.193-7.193 0-3.973 3.222-7.193 7.193-7.193 3.974 0 7.193 3.22 7.193 7.192 0 3.973-3.22 7.193-7.194 7.193m2.506-11.732c-.738 0-1.337.6-1.337 1.337s.6 1.336 1.337 1.336 1.337-.598 1.337-1.336-.6-1.337-1.338-1.337zM32.854 41.415c-3.973 0-7.193-3.22-7.193-7.193 0-3.973 3.22-7.193 7.194-7.193 3.973 0 7.192 3.22 7.192 7.192 0 3.973-3.22 7.193-7.192 7.193m2.506-11.732c-.738 0-1.337.6-1.337 1.337s.6 1.336 1.337 1.336 1.337-.598 1.337-1.336-.598-1.337-1.337-1.337z"/></svg>          <div>
            <input id="UppyDragDrop-input" class="UppyDragDrop-input" type="file" name="files[]" data-multiple-caption="{count} files selected" multiple />
            <label class="UppyDragDrop-label" for="UppyDragDrop-input"><strong>Choose a file</strong><span class="UppyDragDrop-dragText"> or drag it here</span>.</label>
            <!-- <button class="UppyDragDrop-btn" type="submit">Upload</button> -->
          </div>
          <div class="UppyDragDrop-status"></div>
        </form>

        <small>Puppy icon by Jorge Fernandez del Castillo Gomez <br>from the Noun Project</small>

      </div>
    </div>
  </div>

  <footer>
    <hr />
    <ul>
      <li><a href="https://travis-ci.org/transloadit/uppy">Travis</a></li>
      <li><a href="https://github.com/transloadit/uppy">GitHub</a></li>
    </ul>
  </footer>

<!-- Include the bundled app.js client -->
<script src="playground/static/js/app.js"></script>

<!-- Apply the js client on a selector -->
<script>
  // var tl = Transloadit("#upload-target");
</script>

<!-- Add the branch name to the <title> and <h1> of this page -->
<script>
  var branch        = location.pathname.split('/')[2] || 'local-unknown';
  var elTitle       = document.querySelector('title');
  var elH1          = document.querySelector('h1');
  var title         = 'You are reviewing branch: ' + branch;
  elTitle.innerHTML = title;
  elH1.innerHTML    = title;
</script>
