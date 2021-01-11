const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: [true, "Endpoint is required"],
  },
  keys: {
    p256dh: {
      type: String,
      required: [true, "p256dh is required"],
    },
    auth: {
      type: String,
      required: [true, "Auth is required"],
    },
  },
});

module.exports = subscriptionSchema;
