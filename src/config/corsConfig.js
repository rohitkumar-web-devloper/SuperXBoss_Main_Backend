const cors = require("cors")

const configureCors = () => {
    return cors({
        origin: (origin, callback) => {
            const allowOrgin = ["https://localhost:3000", "http://localhost:5173"]
            // const allowOrgin = ["https://localhost:3000", "http://]
            if (!origin || allowOrgin.includes(origin)) {
                callback(null, true)
            } else {
                callback(new Error("Not Allowd by cors"))
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept-Version"
        ],
        exposedHeaders: [
            'Content-Range', 'X-Content-Range'
        ],
        credentials: true,  //enable support for cookies
        optionsSuccessStatus: 200
    })
}

module.exports = { configureCors }