import mongoose from "mongoose";

const birthdaySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  birthday: {
    type: String,
    required: true,
  },
});

const Birthday = new mongoose.model("Birhtday", birthdaySchema);

export default Birthday;
