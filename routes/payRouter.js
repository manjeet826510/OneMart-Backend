import Razorpay from "razorpay";
import express from "express";

// Razorpay Setup

const payRouter = express.Router();

payRouter.post("/", async (req, res) => {
  console.log('hello from backend');
  try {
    // console.log('hello from try');
    const instance = new Razorpay({
      key_id: process.env.REACT_APP_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    // console.log('instance');

    const { order_id, amount, payment_capture, currency } = req.body;
    // console.log(amount);
    // console.log(amount*100);

    const options = {
      amount: amount * 100,
      currency: currency,
      receipt: order_id,
      payment_capture: payment_capture,
    };

    const order = await instance.orders.create(options);
    if (!order) {
      return res.status(500).send("Something occured");
    }

    res.status(200).json({ success: true, data: order });
    // console.log(req.body);
  } catch (error) {
    console.log(error);
  }
});

export default payRouter;
