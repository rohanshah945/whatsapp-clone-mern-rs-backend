import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// App Config
const app = express();
const PORT = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1080288",
  key: "05a3532cd42f7afb6477",
  secret: "89c4646ac7ed005c1e4c",
  cluster: "ap2",
  encrypted: true,
});

// Middleware
app.use(express.json());
app.use(cors());

// DB Config
const connection_url =
  "mongodb+srv://admin:admin@cluster0.gkzxy.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB Connected!");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error Triggering Pusher");
    }
  });
});
// ???

// API Routes
app.get("/", (req, res) => res.status(200).send("Hello World!"));

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

// Listen
app.listen(PORT, () => console.log(`Listening on localhost: ${PORT}`));
