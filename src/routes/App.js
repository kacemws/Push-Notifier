const mongoose = require("mongoose");
const appSchema = require("../models/AppSchema");
const App = mongoose.model("app", appSchema, "app");

const connectionString = process.env.MONGO_CONNECTION_STRING || "";
// const connectionString = `mongodb+srv://${user}:${psw}@cluster0.vktca.mongodb.net/pushService?retryWrites=true&w=majority`;

async function createApp(data) {
  const { appName, email, publicKey, privateKey, secretKey } = data;
  return new App({
    appName,
    email,
    publicKey,
    privateKey,
    secretKey,
    created: Date.now(),
  }).save();
}

async function findApp(appName) {
  return await App.findOne({ appName });
}

function connect() {
  return mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

exports.create = createApp;
exports.find = findApp;
exports.connect = connect;
