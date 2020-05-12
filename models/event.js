const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },
});

//create a model off a mongo schema and export is app wide
module.exports = mongoose.model("Event", eventSchema);
