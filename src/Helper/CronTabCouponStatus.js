const moment = require("moment");
const cron = require('node-cron');
const { CouponModel } = require("../schemas/coupon");

const cronCoupon = async () => {
    cron.schedule("0 0 * * *", async () => {
        let currentDate = new Date();
        currentDate = moment(currentDate)
        const retrieveCoupon = await CouponModel.find({ status: true });
        for (const item of retrieveCoupon) {
            const dateStr = item.end_date;
            const endDate = moment(dateStr)
            if (endDate.isBefore(currentDate)) {
                console.log(`Coupon expired: ${item._id}. Disabling...`);
                await CouponModel.findByIdAndUpdate(item._id, { status: false });
            }
        }
    });
};

module.exports = {
    cronCoupon
};