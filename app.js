const express = require("express");
const bodyParser = require("body-parser");
const graphpqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");

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
      events: () => {
        return events;
      },
      createEvent: (args) => {
        const event = {
          _id: Math.random().toString(0),
          title: args.title,
          description: args.description,
          price: +args.price,
          date: new Date().toISOString(),
        };
        //push to events object
        events.push(event);
      },
    },
    graphiql: true,
  })
);

//add request listener on port 3000
app.listen(3000);
