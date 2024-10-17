import mongoose from "mongoose";

const ConnectDb = async () => {
  try {
    await mongoose.connect(process.env.Mongo_URI);
    console.log("db connected");
  } catch (error) {
    console.error("db failed to connect", error);
  }
};

export default ConnectDb;
