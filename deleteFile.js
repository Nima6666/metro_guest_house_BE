const fs = require("fs");
const path = require("path");

// Example file URL
const fileUrl =
  "http://localhost:3000/uploads/profile/bar.webp-1718610829944.webp";

// Manually extract the pathname from the URL
const urlParts = fileUrl.split("/");
const relativePath = urlParts.slice(3).join("/"); // Skip the first 3 parts to get the relative path
const filePath = path.join(__dirname, relativePath);

// Ensure the path uses correct slashes (normalize the path)
const normalizedPath = path.normalize(filePath);

console.log(`Deleting file at path: ${normalizedPath}`);

// Check if the file exists before deleting
if (fs.existsSync(normalizedPath)) {
  fs.unlink(normalizedPath, (err) => {
    if (err) {
      console.error(`Error deleting file: ${err.message}`);
    } else {
      console.log("File deleted successfully");
    }
  });
} else {
  console.log("File not found");
}
