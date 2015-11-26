// This is how we roll $('.element').toggleClass in non-jQuery world
export function toggleClass(el, className) {
  // console.log(el);

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
