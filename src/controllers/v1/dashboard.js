const { success, error } = require("../../functions/functions");
const { BrandModel } = require("../../schemas/brands");
const { CategoryModal } = require("../../schemas/categories");
const { CustomerModal } = require("../../schemas/customers");
const { OrderListModel } = require("../../schemas/orders");
const { ProductModel } = require("../../schemas/product");

const getOverView = async (_req, _res) => {
    try {

        const [activeBrands, inActiveBrands] = await Promise.all([
            BrandModel.countDocuments({ status: true }),
            BrandModel.countDocuments({ status: false })
        ]);
        const [activeCategories, inActiveCategories] = await Promise.all([
            CategoryModal.countDocuments({ status: true, parent: null }),
            CategoryModal.countDocuments({ status: false, parent: null })
        ]);
        const [activeProducts, inActiveProducts] = await Promise.all([
            ProductModel.countDocuments({ status: true }),
            ProductModel.countDocuments({ status: false })
        ]);

        const [activeCustomers, inActiveCustomers] = await Promise.all([
            CustomerModal.countDocuments({ status: true }),
            CustomerModal.countDocuments({ status: false })
        ]);
        const [
            confirmedOrders,
            pendingOrders,
            cancelledOrders,
            shippedOrders,
            completedOrders,
            refundedOrders
        ] = await Promise.all([
            OrderListModel.countDocuments({ status: "confirmed" }),
            OrderListModel.countDocuments({ status: "pending" }),
            OrderListModel.countDocuments({ status: "cancelled" }),
            OrderListModel.countDocuments({ status: "shipped" }),
            OrderListModel.countDocuments({ status: "completed" }),
            OrderListModel.countDocuments({ status: "refunded" }),
        ]);



        const data = {
            brand: {
                active: activeBrands,
                inActive: inActiveBrands
            },
            categories: {
                active: activeCategories,
                inActive: inActiveCategories
            },
            products: {
                active: activeProducts,
                inActive: inActiveProducts
            },
            customers: {
                active: activeCustomers,
                inActive: inActiveCustomers
            },
            orders: {
                confirmed: confirmedOrders,
                pending: pendingOrders,
                cancelled: cancelledOrders,
                shipped: shippedOrders,
                completed: completedOrders,
                refunded: refundedOrders,
            }
        }



        return _res
            .status(200)
            .json(success(data, "Dashboard fetch successfully."));
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};

module.exports = { getOverView }