const express = require("express");
const bodyParser = require("body-parser");
const graphpqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Event = require("./models/event");

//create app based off express framework
const app = express();

const events = [];

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

    input EventInput{
        title: String!
        description: String!
        price: Float!
        date: String!
    }
    type RootQuery {
        events: [Event!]!
    }

    type RootMutation{
        createEvent(eventInput: EventInput) : Event
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
      // mutate query on events query in mongoDb
      createEvent: (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
        });
        //event to DB with a try catch block
        return event
          .save()
          .then((result) => {
            console.log(result);
            return { ...result._doc };
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
        //push to events object
        events.push(event);
        return event;
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
