export default (fn) => {
  return (...args) => {
    return fn(...args).catch(args[2])
  }
}
