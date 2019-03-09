const bcrypt = require("bcrypt");
const saltRounds = 10;
const connection = require("../config/connection");
const jwt = require("jsonwebtoken");

module.exports = (router, app, authRoutesMethods) => {
  //registering new users
  router.post("/registerUser", authRoutesMethods.registerUser);

  //allow existing user to login
  router.post("/login", app.oauth.grant(), authRoutesMethods.login);

  router.post("/loginUser", function(req, res) {
    let items = req.body;
    connection.query(
      "SELECT * FROM users WHERE userEmail = ?",
      [items.email],
      function(err, data) {
        if (data.length == 0) {
          return res.status(404).json({ message: "User not found" });
        }

        const isMatching = bcrypt.compareSync(
          items.password,
          data[0].userPassword
        );
        if (isMatching) {
          const token = jwt.sign(
            {
              id: data[0].userId,
              email: data[0].userEmail
            },
            "someTypeOfPW"
          );
          return res
            .cookie("token", token)
            .status(200)
            .json({ message: "valid login" });
        } else {
          return res.status(401).json({ message: "Invalid Username/Password" });
        }
      }
    );
  });

  router.post("/createUser", function(req, res) {
    let items = req.body;
    connection.query(
      "SELECT * FROM users WHERE userEmail = ?",
      [items.email],
      function(err, data) {
        if (data.length > 0) {
          return res.status(404).json({ message: "User email already eists" });
        } else {
          var hash = bcrypt.hashSync(items.userPassword, saltRounds);
          connection.query(
            "INSERT INTO users (userEmail, userPassword) VALUES (?,?)",
            [items.userEmail, hash],
            function(err, data) {
              if (data) {
                res.json({
                  userid: data.insertId
                });
              } else {
                res.json(err);
              }
            }
          );
        }
      }
    );
    //return res.status(200);
  });

  return router;
};