import express from "express";
import expressAsyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import { isAdmin, isAuth } from "../utils.js";
import mongoose from "mongoose";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

const orderRouter = express.Router();

const PAGE_SIZE = 3;

// orderRouter.get("/admin", isAuth, isAdmin, async (req, res) => {
//   console.log("hello from backend");
//   console.log(req.query);
//   const pageSize = req.query.pageSize || PAGE_SIZE;
//   const page = req.query.page || 1;

//   const orders = await Order.find()
//     .skip(pageSize * (page - 1))
//     .limit(pageSize);
//   console.log(orders);
//   // console.log(products);
//   const countOrders = await Order.countDocuments(); //4
//   // console.log(countProducts);
//   // console.log(pageSize);
//   res.send({ orders, page, pages: Math.ceil(countOrders / pageSize) });
// });

orderRouter.get("/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const pageSize = req.query.pageSize || PAGE_SIZE;
    const page = req.query.page || 1;
    const orders = await Order.find()
      .populate("user", "name")
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countOrders = await Order.countDocuments(); //4

    res.send({ orders, page, pages: Math.ceil(countOrders / pageSize) });
  })
);

orderRouter.post("/",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    // console.log(req.body);
    const newOrder = new Order({
      orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      itemsPrice: req.body.itemsPrice,
      shippingPrice: req.body.shippingPrice,
      taxPrice: req.body.taxPrice,
      totalPrice: req.body.totalPrice,
      user: req.user._id,
    });
    const order = await newOrder.save();
    res.status(201).send({ message: "New Order Created", order });
  })
);

orderRouter.get("/summary",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    // console.log("this route is hitted");

    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: { $sum: 1 },
        },
      },
    ]);
    //By using the $group stage in combination with the $sum operator, you can perform various aggregation calculations on your data, such as counting, summing, averaging, etc.,
    //User= [
    //   { _id: 1, name: "John" },
    //   { _id: 2, name: "Alice" },
    //   { _id: 3, name: "Bob" },
    //   { _id: 4, name: "Jane" }
    // ]
    //users = [
    //   {
    //     _id: null,
    //     numUsers: 4
    //   }
    // ]

    const orders = await Order.aggregate([
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },
          totalSales: { $sum: `$totalPrice` },
        },
      },
    ]);

    const dailyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          sales: { $sum: `$totalPrice` },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const productCategories = await Product.aggregate([
      {
        $group: {
          _id: `$category`,
          count: { $sum: 1 },
        },
      },
    ]);
    // productCategories = [ {}, {}] two groups formed

    res.send({ users, orders, dailyOrders, productCategories });
    // { "users": users, ...}
  })
);

orderRouter.get("/mine",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    // console.log('Hello from backend');
    // console.log(req.user);
    const orders = await Order.find({ user: req.user._id });
    // if(orders){
    //   console.log(orders);
    // }
    // else{
    //   console.log('order is empty');
    // }
    res.send(orders);
  })
);

orderRouter.get("/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(404).send({ message: "Order Not Found" });
      return;
    }
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);

orderRouter.put("/:id/pay",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    console.log("req is coming to orderRouter.put", req);
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();
      res.send({ message: "Order Paid", order: updatedOrder });
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);

export default orderRouter;
