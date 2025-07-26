
function success(data, message, pagination) {
    return {
        _payload: data,
        type: "success",
        message,
        pagination: pagination || undefined,
        success: true
    };
}

function error(statusCode, message, errors = []) {
    return {
        _payload_error: errors,
        message,
        statusCode,
        type: "error",
        success: false
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