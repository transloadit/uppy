const DragDrop = require('./DragDrop.js')
const Dashboard = require('./Dashboard.js')

switch (window.location.pathname.toLowerCase()) {
  case '/':
  case '/dashboard.html': Dashboard(); break
  case '/dragdrop.html': DragDrop(); break
}
