# Custom OAuth Provider + OpenID Connect Backend

A custom OAuth 2.0 and OpenID Connect (OIDC) authentication server built using Node.js, Express, MongoDB, JWT, and RSA key-based authentication.

This project implements the OAuth2 Authorization Code Flow along with important OIDC features such as ID Tokens, JWKS, and OpenID Discovery endpoints. The goal of this project was to understand how authentication providers like Google, GitHub, and Auth0 work internally.

---

## Features

- User Signup & Signin
- OAuth2 Authorization Code Flow
- OpenID Connect (OIDC) support
- JWT Authentication using RS256
- JWKS Endpoint
- OpenID Discovery Endpoint
- OAuth Client Registration
- Access Tokens & ID Tokens
- Protected UserInfo Endpoint
- HTTP-only Cookie Authentication
- MongoDB Integration
- Authorization Code Expiration & Validation

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT (`jsonwebtoken`)
- bcryptjs
- cookie-parser
- node-jose
- RSA Public/Private Key Authentication

---

## Project Structure

```txt
project/
│
├── cert/
│   ├── private-key.pem
│   └── public-key.pub
│
├── common/
│   ├── db/
│   └── utils/
│
├── public/
│   └── index.html
│
├── src/
│   └── app.js
│
├── server.js
├── package.json
└── .env
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/custom-oauth-provider-oidc-backend.git

cd custom-oauth-provider-oidc-backend
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
```

---

## Generating RSA Keys

Create a `cert` folder:

```bash
mkdir cert
```

Generate the private key:

```bash
openssl genpkey -algorithm RSA -out cert/private-key.pem -pkeyopt rsa_keygen_bits:2048
```

Generate the public key:

```bash
openssl rsa -in cert/private-key.pem -pubout -out cert/public-key.pub
```

---

## Running the Server

```bash
npm run dev
```

or

```bash
node server.js
```

---

# OAuth2 Flow

## 1. Register OAuth Client

### Endpoint

```http
POST /oauth/register
```

### Request Body

```json
{
  "app_name": "Demo App",
  "redirect_uri": "http://localhost:3000/callback"
}
```

### Response

```json
{
  "client_id": "generated_client_id",
  "client_secret": "generated_client_secret"
}
```

---

## 2. Redirect User to Authorization Endpoint

```http
GET /authorize?client_id=YOUR_CLIENT_ID
```

If the user is not authenticated, they are redirected to the login page.

---

## 3. Receive Authorization Code

After successful login:

```txt
http://localhost:3000/callback?code=AUTHORIZATION_CODE
```

---

## 4. Exchange Authorization Code for Tokens

### Endpoint

```http
POST /token
```

### Request Body

```json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "code": "AUTHORIZATION_CODE"
}
```

### Response

```json
{
  "access_token": "jwt_access_token",
  "id_token": "jwt_id_token",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

# OpenID Connect Endpoints

## OpenID Configuration Endpoint

```http
GET /.well-known/openid-configuration
```

Returns metadata about the authorization server.

---

## JWKS Endpoint

```http
GET /.well-known/jwks.json
```

Returns the public signing keys in JSON Web Key format.

---

## UserInfo Endpoint

```http
GET /oauth/userinfo
```

### Headers

```http
Authorization: Bearer ACCESS_TOKEN
```

Returns authenticated user information.

---

## JWT Authentication

This project uses:

- RS256 signing algorithm
- RSA Public/Private key pair
- JWT Access Tokens
- JWT ID Tokens

The private key is used to sign tokens, while the public key is used for verification.

---

## Security Features

- Password hashing using bcrypt
- HTTP-only authentication cookies
- RS256 asymmetric JWT signing
- One-time authorization codes
- Authorization code expiration
- Client validation
- Token verification middleware

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/authorize` | OAuth authorization endpoint |
| POST | `/token` | Exchange authorization code for tokens |
| POST | `/oauth/register` | Register OAuth client |
| POST | `/auth/signup` | User signup |
| POST | `/auth/signin` | User login |
| GET | `/oauth/userinfo` | Fetch authenticated user |
| GET | `/.well-known/openid-configuration` | OIDC discovery endpoint |
| GET | `/.well-known/jwks.json` | Public signing keys |

---

## Future Improvements

Some features that can be added in the future:

- Refresh Tokens
- PKCE Support
- OAuth Consent Screen
- Role-Based Access Control
- Rate Limiting
- Redis Session Storage
- Docker Support
- Multi-device Session Management

---

## Important Notes

- Do NOT commit private keys to GitHub
- Add `cert/private-key.pem` to `.gitignore`
- This project is intended for educational and portfolio purposes

---

## Why I Built This

The purpose of this project was to deeply understand how modern authentication systems work internally, including OAuth2, OpenID Connect, JWT signing, authorization code flow, and public/private key verification.

Instead of relying on third-party services like Auth0 or Firebase Authentication, this project implements the complete authentication flow manually to better understand backend security architecture.

---

## Author

Devansh Yaduvanshi
