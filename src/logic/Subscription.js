const mongoose = require("mongoose");
const appSchema = require("../models/AppSchema");
const App = mongoose.model("app", appSchema, "app");

async function createApp(data) {
  const { appName, email, publicKey, privateKey, secretKey, owner } = data;
  return new App({
    owner,
    appName,
    email,
    publicKey,
    privateKey,
    secretKey,
    created: Date.now(),
    topics: [],
  }).save();
}

async function findApp(appName, owner) {
  return await App.findOne({ appName, owner });
}

async function addTopic(appName, owner, topics) {
  return await App.findOneAndUpdate(
    { appName, owner },
    { topics },
    {
      useFindAndModify: false,
    }
  );
}

exports.create = createApp;
exports.find = findApp;
exports.addTopic = addTopic;
