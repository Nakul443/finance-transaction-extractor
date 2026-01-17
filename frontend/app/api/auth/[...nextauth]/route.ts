// one file that acts as a "Grand Central Station."
// every time app needs to check if a user is logged in, or the user clicks "Logout,"
// the request travels to that specific path, and Auth.js handles the rest.

import { handlers } from "../../../../auth"

// In Auth.js v5, handlers is an object containing GET and POST functions.
// We export them directly to satisfy Next.js's Route Handler requirements.
export const { GET, POST } = handlers