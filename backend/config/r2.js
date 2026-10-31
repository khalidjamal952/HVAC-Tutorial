const { S3Client } = require("@aws-sdk/client-s3");

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  (R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : "");

const R2_REGION = process.env.R2_REGION || "auto";

function isR2Configured() {
  return Boolean(
    R2_ENDPOINT &&
    R2_BUCKET_NAME &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY
  );
}

const s3 = isR2Configured()
  ? new S3Client({
      region: R2_REGION,
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

module.exports = {
  s3,
  R2_BUCKET_NAME,
  isR2Configured,
};
