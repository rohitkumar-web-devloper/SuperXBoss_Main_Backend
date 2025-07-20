
function success(data, message, pagination) {
    return {
        _payload: data,
        type: "success",
        message,
        pagination: pagination || undefined
    };
}

function error(statusCode, message, errors = []) {
    return {
        _payload_error: errors,
        message,
        statusCode,
        type: "error"
    };
}
function info(message, data = null) {
    return {
        _payload_error: data,
        message,
        type: "info"
    };
}

module.exports = { info, error, success }