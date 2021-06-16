const getHTMLProps = (props) => Object.fromEntries(Object.entries(props).filter(([key]) => key in HTMLElement.prototype))

module.exports = getHTMLProps
