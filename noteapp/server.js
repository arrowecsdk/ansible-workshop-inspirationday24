// server.js
const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Configure AWS
AWS.config.update({ region: 'eu-central-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient({ endpoint: new AWS.Endpoint('http://localhost:8000') });
const tableName = 'noteapp-table';

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