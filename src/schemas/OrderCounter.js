const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const OrderCounterSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    count: { type: Number, default: 1 },
    customer_id: { type: Types.ObjectId, ref: 'customers', required: true, index: true },
});
const OrderCountModal = mongoose.model("OrderCounter", OrderCounterSchema);
module.exports = { OrderCountModal }
