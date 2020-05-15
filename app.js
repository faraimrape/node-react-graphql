const express = require("express");
const bodyParser = require("body-parser");
const graphpqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Event = require("./models/event");
const User = require("./models/user");
const bcrypt = require("bcryptjs");
//create app based off express framework
const app = express();

//convert incoming requests to JSON object
app.use(bodyParser.json());

//setup default route
app.use(
  "/graphql",
  graphpqlHttp({
    schema: buildSchema(`
    type Event{
        _id: ID!
        title: String!
        description: String!
        price: Float!
        date: String!
    }

    type User{
      _id: ID!
      email: String!
      password: String
    }

    input EventInput{
        title: String!
        description: String!
        price: Float!
        date: String!
    }

    input UserInput{
      email: String!
      password: String!
    }
    type RootQuery {
        events: [Event!]!
    }

    type RootMutation{
        createEvent(eventInput: EventInput) : Event
        createUser(userInput: UserInput) : User
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
    `),
    rootValue: {
      //get by events query from mongoDB
      events: () => {
        return Event.find()
          .then((events) => {
            return events.map((event) => {
              return { ...event._doc };
            });
          })
          .catch((err) => {
            throw err;
          });
      },
      // mutate event query from mongoDB
      createEvent: (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
          creator: "5ebe79d34fb90461f45b3d9f",
        });
        //write event query to mongoDB and handle with a try catch block
        let createdEvent;
        return event
          .save()
          .then((result) => {
            createdEvent = { ...result._doc };
            return User.findById("5ebe79d34fb90461f45b3d9f");
          })
          .then((user) => {
            if (!user) {
              throw new Error("User doesen't exist");
            }
            user.createdEvents.push(event);
            return user.save();
          })
          .then((result) => {
            return createdEvent;
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
      },

      //mutate user creation query and wrap around a bcrypt condition
      createUser: (args) => {
        return User.findOne({ email: args.userInput.email })
          .then((user) => {
            if (user) {
              throw new Error("User exists already");
            }
            return bcrypt.hash(args.userInput.password, 12);
          })
          .then((hashedPassword) => {
            const user = new User({
              email: args.userInput.email,
              password: hashedPassword,
            });
            return user.save();
          })
          .then((result) => {
            return { ...result._doc, password: null, _id: result.id };
          })
          .catch((err) => {
            throw err;
          });
      },
    },
    graphiql: true,
  })
);

//connect to mongo instance
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-is5mb.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
  )
  .then(() => {
    //if successful listen to requests on port 3000
    app.listen(3000);
  })
  //if connection fails throw exception
  .catch((err) => {
    console.log(err);
  });
