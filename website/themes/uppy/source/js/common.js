// eslint-disable-next-line func-names
(function () {
  let each = [].forEach
  let doc = document.documentElement
  let { body } = document

  let isIndex = body.classList.contains('page-index')

  // On index page
  if (isIndex) {
    IndexPage()
  // On inner pages
  } else {
    InnerPage()
  }

  function InnerPage () {
    // var main = document.querySelector('.js-MainContent')
    let menuButton = document.querySelector('.js-MenuBtn')
    let header = document.querySelector('.js-MainHeader')
    let menu = document.querySelector('.js-Sidebar')
    let content = document.querySelector('.js-Content')
    let transloaditBar = document.querySelector('.js-TransloaditBar')

    let animating = false
    let allLinks = []

    // // listen for scroll event to do positioning & highlights
    // window.addEventListener('scroll', updateSidebar)
    // window.addEventListener('resize', updateSidebar)

    function makeSidebarTop () {
      let headerHeight = header.offsetHeight
      let transloaditBarHeight = 0

      if (transloaditBar) {
        transloaditBarHeight = transloaditBar.offsetHeight
      }

      if (window.matchMedia('(min-width: 1024px)').matches) {
        let headerTopOffset = header.getBoundingClientRect().top
        menu.style.top = `${headerHeight + headerTopOffset}px`
      } else {
        menu.style.paddingTop = `${headerHeight + transloaditBarHeight + 20}px`
      }
    }

    makeSidebarTop()

    window.addEventListener('scroll', makeSidebarTop)
    window.addEventListener('resize', makeSidebarTop)

    function updateSidebar () {
      let top = (doc && doc.scrollTop) || body.scrollTop
      let headerHeight = header.offsetHeight
      if (top > (headerHeight - 25)) {
        // main.classList.add('fix-sidebar')
        header.classList.add('fix-header')
      } else {
        // main.classList.remove('fix-sidebar')
        header.classList.remove('fix-header')
      }
      if (animating || !allLinks) return
      let last
      for (let i = 0; i < allLinks.length; i++) {
        let link = allLinks[i]
        if (link.offsetTop > top) {
          if (!last) last = link
          break
        } else {
          last = link
        }
      }
      if (last) {
        setActive(last.id)
      }
    }

    function makeLink (h) {
      let link = document.createElement('li')
      let text = h.textContent.replace(/\(.*\)$/, '')
      // make sure the ids are link-able...
      h.id = h.id
        .replace(/\(.*\)$/, '')
        .replace(/\$/, '')
      link.innerHTML = `<a class="section-link" data-scroll href="#${h.id}">${
        text
      }</a>`
      return link
    }

    function collectH3s (h) {
      let h3s = []
      let next = h.nextSibling
      while (next && next.tagName !== 'H2') {
        if (next.tagName === 'H3') {
          h3s.push(next)
        }
        next = next.nextSibling
      }
      return h3s
    }

    function makeSubLinks (h3s, small) {
      let container = document.createElement('ul')
      if (small) {
        container.className = 'menu-sub'
      }
      h3s.forEach((h) => {
        container.appendChild(makeLink(h))
      })
      return container
    }

    function setActive (id) {
      let previousActive = menu.querySelector('.section-link.active')
      let currentActive = typeof id === 'string'
        ? menu.querySelector(`.section-link[href="#${id}"]`)
        : id
      if (currentActive !== previousActive) {
        if (previousActive) previousActive.classList.remove('active')
        currentActive.classList.add('active')
      }
    }

    function makeLinkClickable (link) {
      if (link.getAttribute('data-scroll') === 'no') {
        return
      }
      let wrapper = document.createElement('a')
      wrapper.href = `#${link.id}`
      wrapper.setAttribute('data-scroll', '')
      link.parentNode.insertBefore(wrapper, link)
      wrapper.appendChild(link)
    }

    menuButton.addEventListener('click', () => {
      menu.classList.toggle('is-open')
    })

    body.addEventListener('click', (e) => {
      if (e.target !== menuButton && !menu.contains(e.target)) {
        menu.classList.remove('is-open')
      }
    })

    function initSubHeaders () {
      // build sidebar
      let currentPageAnchor = menu.querySelector('.sidebar-link.current')
      let isDocs = content.classList.contains('docs')

      if (!isDocs) return

      if (currentPageAnchor) {
        let sectionContainer

        // if (false && isAPI) {
        //   sectionContainer = document.querySelector('.menu-root')
        // } else {
        //   sectionContainer = document.createElement('ul')
        //   sectionContainer.className = 'menu-sub'
        //   currentPageAnchor.parentNode.appendChild(sectionContainer)
        // }

        sectionContainer = document.createElement('ul')
        sectionContainer.className = 'menu-sub'
        currentPageAnchor.parentNode.appendChild(sectionContainer)

        let h2s = content.querySelectorAll('h2')

        if (h2s.length) {
          each.call(h2s, (h) => {
            sectionContainer.appendChild(makeLink(h))
            let h3s = collectH3s(h)
            allLinks.push(h)
            // eslint-disable-next-line prefer-spread
            allLinks.push.apply(allLinks, h3s)
            if (h3s.length) {
              sectionContainer.appendChild(makeSubLinks(h3s, isDocs))
            }
          })
        } else {
          let h3s = content.querySelectorAll('h3')
          each.call(h3s, (h) => {
            sectionContainer.appendChild(makeLink(h))
            allLinks.push(h)
          })
        }

        sectionContainer.addEventListener('click', (e) => {
          e.preventDefault()
          if (e.target.classList.contains('section-link')) {
            menu.classList.remove('open')
            setActive(e.target)
            animating = true
            setTimeout(() => {
              animating = false
            }, 400)
          }
        }, true)

        // make links clickable
        allLinks.forEach(makeLinkClickable)

        // init smooth scroll
        window.smoothScroll.init({
          speed: 400,
          // offset: window.innerWidth > 720
          //   ? 40
          //   : 58
        })
      }

      // listen for scroll event to do positioning & highlights
      window.addEventListener('scroll', updateSidebar)
      window.addEventListener('resize', updateSidebar)
    }

    let isBlog = menu.classList.contains('is-blog')
    if (!isBlog) {
      initSubHeaders()
    }
  }

  function IndexPage () {
    // Tabs
    window.addEventListener('load', () => {
      let tabs = document.querySelectorAll('.Tabs-link')

      function myTabClicks (tabClickEvent) {
        for (let i = 0; i < tabs.length; i++) {
          tabs[i].classList.remove('Tabs-link--active')
        }

        let clickedTab = tabClickEvent.currentTarget
        clickedTab.classList.add('Tabs-link--active')
        tabClickEvent.preventDefault()
        tabClickEvent.stopPropagation()

        let myContentPanes = document.querySelectorAll('.TabPane')

        for (let i = 0; i < myContentPanes.length; i++) {
          myContentPanes[i].classList.remove('TabPane--active')
        }

        // storing reference to event.currentTarget, otherwise we get
        // all the children like SVGs, instead of our target — the link element
        let anchorReference = tabClickEvent.currentTarget
        let activePaneId = anchorReference.getAttribute('href')
        let activePane = document.querySelector(activePaneId)
        activePane.classList.add('TabPane--active')
      }

      for (let i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', myTabClicks)
      }
    })

    let tagline = document.querySelector('.MainHeader-tagline')
    let taglinePart = document.querySelector('.MainHeader-taglinePart')
    let taglineList = document.querySelector('.MainHeader-taglineList')
    let taglineCounter = taglineList.children.length

    function shuffleTaglines () {
      for (let i = taglineList.children.length; i >= 0; i--) {
        // eslint-disable-next-line no-bitwise
        taglineList.appendChild(taglineList.children[Math.random() * i | 0])
      }
    }

    function loopTaglines () {
      taglineCounter--
      if (taglineCounter >= 0) {
        let taglineText = taglineList.children[taglineCounter].textContent
        showTagline(taglineText)
        return
      }
      taglineCounter = taglineList.children.length
      loopTaglines()
    }

    function showTagline (taglineText) {
      tagline.classList.remove('is-visible')
      setTimeout(() => {
        taglinePart.innerHTML = taglineText
        tagline.classList.add('is-visible')
      }, 800)
    }

    shuffleTaglines()
    loopTaglines()
    setInterval(loopTaglines, 4000)
  }
}())
