const { execSync } = require("child_process");

const PORT = 8787;

try {
  // Find process using port XXXX on Mac/Linux
  const command = `lsof -i tcp:${PORT} | grep LISTEN | awk '{print $2}' | xargs kill -9`;
  execSync(command, { stdio: "inherit" });
  console.log(`Successfully killed process on port ${PORT}`);
} catch (error) {
  // If no process is found, lsof will throw an error, which is fine
  console.log(`No process found running on port ${PORT}`);
}
