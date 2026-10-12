const apiBaseUrl = process.env.VITE_API_BASE_URL?.trim();

if (!apiBaseUrl) {
  console.error(
    "VITE_API_BASE_URL is required for a production build. Set it to your deployed backend HTTPS URL, for example https://api.example.com/api/v1.",
  );
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(apiBaseUrl);
} catch {
  console.error("VITE_API_BASE_URL must be a valid absolute HTTPS URL.");
  process.exit(1);
}

if (
  parsedUrl.protocol !== "https:" ||
  parsedUrl.hostname === "localhost" ||
  parsedUrl.hostname === "127.0.0.1"
) {
  console.error("VITE_API_BASE_URL must point to the deployed backend over HTTPS.");
  process.exit(1);
}

if (!parsedUrl.pathname.replace(/\/$/, "").endsWith("/api/v1")) {
  console.error("VITE_API_BASE_URL must include the backend API path /api/v1.");
  process.exit(1);
}

console.log(`Building frontend for API: ${parsedUrl.origin}${parsedUrl.pathname}`);
