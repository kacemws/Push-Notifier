//middleware
const express = require("express");
const Joi = require("joi");
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
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
      throw {
        statusCode: 400,
        body: "Empty request!",
      };
    }
    const { error } = verifyUsersData(req.body);

    if (error) {
      throw {
        statusCode: 400,
        body: error.details[0].message,
      };
    }

    const data = req.body;

    let user = await userModule.find(data.email);

    if (user) {
      throw {
        statusCode: 400,
        body: "already exisits",
      };
    }

    user = await userModule.create(data);

    const payload = {
      id: user.id,
    };
    // Send 200 - generated token
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
    res.status(200).json({
      accessToken,
      refreshToken,
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
  try {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
      throw {
        statusCode: 400,
        body: "Empty request!",
      };
    }
    const { error } = verifyUsersLogin(req.body);

    if (error) {
      throw {
        statusCode: 400,
        body: error.details[0].message,
      };
    }

    const { email, password } = req.body;

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
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
    res.status(200).json({
      accessToken,
      refreshToken,
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

function verifyUsersData(data) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
}

function verifyUsersLogin(data) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
}

module.exports = router;
