// one file that acts as a "Grand Central Station."
// every time app needs to check if a user is logged in, or the user clicks "Logout,"
// the request travels to that specific path, and Auth.js handles the rest.

import { handlers } from "@/auth"
export const { GET, POST } = handlers