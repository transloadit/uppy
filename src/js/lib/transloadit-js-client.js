window.Transloadit = function (selector) {
  var el    = document.querySelector(selector);
  var inner = ''
  inner += '<div class="transloadit-js-client">';
  inner += 'Hello world :)';
  inner += 'I am the new Transloadit js client, and as you can see, I need to be improved badly :)';
  inner += '</div>';
  el.innerHTML = inner;
};
