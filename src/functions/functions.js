
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
const parseBool = (val) => val === "true" ? true : val === "false" ? false : undefined;
const generateRandomCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
};

module.exports = { info, error, success, parseBool, generateRandomCode }