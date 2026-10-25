require('./scripts/build-components');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from workspace root
app.use(express.static(path.join(__dirname)));

// Health endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', pid: process.pid }));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
