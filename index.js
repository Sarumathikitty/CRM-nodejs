const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const objectID = mongodb.ObjectID;

const dbURL = "mongodb://127.0.0.1:27017";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("your app is running in", port));

app.get("/", (req, res) => {
  res.send("<h1>Simple GET & POST request app..! </h1>");
});

app.post("/register", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    let db = client.db("crm");
    if (req.body.type === "employ") {
      db.collection("employ").findOne(
        { email: req.body.email },
        (err, data) => {
          if (err) throw err;
          if (data) {
            res.status(400).json({ message: "Email already exists..!!" });
          } else {
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(req.body.password, salt, (err, cryptPassword) => {
                if (err) throw err;
                req.body.password = cryptPassword;
                db.collection("users").insertOne(req.body, (err, result) => {
                  if (err) throw err;
                  client.close();
                  res
                    .status(200)
                    .json({ message: "Registration successful..!! " });
                });
              });
            });
          }
        }
      );
    } else if (req.body.type === "manager") {
      db.collection("manager").findOne(
        { email: req.body.email },
        (err, data) => {
          if (err) throw err;
          if (data) {
            res.status(400).json({ message: "Email already exists..!!" });
          } else {
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(req.body.password, salt, (err, cryptPassword) => {
                if (err) throw err;
                req.body.password = cryptPassword;
                db.collection("manager").insertOne(req.body, (err, result) => {
                  if (err) throw err;
                  client.close();
                  res
                    .status(200)
                    .json({ message: "Registration successful..!! " });
                });
              });
            });
          }
        }
      );
    } else {
      res.status(401).json({
        message: "give valid details",
      });
    }
  });
});

app.post("/login", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    if (req.body.type === "admin") {
      client
        .db("crm")
        .collection("admin")
        .findOne({ email: req.body.email }, (err, data) => {
          if (err) throw err;
          if (data) {
            bcrypt.compare(
              req.body.password,
              data.password,
              (err, validUser) => {
                if (err) throw err;
                if (validUser) {
                  jwt.sign(
                    { userId: data._id, email: data.email },
                    "uzKfyTDx4v5z6NSV",
                    { expiresIn: "1h" },
                    (err, token) => {
                      res
                        .status(200)
                        .json({ message: "Login success..!!", token });
                    }
                  );
                } else {
                  res.status(403).json({
                    message: "Bad Credentials, Login unsuccessful..!!",
                  });
                }
              }
            );
          } else {
            res.status(401).json({
              message: "Email is not registered, Kindly register..!!",
            });
          }
        });
    } else if (req.body.type === "manager") {
      client
        .db("crm")
        .collection("manager")
        .findOne({ email: req.body.email }, (err, data) => {
          if (err) throw err;
          if (data) {
            bcrypt.compare(
              req.body.password,
              data.password,
              (err, validUser) => {
                if (err) throw err;
                if (validUser) {
                  token = jwt.sign(
                    {
                      type: data.type,
                      email: data.email,
                      approve: data.Approve,
                    },
                    "uzKfyTDx4v5z6NSV",
                    { expiresIn: "1h" }
                  );
                  res.cookie("managerjwt", token);
                  res.status(200).json({
                    message: "login successful!!",
                    token,
                  });
                } else {
                  res.status(403).json({
                    message: "Bad Credentials, Login unsuccessful..!!",
                  });
                }
              }
            );
          } else {
            res.status(401).json({
              message: "Email is not registered, Kindly register..!!",
            });
          }
        });
    } else if (req.body.type === "employ") {
      client
        .db("crm")
        .collection("employ")
        .findOne({ email: req.body.email }, (err, data) => {
          if (err) throw err;
          if (data) {
            bcrypt.compare(
              req.body.password,
              data.password,
              (err, validUser) => {
                if (err) throw err;
                if (validUser) {
                  token = jwt.sign(
                    { employeetype: data.employeetype, email: data.email },
                    "uzKfyTDx4v5z6NSV",
                    { expiresIn: "1h" }
                  );
                  res.cookie("employeejwt", token);
                  res.status(200).json({
                    message: "login successful!!",
                    token,
                  });
                } else {
                  res.status(403).json({
                    message: "Bad Credentials, Login unsuccessful..!!",
                  });
                }
              }
            );
          } else {
            res.status(401).json({
              message: "Email is not registered, Kindly register..!!",
            });
          }
        });
    }
  });
});

app.get("/home", authenticatedUsers, (req, res) => {
  res
    .status(200)
    .json({ message: "Only Authenticated users can see this message..!!!" });
});

function authenticatedUsers(req, res, next) {
  if (req.headers.authorization == undefined) {
    res.status(401).json({
      message: "No token available in headers",
    });
  } else {
    jwt.verify(
      req.headers.authorization,
      "uzKfyTDx4v5z6NSV",
      (err, decodedString) => {
        if (decodedString == undefined) {
          res.status(401).json({ message: "Invalid Token" });
        } else {
          console.log(decodedString);
          next();
        }
      }
    );
  }
}

