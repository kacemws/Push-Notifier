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

    const connector = appModule.connect();

    let appInstance = await connector.then(async () => {
      return appModule.find(appName);
    });

    if (appInstance) {
      throw {
        statusCode: 400,
        body: "already exisits",
      };
    }
    //generate vapid keys
    const { publicKey, privateKey } = await webpush.generateVAPIDKeys();

    const secretKey = randomString();

    const data = { appName, email, publicKey, privateKey, secretKey };

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
  } catch (err) {
    console.log(err);
    if (err.statusCode) {
      res.status(err.statusCode).json({
        message: err.body,
      });
    }
  }
});

app.post("/subscribe/:appName", async (req, res) => {
  const { topic, subscription, secret_key } = req.body;
  const { appName } = req.params;

  try {
    //if an argument is missing ---> error
    if (
      !topic ||
      !subscription?.endpoint ||
      !subscription?.keys?.auth ||
      !subscription?.keys?.p256dh ||
      !secret_key
    ) {
      throw {
        statusCode: 400,
        body: "missing arguments!",
      };
    }
    const connector = appModule.connect();

    let appInstance = await connector.then(async () => {
      return appModule.find(appName);
    });

    //if the given app doesn't exists ---> error
    if (!appInstance) {
      throw {
        statusCode: 404,
        body: "app doesn't exisit",
      };
    }

    const { secretKey, topics } = appInstance;
    if (secretKey != secret_key) {
      throw {
        statusCode: 403,
        body: "secret keys not matching",
      };
    }

    let index = topics.findIndex(({ name }) => name == topic);

    //if the given topic doesn't exists ---> create new one
    if (index == -1) {
      index =
        topics.push({
          name: topic,
          subscriptions: [],
        }) - 1;
    }

    //get given subscription's index (to check if it exists or not)
    let subIndex = topics[index].subscriptions.findIndex(
      ({ endpoint, keys }) =>
        endpoint == subscription.endpoint &&
        JSON.stringify(keys) == JSON.stringify(subscription.keys)
    );

    // if already subscribed in that given topic ---> error
    if (subIndex != -1) {
      throw {
        statusCode: 404,
        body: "already subscribed!",
      };
    }

    // if the conditions are all met, add subscription
    topics[index].subscriptions.push(subscription);
    await appModule.addTopic(appName, topics);

    res.status(201).json({
      message: "added subscription!",
    });
  } catch (err) {
    console.log(err);
    if (err.statusCode) {
      res.status(err.statusCode).json({
        message: err.body,
      });
    }
  }
});

app.delete("/subscribe/:appName", async (req, res) => {
  const { topic, subscription, secret_key } = req.body;
  const { appName } = req.params;

  try {
    //if an argument is missing ---> error
    if (
      !topic ||
      !subscription?.endpoint ||
      !subscription?.keys?.auth ||
      !subscription?.keys?.p256dh ||
      !secret_key
    ) {
      throw {
        statusCode: 400,
        body: "missing arguments!",
      };
    }
    const connector = appModule.connect();

    let appInstance = await connector.then(async () => {
      return appModule.find(appName);
    });

    //if the given app doesn't exists ---> error
    if (!appInstance) {
      throw {
        statusCode: 404,
        body: "app doesn't exisit",
      };
    }

    const { secretKey, topics } = appInstance;

    // if the secret keys are not matching ---> error
    if (secretKey != secret_key) {
      throw {
        statusCode: 403,
        body: "secret keys not matching",
      };
    }

    let index = topics.findIndex(({ name }) => name == topic);

    //if the given topic doesn't exists ---> error
    if (index == -1) {
      throw {
        statusCode: 404,
        body: "topic not found!",
      };
    }

    //get given subscription's index (to check if it exists or not)
    let subIndex = topics[index].subscriptions.findIndex(
      ({ endpoint, keys }) =>
        endpoint == subscription.endpoint &&
        JSON.stringify(keys) == JSON.stringify(subscription.keys)
    );

    // if subscription not found in that given topic ---> error
    if (subIndex == -1) {
      throw {
        statusCode: 404,
        body: "subscription not found",
      };
    }

    //if all conditions are met, deleting subscription!
    topics[index].subscriptions.splice(subIndex, 1);
    await appModule.addTopic(appName, topics);

    res.status(201).json({
      message: "deleted subscription!",
    });
  } catch (err) {
    console.log(err);
    if (err.statusCode) {
      res.status(err.statusCode).json({
        message: err.body,
      });
    }
  }
});

// Subscribe Route
app.post("/push/:appName", async (req, res) => {
  // Get pushSubscription object
  const { topic, message, secret_key } = req.body;
  const { appName } = req.params;

  try {
    if (!topic || !message?.title || !message?.body || !secret_key) {
      throw {
        statusCode: 400,
        body: "missing arguments!",
      };
    }

    const connector = appModule.connect();

    let appInstance = await connector.then(async () => {
      return appModule.find(appName);
    });

    //if the given app doesn't exists ---> error
    if (!appInstance) {
      throw {
        statusCode: 404,
        body: "app doesn't exisit",
      };
    }

    const { secretKey, topics, publicKey, privateKey, email } = appInstance;

    // if the secret keys are not matching ---> error
    if (secretKey != secret_key) {
      throw {
        statusCode: 403,
        body: "secret keys not matching",
      };
    }

    let index = topics.findIndex(({ name }) => name == topic);

    //if the given topic doesn't exists ---> error
    if (index == -1) {
      throw {
        statusCode: 404,
        body: "topic not found!",
      };
    }

    //if conditions are met, prepare webpush and send notifications
    webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);

    const payload = JSON.stringify({ title: message.title });

    // Pass object into sendNotification
    for await (subscription of topics[index].subscriptions) {
      delete subscription["_id"];
      await webpush.sendNotification(subscription, payload);
    }

    // Send 201 - notification sent
    res.status(201).json({
      message: "sent notifications successfully",
    });
  } catch (err) {
    //{ statusCode, body }
    console.log(err);
    res.status(500).json({
      message: "wait",
    });
  }
});

app.listen(port, () => {
  console.log(`listening on port : ${port}`);
});
