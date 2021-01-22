const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1];
  try {
    if (!token) return res.status(401).json({ message: "Auth Error" });
    const { err, user } = jwt.verify(token, "secret");
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Invalid Token" });
  }
};
