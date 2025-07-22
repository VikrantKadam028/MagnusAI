// db.js
import mongoose from "mongoose";

export const db = mongoose.connect(
  "mongodb+srv://vikrantkk2889:clZRES2qrls0b4n9@cluster0.yqonlou.mongodb.net/",
  { dbname: "MagnusAI" }
)
  .then(() => {
    console.log("MagnusAI DB Connected!");
  })
  .catch((err) => {
    console.error("Something went wrong! DB not connected:", err.message);
  });
