import { createServer } from "http";
import app from "./app";

// Ensure that the port is a number
const port: number = parseInt(process.env.PORT || "80", 10);

// Create the HTTP server
const server = createServer(app);

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
