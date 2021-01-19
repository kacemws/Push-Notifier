//middleware
const express = require("express");
// const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const router = express.Router();

const userModule = require("../logic/User");

router.post("/signup", async (req, res) => {
  try {
    const { email, firstName, lastName, username, password } = req.body;
    if (!email || !firstName || !lastName || !username || !password) {
      throw {
        statusCode: 400,
        body: "missing arguments!",
      };
    }

    let user = await userModule.find(email);

    if (user) {
      throw {
        statusCode: 400,
        body: "already exisits",
      };
    }

    const data = { email, firstName, lastName, username, password };

    user = await userModule.create(data);

    const payload = {
      user: {
        id: user.id,
      },
    };

    // Send 200 - generated token
    jwt.sign(
      payload,
      "randomString",
      {
        expiresIn: 10,
      },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({
          token,
        });
      }
    );
  } catch (err) {
    console.log(err);
    if (err.statusCode) {
      res.status(err.statusCode).json({
        message: err.body,
      });
    }
  }
});

module.exports = router;
