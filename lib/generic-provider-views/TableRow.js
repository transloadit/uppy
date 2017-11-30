'use strict';

var _appendChild = require('yo-yoify/lib/appendChild');

var Column = require('./TableColumn');

module.exports = function (props) {
  var _input, _browserTableColumn, _tr;

  var classes = props.active ? 'BrowserTable-row is-active' : 'BrowserTable-row';
  var handleKeyDown = function handleKeyDown(event) {
    if (event.keyCode === 13) props.handleClick();
  };

  return _tr = document.createElement('tr'), _tr.onclick = props.handleClick, _tr.onkeydown = handleKeyDown, _tr.setAttribute('role', 'option'), _tr.setAttribute('tabindex', '0'), _tr.setAttribute('class', '' + String(classes) + ''), _appendChild(_tr, [' ', (_browserTableColumn = document.createElement('td'), _browserTableColumn.onclick = props.handleCheckboxClick, _browserTableColumn.setAttribute('class', 'BrowserTable-column'), _appendChild(_browserTableColumn, [' ', (_input = document.createElement('input'), _input.setAttribute('type', 'checkbox'), props.isChecked && _input.setAttribute('checked', 'checked'), props.isDisabled && _input.setAttribute('disabled', 'disabled'), _input), ' ']), _browserTableColumn), ' ', Column({
    getItemIcon: props.getItemIcon,
    value: props.title
  }), ' ']), _tr;
};
//# sourceMappingURL=TableRow.js.map