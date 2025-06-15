// https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/shuttingtheprocess.md
export default class AppError extends Error {
  public readonly isOperational: boolean

  constructor(description: string, isOperational: boolean) {
    super(description)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
    this.isOperational = isOperational
    Error.captureStackTrace(this)
  }
}
