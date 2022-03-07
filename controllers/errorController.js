class ServerError extends Error {
  constructor(detail, status, name) {
    super(detail);
    this.name = name;
    this.status = status;
  }
}

exports.ServerError = ServerError;

exports.internalServerError = (error, req, res, next) => {
  console.error(`ERROR occurred ${new Date()}: ${error.message}`);
  const status = error.status || 500;
  const title = error.name;
  const detail = error.message;

  handleErrorSubmit({ status, title, detail }, req, res);
};

exports.pageNotFoundError = (req, res) => {
  const status = 404;
  const title = "HTTP 404";
  const detail = "Not found.";

  handleErrorSubmit({ status, title, detail }, req, res);
};

exports.mediaTypeError = (req, res, next) => {
  try {
    const contentType = req.headers["content-type"];
    const accept = req.headers["accept"];
    if (req.body.data && contentType !== "application/vnd.api+json")
      throw new ServerError(
        "The media format of the requested data is not supported by the server, so the server is rejecting the request.",
        415,
        "Unsupported Media Type"
      );
    if (accept && accept !== "application/vnd.api+json")
      throw new ServerError(
        "Given header accept type is not supported by the server",
        406,
        "Not Acceptable"
      );
    next();
  } catch (error) {
    next(error);
  }
};

function handleErrorSubmit(error, req, res) {
  const pointer = req.originalUrl;
  res.status(error.status);
  res.set("Content-Type", "application/vnd.api+json");

  const resData = {
    jsonapi: { version: "1.0" },
    errors: [Object.assign(error, { source: { pointer } })],
  };
  res.json(resData);
}
