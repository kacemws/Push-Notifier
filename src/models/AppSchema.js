const mongoose = require("mongoose");
const topicSchema = require("./TopicSchema");

const appSchema = new mongoose.Schema({
  appName: {
    type: String,
    required: [true, "App's name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
  },
  publicKey: {
    type: String,
    required: [true, "Public Key is required"],
  },
  privateKey: {
    type: String,
    required: [true, "Private Key is required"],
  },
  secretKey: {
    type: String,
    required: [true, "Secret Key is required"],
  },
  created: {
    type: Date,
    required: [true, "Created date is required"],
  },
  topics: [topicSchema],
});

module.exports = appSchema;
