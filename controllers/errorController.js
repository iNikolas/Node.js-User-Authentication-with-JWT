exports.ServerError = class ServerError extends Error {
    constructor(detail, status, name) {
        super(detail);
        this.name = name;
        this.status = status;
    }
}

exports.internalServerError = (error, req, res, next) => {
    console.error(`ERROR occurred ${new Date()}: ${error.message}`);
    const status = error.status || 500
    const title = error.name
    const detail = error.message

    handleErrorSubmit({status, title, detail}, req, res)
}

exports.pageNotFoundError = (req, res) => {
    const status = 404
    const title = 'HTTP 404'
    const detail = 'Not found.'

    handleErrorSubmit({status, title, detail}, req, res)
};

function handleErrorSubmit(error, req, res) {
    const pointer = req.originalUrl
    res.status(error.status)
    res.set('Content-Type', 'application/vnd.api+json')

    const resData = {
        jsonapi: {version: "1.0"},
        errors: [Object.assign(error, {source: {pointer}})]
    }
    res.json(resData)
}