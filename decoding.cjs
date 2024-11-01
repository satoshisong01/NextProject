const jwt = require("jsonwebtoken");

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2ODMyMDU1NjgsImV4cCI6MTY4MzIwOTE2OH0.Nm_UOvZt3nJMSHg-8ouYkh3Ku6kH69IupzwTxUvFTWA";

const decoded = jwt.decode(token);
console.log(decoded);
