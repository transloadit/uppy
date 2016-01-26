export default (context) => {
  return `<section class='Modal-authorizeForm'>
    <h1>Click here to authorize with ${context.provider}</h1>
    <button class='Modal-authorizeBtn'>Authorize</button>
  </section>`
}
