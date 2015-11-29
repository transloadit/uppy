(function () {

  var each = [].forEach
  var main = document.getElementById('main')
  var doc = document.documentElement
  var body = document.body
  var header = document.getElementById('header')
  var menu = document.querySelector('.sidebar')
  var content = document.querySelector('.content')
  var mobileBar = document.getElementById('mobile-bar')

  var menuButton = mobileBar.querySelector('.menu-button')
  menuButton.addEventListener('click', function () {
    menu.classList.toggle('open')
  })

  body.addEventListener('click', function (e) {
    if (e.target !== menuButton && !menu.contains(e.target)) {
      menu.classList.remove('open')
    }
  })

  // build sidebar
  var currentPageAnchor = menu.querySelector('.sidebar-link.current')
  var isAPI = document.querySelector('.content').classList.contains('api')
  if (currentPageAnchor || isAPI) {
    var allLinks = []
    var sectionContainer
    if (false && isAPI) {
      sectionContainer = document.querySelector('.menu-root')
    } else {
      sectionContainer = document.createElement('ul')
      sectionContainer.className = 'menu-sub'
      currentPageAnchor.parentNode.appendChild(sectionContainer)
    }
    var h2s = content.querySelectorAll('h2')
    if (h2s.length) {
      each.call(h2s, function (h) {
        sectionContainer.appendChild(makeLink(h))
        var h3s = collectH3s(h)
        allLinks.push(h)
        allLinks.push.apply(allLinks, h3s)
        if (h3s.length) {
          sectionContainer.appendChild(makeSubLinks(h3s, isAPI))
        }
      })
    } else {
      h2s = content.querySelectorAll('h3')
      each.call(h2s, function (h) {
        sectionContainer.appendChild(makeLink(h))
        allLinks.push(h)
      })
    }

    var animating = false
    sectionContainer.addEventListener('click', function (e) {
      e.preventDefault()
      if (e.target.classList.contains('section-link')) {
        menu.classList.remove('open')
        setActive(e.target)
        animating = true
        setTimeout(function () {
          animating = false
        }, 400)
      }
    }, true)

    // make links clickable
    allLinks.forEach(makeLinkClickable)

    // init smooth scroll
    smoothScroll.init({
      speed: 400,
      offset: window.innerWidth > 720
        ? 40
        : 58
    })
  }

  // listen for scroll event to do positioning & highlights
  window.addEventListener('scroll', updateSidebar)
  window.addEventListener('resize', updateSidebar)

  function updateSidebar () {
    var top = doc && doc.scrollTop || body.scrollTop
    var headerHeight = header.offsetHeight
    if (top > headerHeight) {
      main.className = 'fix-sidebar'
    } else {
      main.className = ''
    }
    if (animating || !allLinks) return
    var last
    for (var i = 0; i < allLinks.length; i++) {
      var link = allLinks[i]
      if (link.offsetTop > top) {
        if (!last) last = link
        break
      } else {
        last = link
      }
    }
    if (last)
    setActive(last.id)
  }

  function makeLink (h) {
    var link = document.createElement('li')
    var text = h.textContent.replace(/\(.*\)$/, '')
    // make sure the ids are link-able...
    h.id = h.id
      .replace(/\(.*\)$/, '')
      .replace(/\$/, '')
    link.innerHTML =
      '<a class="section-link" data-scroll href="#' + h.id + '">' +
        text +
      '</a>'
    return link
  }

  function collectH3s (h) {
    var h3s = []
    var next = h.nextSibling
    while (next && next.tagName !== 'H2') {
      if (next.tagName === 'H3') {
        h3s.push(next)
      }
      next = next.nextSibling
    }
    return h3s
  }

  function makeSubLinks (h3s, small) {
    var container = document.createElement('ul')
    if (small) {
      container.className = 'menu-sub'
    }
    h3s.forEach(function (h) {
      container.appendChild(makeLink(h))
    })
    return container
  }

  function setActive (id) {
    var previousActive = menu.querySelector('.section-link.active')
    var currentActive = typeof id === 'string'
      ? menu.querySelector('.section-link[href="#' + id + '"]')
      : id
    if (currentActive !== previousActive) {
      if (previousActive) previousActive.classList.remove('active')
      currentActive.classList.add('active')
    }
  }

  function makeLinkClickable (link) {
    var wrapper = document.createElement('a')
    wrapper.href = '#' + link.id
    wrapper.setAttribute('data-scroll', '')
    link.parentNode.insertBefore(wrapper, link)
    wrapper.appendChild(link)
  }

  // Search with SwiftType

  (function(w,d,t,u,n,s,e){w['SwiftypeObject']=n;w[n]=w[n]||function(){
  (w[n].q=w[n].q||[]).push(arguments);};s=d.createElement(t);
  e=d.getElementsByTagName(t)[0];s.async=1;s.src=u;e.parentNode.insertBefore(s,e);
  })(window,document,'script','//s.swiftypecdn.com/install/v2/st.js','_st');

  _st('install','HgpxvBc7pUaPUWmG9sgv','2.0.0');

  // version select
  document.querySelector('.version-select').addEventListener('change', function (e) {
    var version = e.target.value
    if (version.indexOf('1.') !== 0) {
      version = version.replace('.', '')
      var section = window.location.pathname.match(/\/(\w+?)\//)[1]
      window.location.assign('http://' + version + '.uppyjs.io/' + section + '/')
    } else {
      // TODO when 1.x is out
    }
  })

})()
