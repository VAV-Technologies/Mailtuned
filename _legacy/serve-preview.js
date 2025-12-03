const express = require('express');
const path = require('path');

const app = express();
const PORT = 3003;

// Serve static files
app.use(express.static(__dirname));

// Serve preview files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'preview.html'));
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-sequence-controls.html'));
});

app.get('/gmail', (req, res) => {
    res.sendFile(path.join(__dirname, 'gmail-inbox-complete.html'));
});

app.listen(PORT, () => {
    console.log(`📺 Preview server running on http://localhost:${PORT}`);
    console.log(`🔗 Preview: http://localhost:${PORT}`);
    console.log(`🧪 Tests: http://localhost:${PORT}/test`);
    console.log(`📧 Gmail: http://localhost:${PORT}/gmail`);
});