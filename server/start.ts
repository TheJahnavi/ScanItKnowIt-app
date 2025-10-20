import app from './index.js';

// Server listener for local development
const port = process.env.PORT || 3002; // Changed to 3002 to avoid conflicts
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});