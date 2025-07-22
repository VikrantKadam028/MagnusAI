// db.js
import mongoose from "mongoose";

export const db = mongoose.connect(
  process.env.MONGODB_URL,
  { dbname: "MagnusAI" }
)
  .then(() => {
    console.log("MagnusAI DB Connected!");
  })
  .catch((err) => {
    console.error("Something went wrong! DB not connected:", err.message);
  });
