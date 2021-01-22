//middleware
const webpush = require("web-push");
const express = require("express");
const Joi = require("joi");
const router = express.Router();
const auth = require("../middleware/auth");

//utils
const randomString = require("../utils");
const appModule = require("../logic/Subscription");

router.get("/generate/:appName", auth, async (req, res) => {
  try {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
      throw {
        statusCode: 400,
        body: "Empty request!",
      };
    }

    //get email from body
    const { email } = req.body;
    const { appName } = req.params;
    const { error } = verifyEmail({ email });

    if (error) {
      throw {
        statusCode: 400,
        body: error.details[0].message,
      };
    }

    let appInstance = await appModule.find(appName);

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

router.post("/:appName", auth, async (req, res) => {
  const { appName } = req.params;

  try {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
      throw {
        statusCode: 400,
        body: "Empty request!",
      };
    }

    const { topic, subscription, secret_key } = req.body;

    const { error } = verifySubscription({
      topic,
      endpoint: subscription?.endpoint,
      auth: subscription?.keys?.auth,
      p256dh: subscription?.keys?.p256dh,
      secret_key,
    });
    //if an argument is missing ---> error
    if (error) {
      throw {
        statusCode: 400,
        body: error.details[0].message,
      };
    }

    let appInstance = await appModule.find(appName);

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

router.delete("/:appName", auth, async (req, res) => {
  const { appName } = req.params;

  try {
    //if an argument is missing ---> error

    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
      throw {
        statusCode: 400,
        body: "Empty request!",
      };
    }

    const { topic, subscription, secret_key } = req.body;

    const { error } = verifySubscription({
      topic,
      endpoint: subscription?.endpoint,
      auth: subscription?.keys?.auth,
      p256dh: subscription?.keys?.p256dh,
      secret_key,
    });
    //if an argument is missing ---> error
    if (error) {
      throw {
        statusCode: 400,
        body: error.details[0].message,
      };
    }

    let appInstance = await appModule.find(appName);

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

router.post("/:appName/push/", auth, async (req, res) => {
  const { appName } = req.params;

  try {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
      throw {
        statusCode: 400,
        body: "Empty request!",
      };
    }

    // Get pushSubscription object
    const { topic, message, secret_key } = req.body;
    const { error } = verifyMessage({
      topic,
      title: message?.title,
      body: message?.body,
      secret_key,
    });
    if (error) {
      throw {
        statusCode: 400,
        body: error.details[0].message,
      };
    }

    let appInstance = await appModule.find(appName);

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
    const { statusCode, body } = err;
    if (statusCode) {
      res.status(statusCode).json({
        message: body,
      });
    } else {
      res.status(500);
    }
  }
});

function verifyEmail(data) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  return schema.validate(data);
}
function verifySubscription(data) {
  const schema = Joi.object({
    topic: Joi.string().required(),
    endpoint: Joi.string().required(),
    auth: Joi.string().required(),
    p256dh: Joi.string().required(),
    secret_key: Joi.string().required(),
  });

  return schema.validate(data);
}
function verifyMessage(data) {
  const schema = Joi.object({
    topic: Joi.string().required(),
    title: Joi.string().required(),
    body: Joi.string().required(),
    secret_key: Joi.string().required(),
  });

  return schema.validate(data);
}

module.exports = router;
