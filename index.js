const dotenv = require("dotenv");
var dotenvExpand = require("dotenv-expand");

var myEnv = dotenv.config();
dotenvExpand(myEnv);

const express = require("express");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");
const randomString = require("./src/utils");
const appModule = require("./src/routes/App");

const app = express();
const port = process.env.PORT || 8083;

// app.use(express.json());
// or
app.use(bodyParser.json());
app.use(cors());

const publicVapidKey = process.env.PUBLIC_VAPID_KEY || "";
const privateVapidKey = process.env.PRIVATE_VAPID_KEY || "";

webpush.setVapidDetails(
  "mailto:support@neo.com",
  publicVapidKey,
  privateVapidKey
);

app.get("/", (req, res) => {
  console.log("hey bih");
  res.send(
    "welcome to the push service provided by your friendly neighberhood belkacember"
  );
});

app.get("/generate/:appName", async (req, res) => {
  try {
    //get email from body
    const { email } = req.body;
    const { appName } = req.params;

    //generate vapid keys
    const { publicKey, privateKey } = await webpush.generateVAPIDKeys();

    const secretKey = randomString();
    console.clear();

    const connector = appModule.connect();

    let appInstance = await connector.then(async () => {
      return appModule.find(appName);
    });
    const data = { appName, email, publicKey, privateKey, secretKey };

    if (appInstance) {
      res.status(400).json({
        message: "already exisits",
      });
    } else {
      appInstance = await appModule.create(data);
      console.log("created app");

      console.log({
        appInstance,
        data,
      });

      // Send 200 - generated keys
      res.status(200).json({
        publicKey,
        secretKey,
      });
    }
  } catch (err) {
    console.log(err);
    // res.status(statusCode).json({
    //   message: body,
    // });
  }
});

app.post("subscribe/:appName", async (req, res) => {
  const { topic, subscription, secret_key } = req.body;

  // will check for the topic in req.params.appName,

  // if available will push the sub

  // else, create topic then push the sub

  return res.status(201).json({
    message: "added subscription!",
  });
});

// Subscribe Route
app.post("/push/:appName", async (req, res) => {
  // Get pushSubscription object
  const subscription = req.body;
  const message = {
    title: "local testing",
  };

  console.log({ subscription, message });

  // Create payload
  const payload = JSON.stringify({ title: message.title });

  try {
    // Pass object into sendNotification
    await webpush.sendNotification(subscription, payload);

    // Send 201 - notification sent
    res.status(201).json({
      message: "sent notification successfully",
    });
  } catch ({ statusCode, body }) {
    res.status(statusCode).json({
      message: body,
    });
  }
});

app.listen(port, () => {
  console.log(`listening on port : ${port}`);
});
