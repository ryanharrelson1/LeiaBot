import mongoose from "mongoose";

const ServerConfigSchema = new mongoose.Schema({

 GuildId:{
    type: String,
    required: true,
    Unique: true,
    
 },
 LogChannel:{
    type:String,
    default: null,
 },
 ReportChannel:{
    type:String,
    default: null,
 },
 AnnoucmentChannel:{
    type: String,
    default: null,
 },
 MidPrestigeRole:{
    type:String,
    default: null,

 },
 MasterPrestigeRole:{
    type:String,
    default: null,
 },
 BirthdayRole:{
    type:String,
    default: null,
 },
 BirthdayMessage:{
    type:String,
    default: "",
 },
 LevelUpMessage:{
    type: String,
    default: "",
 },
 OwnerID:{
    type:String,
    required: true,
 }
  

})

const ServerConfig = new mongoose.model("ServerConfig", ServerConfigSchema);


export default ServerConfig;