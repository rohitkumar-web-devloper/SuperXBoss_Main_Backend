const express = require("express");
const productRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { upload } = require("../../middleware/upload");
const { createProduct, updateProduct, getProducts, getProductsById, getProductsBySegment, getProductsByFilters } = require("../../controllers/v1/product");

productRouter.post('/',
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'video', maxCount: 1 }
    ]),
    asyncHandler(createProduct));
productRouter.put('/:productId',
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'video', maxCount: 1 }
    ]),
    asyncHandler(updateProduct));
productRouter.get('/',
    asyncHandler(getProducts));
productRouter.get('/:productId',
    asyncHandler(getProductsById));
// productRouter.get('/',
//     asyncHandler(getProductsByFilters));
module.exports = productRouter;
