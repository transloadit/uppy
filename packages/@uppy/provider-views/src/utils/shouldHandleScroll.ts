const shouldHandleScroll = (event: Event): boolean => {
  const { scrollHeight, scrollTop, offsetHeight } = event.target as HTMLElement
  const scrollPosition = scrollHeight - (scrollTop + offsetHeight)

  return scrollPosition < 50
}

export default shouldHandleScroll
