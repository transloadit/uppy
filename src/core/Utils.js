// This is how we roll $('.element').toggleClass in non-jQuery world
function toggleClass(el, className) {
  if (el.classList) {
    el.classList.toggle(className);
  } else {
    const classes = el.className.split(' ');
    const existingIndex = classes.indexOf(className);

    if (existingIndex >= 0) {
      classes.splice(existingIndex, 1);
    } else {
      classes.push(className);
      el.className = classes.join(' ');
    }
  }
}

function addClass(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ' ' + className;
  }
}

function removeClass(el, className) {
  if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
}

// $form.on('drag dragstart dragend dragover dragenter dragleave drop');
function addListenerMulti(el, events, func) {
  const eventsArray = events.split(' ');
  for (let event in eventsArray) {
    el.addEventListener(eventsArray[event], func, false);
  }
}

export default {
  toggleClass,
  addClass,
  removeClass,
  addListenerMulti
};
