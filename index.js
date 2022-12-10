const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("api is running");
});

// middleware to verify jwt
function verifyJWT(req, res, nezt) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized token" });
    }
    req.decoded = decoded;
    next();
  });
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.luy57yg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const contactsCollection = client
      .db("MyAddressBook")
      .collection("contactsInfo");

    //   send token to client side
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "30d",
      });
      res.send({ token });
      //   console.log(user);
    });

    //   api to post data from client side
    app.post("/contacts", async (req, res) => {
      const contact = req.body;
      const result = await contactsCollection.insertOne(contact);
      res.send(result);
    });

    // api to get contacts
    app.get("/contacts", async (req, res) => {
      //   console.log(req.headers.authorization);
      const query = {};
      const result = await contactsCollection.find(query).toArray();
      res.send(result);
    });

    // api to delete a contact
    app.delete("/contacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await contactsCollection.deleteOne(query);
      res.send(result);
    });
    // api to get data in update contact route in client side
    app.get("/contacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await contactsCollection.findOne(query);
      res.send(result);
    });
    // api to update contact
    app.put("/contacts/:id", async (req, res) => {
      const id = req.params.id;
      const filtered = { _id: ObjectId(id) };
      const contact = req.body;
      const updatedContact = {
        $set: {
          name: contact.name,
          phone: contact.phone,
          location: contact.location,
        },
      };
      const options = { upsert: true };
      const result = await contactsCollection.updateOne(
        filtered,
        updatedContact,
        options
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));
app.listen(port, () => {
  console.log("server is running", port);
});
