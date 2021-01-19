// DOT ENV CONFIGURATION
const dotenv = require("dotenv");
var dotenvExpand = require("dotenv-expand");

var myEnv = dotenv.config();
dotenvExpand(myEnv);

// REQUIRING NECESSARY APPS : EXPRESS - BODYPARSER - CORS
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const InitiateMongoServer = require("./src/utils/db");

// INIT
InitiateMongoServer();
const app = express();

// PORT
const port = process.env.PORT || 8083;

// ROUTES
const subscription = require("./src/routes/Subscription");
const user = require("./src/routes/User");

//MIDDLEWARES
app.use(bodyParser.json());
app.use(cors());
app.use("/subscription", subscription);
app.use("/user", user);

app.get("/", (req, res) => {
  res.send(
    "welcome to the push service provided by your friendly neighberhood belkacember"
  );
});

app.listen(port, () => {
  console.log(`listening on port : ${port}`);
});
