const handleUrlVersion = (version) => (req, res, next) => {
    if (req.path.startsWith(`/api/${version}`)) {
        next()
    } else {
        next(new Error(`Your api version is wrong, please check again`))
    }

}
module.exports = { handleUrlVersion }