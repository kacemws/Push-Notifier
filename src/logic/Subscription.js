const mongoose = require("mongoose");
const appSchema = require("../models/AppSchema");
const App = mongoose.model("app", appSchema, "app");

async function createApp(data) {
  const { appName, email, publicKey, privateKey, secretKey } = data;
  return new App({
    appName,
    email,
    publicKey,
    privateKey,
    secretKey,
    created: Date.now(),
    topics: [],
  }).save();
}

async function findApp(appName) {
  return await App.findOne({ appName });
}

async function addTopic(appName, topics) {
  return await App.findOneAndUpdate(
    { appName },
    { topics },
    {
      useFindAndModify: false,
    }
  );
}

exports.create = createApp;
exports.find = findApp;
exports.addTopic = addTopic;
