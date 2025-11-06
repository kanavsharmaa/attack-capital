import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js"; // Import Next.js plugin for cookie handling
import prisma from '@/lib/prisma'

// Check for the env variables first
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  // This makes it clear what's wrong if you forget to set them in your .env
  throw new Error("Missing Google OAuth environment variables (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)");
}

// Get base URL for trusted origins, using the public URL if available
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            enabled: true,
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
        }
    },
    // Add trusted origins to allow requests from your local setup and ngrok URL
    trustedOrigins: [
        "http://localhost:3000",
        ...(APP_URL ? [APP_URL] : []),
    ],

    // FIX: Cookie attributes must be nested under the 'advanced' property.
    advanced: {
        defaultCookieAttributes: {
            // Must be 'none' for cross-site cookie setting (localhost <-> ngrok URL)
            sameSite: process.env.NODE_ENV === "development" ? "none" : "lax",
            // Must be true when SameSite is 'none'
            secure: process.env.NODE_ENV === "development" ? true : false,
        }
    },

    // Add the nextCookies plugin as the last item to handle cookies in Next.js
    plugins: [
        nextCookies(),
    ]
});