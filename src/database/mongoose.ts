import mongoose from "mongoose";

const url = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;
console.log(url);

export const Conn = await mongoose.connect(url, {
  auth: {
    username: process.env.MONGO_USER,
    password: process.env.MONGO_PASS,
  },
  authSource: "admin",
  // dbName: process.env.MONGO_DB
});
