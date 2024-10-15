import mongoose from "mongoose";


const AdminSchema = new mongoose.Schema({
    UserId:{
        type:String,
        required: true,

    },

    Password:{
        type:String,
        required: true,

    },

    UserDiscordId:{
        type:String,
        required: true,
    },
})

const Admin = new mongoose.model("Admin", AdminSchema);

export default Admin;