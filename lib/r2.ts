import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 is S3-compatible, so we talk to it via the AWS S3 SDK
// pointed at the account-specific R2 endpoint.
const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";

// Public base URL the browser will use to *view* uploaded files.
// Either an r2.dev dev URL, or a custom domain you've mapped to the bucket.
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

export const r2Client = new S3Client({
  region: "auto",
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export function isR2Configured() {
  return Boolean(accountId && accessKeyId && secretAccessKey && R2_BUCKET_NAME && R2_PUBLIC_URL);
}
