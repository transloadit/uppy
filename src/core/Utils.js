// This is how we roll $('.element').toggleClass in non-jQuery world
export function toggleClass(el, className) {
  if (el.classList) {
    el.classList.toggle(className);
  } else {
    var classes = el.className.split(' ');
    var existingIndex = classes.indexOf(className);

    if (existingIndex >= 0) {
      classes.splice(existingIndex, 1);
    } else {
      classes.push(className);
      el.className = classes.join(' ');
    }
  }
}

export function addClass(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ' ' + className;
  }
}

export function removeClass(el, className) {
  console.log(el);
  if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
}

// $form.on('drag dragstart dragend dragover dragenter dragleave drop');
export function addListenerMulti(el, events, func) {
  const eventsArray = events.split(' ');
  for (let event in eventsArray) {
    el.addEventListener(eventsArray[event], func, false);
  }
}
