const mongoose = require("mongoose");
const subscriptionSchema = require("./SubscriptionSchema");
const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Topic's name is required"],
  },
  subscriptions: [subscriptionSchema],
});

module.exports = topicSchema;
