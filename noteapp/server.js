Server.js with DynamoDB Config

// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { dynamodb, testConnection } = require('./dynamodb-config');

const app = express();
const tableName = 'noteapp-table';

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Test DynamoDB connection on server start
testConnection()
  .then(() => {
    console.log('Successfully connected to local DynamoDB');
  })
  .catch(err => {
    console.error('Failed to connect to DynamoDB:', err);
    // You might want to exit the process here depending on your requirements
    // process.exit(1);
  });

// Get all notes
app.get('/api/notes', async (req, res) => {
    try {
        const data = await dynamodb.scan({ TableName: tableName }).promise();
        res.json(data.Items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new note
app.post('/api/notes', async (req, res) => {
    const note = {
        id: Date.now().toString(),
        content: req.body.content
    };

    try {
        await dynamodb.put({
            TableName: tableName,
            Item: note
        }).promise();
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a note
app.put('/api/notes/:id', async (req, res) => {
    try {
        await dynamodb.update({
            TableName: tableName,
            Key: { id: req.params.id },
            UpdateExpression: 'set content = :content',
            ExpressionAttributeValues: {
                ':content': req.body.content
            }
        }).promise();
        res.json({ message: 'Note updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a note
app.delete('/api/notes/:id', async (req, res) => {
    try {
        await dynamodb.delete({
            TableName: tableName,
            Key: { id: req.params.id }
        }).promise();
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});