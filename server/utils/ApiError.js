class ApiError extends Error {
  constructor(
    statusCode,
    message = "Somthing Went Wrong",
    errors = [],
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = null;
    this.message = message;
    if (stack) {
      this.stack = this.stack;
    }else{
        Error.captureStackTrace(this, this.constructor)
    }
  }
}

export {ApiError}