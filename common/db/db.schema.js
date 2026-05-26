import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    first_name: {
      type: String,
      required: true,
      trim: true,
    },

    last_name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },
}, { timestamps: true });
export const User = mongoose.model("User", userSchema);


const clientSchema = new mongoose.Schema({
  app_name: {
    type: String,
    required: true,
  },

  client_id: {
    type: String,
    required: true,
    unique: true,
  },

  client_secret: {
    type: String,
    required: true,
  },

  redirect_uri: {
    type: String,
    required: true,
  },
}, { timestamps: true });
export const Client = mongoose.model("Client", clientSchema);


const authorizationCodeSchema = new mongoose.Schema({

  code: {
    type: String,
    required: true,
    unique: true,
  },

  client_id: {
    type: String,
    required: true,
  },

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  expires_at: {
    type: Date,
    required: true,
    expires: 0,
  },
  
}, { timestamps: true });
export const AuthorizationCode = mongoose.model("AuthorizationCode", authorizationCodeSchema);

