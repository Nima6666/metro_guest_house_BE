const mongoose = require("mongoose");

const visitor = require("./model/visitor");

const data = require("./MOCK_DATA");

mongoose
  .connect(
    "mongodb+srv://nima:2367@cluster0.qmmq6cq.mongodb.net/MetroGuestHouse"
  )
  .then(() => {
    console.log("connected to database");
    console.time("executionTime");

    data.forEach(async (dat) => {
      const visitorToBeAdded = new visitor({
        firstname: dat.firstname,
        lastname: dat.lastname,
        phone: dat.phone,
        enteredBy: dat.enteredBy,
        enteredAt: dat.enteredAt,
        documentType: dat.documentType,
        address: dat.address,
        age: dat.age,
        occupation: dat.occupation,
        gender: dat.gender,
        documentId: dat.documentId,
      });

      // visitorToBeAdded.populate("enteredBy");

      await visitorToBeAdded.save();
      console.log("visitor added");
    });

    console.timeEnd("executionTime");
  });
