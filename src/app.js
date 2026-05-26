import express from "express";
import { User, Client, AuthorizationCode } from "../common/db/db.schema.js";
import path from "path";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { PRIVATE_KEY, PUBLIC_KEY } from "../common/utils/cert.js";
import jose from "node-jose";


const app = express();

app.use(express.json());
app.use(cookieParser());

const hashToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

const createToken = (payload) => {
    return jwt.sign(payload, PRIVATE_KEY, {
        algorithm: "RS256",
        expiresIn: "2d",
        issuer: `http://localhost:${process.env.PORT}`,
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, PUBLIC_KEY, {
        algorithms: ["RS256"],
    });
};

app.post("/auth/signup", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
    } = req.body;

    if (
      !first_name ||
      !last_name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
    });

    const access_token = createToken({
      sub: user._id,
      email: user.email,
    });

    res.cookie("access_token", access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    return res.status(201).json({
      message: "Signup successful",
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { client_id } = req.query;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const access_token = createToken({
      sub: user._id,
      email: user.email,
    });

    res.cookie("access_token", access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    // OAuth flow
    if (client_id) {
      return res.redirect(
        `/authorize?client_id=${client_id}`
      );
    }

    // normal login
    return res.status(200).json({
      message: "Login successful",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/oauth/register", async (req, res) => {
  try {
    const { app_name, redirect_uri } = req.body;

    if (!app_name || !redirect_uri) {
      return res.status(400).json({
        message: "app_name and redirect_uri are required",
      });
    }

    const client_id = crypto.randomUUID();
    const client_secret = crypto.randomBytes(32).toString("hex");

    const client = await Client.create({
      app_name,
      client_id,
      client_secret,
      redirect_uri,
    });

    return res.status(201).json({
      message: "Client registered successfully",
      client: {
        app_name: client.app_name,
        client_id: client.client_id,
        client_secret: client.client_secret,
        redirect_uri: client.redirect_uri,
      },
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/authorize", async (req, res) => {
  try {
    const { client_id } = req.query;

    if (!client_id) {
      return res.status(400).json({
        message: "Missing client_id",
      });
    }

    const client = await Client.findOne({
      client_id,
    });

    if (!client) {
      return res.status(401).json({
        message: "Invalid client",
      });
    }

    const token =
      req.cookies?.access_token;

    if (!token) {
      return res.redirect(
        `/auth/signin?client_id=${client_id}`
      );
    }

    let payload;

    try {
      payload = verifyToken(token);
    } catch {
      return res.redirect(
        `/auth/signin?client_id=${client_id}`
      );
    }

    const code = crypto
      .randomBytes(32)
      .toString("hex");

    await AuthorizationCode.create({
      code,
      client_id,
      user_id: payload.sub,
      expires_at: new Date(
        Date.now() + 5 * 60 * 1000
      ),
    });

    return res.redirect(
      `${client.redirect_uri}?code=${code}`
    );
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/token", async (req, res) => {
  try {
    const {
      client_id,
      client_secret,
      code,
    } = req.body;

    if (
      !client_id ||
      !client_secret ||
      !code
    ) {
      return res.status(400).json({
        message: "Missing parameters",
      });
    }

    // validate client
    const client = await Client.findOne({
      client_id,
    });

    if (!client) {
      return res.status(401).json({
        message: "Invalid client",
      });
    }

    if (
      client.client_secret !== client_secret
    ) {
      return res.status(401).json({
        message: "Invalid client secret",
      });
    }

    // validate authorization code
    const authorizationCode =
      await AuthorizationCode.findOne({
        code,
      });

    if (!authorizationCode) {
      return res.status(401).json({
        message: "Invalid authorization code",
      });
    }
    if (authorizationCode.expires_at < new Date()) {
      return res.status(401).json({
        message: "Authorization code expired",
      });
    }

    // verify code belongs to client
    if (
      authorizationCode.client_id !==
      client_id
    ) {
      return res.status(401).json({
        message:
          "Authorization code does not belong to client",
      });
    }

    // get user
    const user = await User.findById(
      authorizationCode.user_id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // create access token
    const access_token = createToken({
      sub: user._id,
      email: user.email,
    });

    // create id token
    const id_token = jwt.sign(
      {
        sub: user._id,
        email: user.email,
        given_name: user.first_name,
        family_name: user.last_name,

        iss: `http://localhost:${process.env.PORT}`,
        aud: client_id,
      },
      PRIVATE_KEY,
      {
        algorithm: "RS256",
        expiresIn: "1h",
      }
    );

    // one time use code
    await AuthorizationCode.deleteOne({
      code,
    });

    return res.status(200).json({
      access_token,
      id_token,
      token_type: "Bearer",
      expires_in: 3600,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/oauth/userinfo", async (req, res) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Access token missing",
      });
    }

    const access_token =
      authHeader.split(" ")[1];

    let payload;

    try {
      payload = jwt.verify(
        access_token,
        PUBLIC_KEY,
        {
          algorithms: ["RS256"],
        }
      );
    } catch {
      return res.status(401).json({
        message: "Invalid access token",
      });
    }

    const user = await User.findById(
      payload.sub
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      sub: user._id,
      email: user.email,
      given_name: user.first_name,
      family_name: user.last_name,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/.well-known/openid-configuration", async (req, res) => {
  const issuer = `http://localhost:${process.env.PORT}`;
  const authorization_endpoint = `${issuer}/authorize`;
  const userinfo_endpoint = `${issuer}/oauth/userinfo`;
  const token_endpoint = `${issuer}/token`;
  const jwks_uri = `${issuer}/.well-known/jwks.json`;

  return res.json({
    issuer,
    authorization_endpoint,
    userinfo_endpoint,
    token_endpoint,
    jwks_uri
  })
})

app.get("/.well-known/jwks.json", async (req, res) => {
  try {

    // convert PEM public key -> JWK
    const key = await jose.JWK.asKey(PUBLIC_KEY,"pem");
    const jwk = key.toJSON();
    jwk.alg = "RS256";

    return res.status(200).json({
      keys: [jwk],
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Failed to generate JWKS",
    });
  }
});

export default app;