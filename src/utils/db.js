const mongoose = require("mongoose");

const connectionString = process.env.MONGO_CONNECTION_STRING || "";

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("connected to db");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
module.exports = InitiateMongoServer;
