const mongoose = require("mongoose");
const userSchema = require("../models/UserSchema");
const User = mongoose.model("user", userSchema, "users");

const bcrypt = require("bcryptjs");

async function createUser(data) {
  const { email, firstName, lastName, username, password } = data;

  const salt = await bcrypt.genSalt(10);
  const psw = await bcrypt.hash(password, salt);

  return new User({
    email,
    firstName,
    lastName,
    username,
    password: psw,
    created: Date.now(),
  }).save();
}

async function findUser(email) {
  return await User.findOne({ email });
}

async function findUserById(id) {
  return await User.findOne({ id });
}

async function matchingPasswords(psw, storedPsw) {
  return await bcrypt.compare(psw, storedPsw);
}

exports.create = createUser;
exports.find = findUser;
exports.findUserById = findUserById;
exports.matchingPasswords = matchingPasswords;
