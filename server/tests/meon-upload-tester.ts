import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const BASE = process.env.MEON_BASE_URL || "https://esign.meon.co.in/api-integration";
const USERNAME = process.env.MEON_USERNAME;
const KEY = process.env.MEON_CLIENT_SECRET_KEY;

if (!USERNAME || !KEY) {
  console.error("Missing MEON_USERNAME or MEON_CLIENT_SECRET_KEY");
  process.exit(1);
}

const pdfBuffer = fs.readFileSync("./test.pdf");

const paths = [
  "/upload",
  "/uploads",
  "/document",
  "/document/upload",
  "/document/uploadPDF",
  "/documents",
  "/documents/upload",
  "/file/upload",
  "/file",
  "/esign/upload",
  "/esign/document",
  "/api/upload",
  "/api/v1/upload",
  "/v1/upload",
  "/v1/documents/upload",
];

// Also try different base URLs
const baseUrls = [
  BASE,
  BASE.replace("/api-integration", ""),
  "https://esign.meon.co.in",
  "https://api.esign.meon.co.in",
];

(async () => {
  for (const baseUrl of baseUrls) {
    console.log(`\n📡 Testing base URL: ${baseUrl}`);
    
    for (const path of paths) {
      const url = baseUrl.replace(/\/$/, "") + path;

      console.log("  🔍 Testing:", url);

      const form = new FormData();
      form.append("file", pdfBuffer, "test.pdf");
      form.append("fileName", "test.pdf");

      // Try POST first
      try {
        const res = await axios.post(url, form, {
          headers: {
            ...form.getHeaders(),
            username: USERNAME,
            client_secret_key: KEY,
          },
          timeout: 12000,
          validateStatus: () => true, // Don't throw on any status
        });

        if (res.status >= 200 && res.status < 300) {
          console.log("  🎉 SUCCESS (POST):", res.status, JSON.stringify(res.data).substring(0, 200));
          return;
        } else if (res.status !== 405 && res.status !== 404) {
          console.log("  ⚠️  Status:", res.status, JSON.stringify(res.data).substring(0, 100));
        }
      } catch (err: any) {
        if (err.code !== 'ECONNABORTED' && err.code !== 'ETIMEDOUT') {
          console.log("  ❌ POST Failed:", err.response?.status || err.code || err.message);
        }
      }

      // Try PUT as alternative
      if (path.includes("upload")) {
        try {
          const res = await axios.put(url, form, {
            headers: {
              ...form.getHeaders(),
              username: USERNAME,
              client_secret_key: KEY,
            },
            timeout: 12000,
            validateStatus: () => true,
          });

          if (res.status >= 200 && res.status < 300) {
            console.log("  🎉 SUCCESS (PUT):", res.status, JSON.stringify(res.data).substring(0, 200));
            return;
          }
        } catch (err: any) {
          // Silent fail for PUT
        }
      }
    }
  }

  console.log("\n❗ No endpoint worked. Possible issues:");
  console.log("   1. API requires activation/approval");
  console.log("   2. Different authentication method needed");
  console.log("   3. API documentation needed for correct endpoints");
  console.log("   4. Base URL structure is different");
})();

