const mongoose = require("mongoose");

module.exports = (db, options) => {
  mongoose.connect(db, options);
  mongoose.connection.on("connected", () => {
    console.log("Mongoose has successfully connected!");
  });

  mongoose.connection.on("err", (err) => {
    console.log(`Mongoose connection err ${err}`);
  });
  mongoose.connection.on("disconnected", () => {
    console.log("Mongoose connection lost!");
  });
};
