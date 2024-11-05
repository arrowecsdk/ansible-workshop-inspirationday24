// create-table.js
const { dynamodbRaw } = require('./dynamodb-config');

const params = {
  TableName: 'noteapp-table',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }  // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' }  // String type
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

async function createTable() {
  try {
    const result = await dynamodbRaw.createTable(params).promise();
    console.log('Table created successfully:', result);
    
    // Wait for the table to be active
    console.log('Waiting for table to become active...');
    await dynamodbRaw.waitFor('tableExists', { TableName: 'noteapp-table' }).promise();
    console.log('Table is now active');
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('Table already exists');
    } else {
      console.error('Error creating table:', error);
      throw error;
    }
  }
}

// Run the creation script
createTable();