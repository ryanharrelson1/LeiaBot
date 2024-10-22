import mongoose from "mongoose";

const ServerConfigSchema = new mongoose.Schema({
  guildid: {
    type: String,
    required: true,
    Unique: true,
  },
  monlog: {
    type: String,
    default: "",
  },
  logchannel: {
    type: String,
    default: null,
  },
  reportchannel: {
    type: String,
    default: null,
  },
  annoucmentchannel: {
    type: String,
    default: null,
  },
  midprestigerole: {
    type: String,
    default: null,
  },
  masterprestigerole: {
    type: String,
    default: null,
  },
  bdayrole: {
    type: String,
    default: null,
  },
  birthdaymessage: {
    type: String,
    default: "",
  },
  levelupmessage: {
    type: String,
    default: "",
  },
  xppermessage: {
    type: String,
    default: "",
  },
  maxspam: {
    type: String,
    default: "",
  },
  timedurt: {
    type: String,
    default: "",
  },
  spamlog: {
    type: String,
    default: "",
  },
  ownerid: {
    type: String,
    required: true,
  },
});

const ServerConfig = new mongoose.model("ServerConfig", ServerConfigSchema);

export default ServerConfig;
