//middleware
const express = require("express");
// const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const router = express.Router();

const userModule = require("../logic/User");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      username,
    } = await userModule.findUserById(req.user.id);
    res.json({
      email,
      firstName,
      lastName,
      username,
    });
  } catch (err) {
    if (err.statusCode) {
      res.status(err.statusCode).json({
        message: err.body,
      });
    }
  }
});

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
      id: user.id,
    };
    // Send 200 - generated token
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: 36000,
    });
    res.status(200).json({
      accessToken,
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

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      throw {
        statusCode: 400,
        body: "missing arguments!",
      };
    }

    let user = await userModule.find(email);
    if (!user) {
      throw {
        statusCode: 400,
        body: "not found",
      };
    }

    console.log({ user });
    const isMatching = await userModule.matchingPasswords(
      password,
      user.password
    );
    if (!isMatching) {
      throw {
        statusCode: 400,
        body: "invalid credentials!",
      };
    }

    const payload = {
      id: user.id,
    };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: 36000,
    });
    res.status(200).json({
      accessToken,
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

module.exports = router;
