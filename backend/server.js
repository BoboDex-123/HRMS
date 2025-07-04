require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// AWS Config
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// === Admin Login Route ===
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// === Get Submissions Route ===
app.get('/api/submissions', async (req, res) => {
  try {
    const result = await dynamoDB.scan({ TableName: 'OnboardingSubmissions' }).promise();

    const submissions = result.Items.map(item => {
      const documents = item.documents ? JSON.parse(item.documents) : {};
      const files = [];

      for (const field in documents) {
        const fileArray = documents[field];
        if (Array.isArray(fileArray)) {
          fileArray.forEach(url => {
            const key = url.split('.com/')[1]; // extract S3 object key
            files.push({ key });
          });
        }
      }

      return {
        ...item,
        files
      };
    });

    res.json(submissions);
  } catch (err) {
    console.error('DynamoDB error:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});


// === Get S3 Signed URL Route ===
app.get('/api/s3-url', async (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: 'Missing file key' });

  try {
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Expires: 3600,
      ResponseContentDisposition: 'attachment' // 👈 force download
    });
    res.json({ url });
  } catch (err) {
    console.error('S3 error:', err);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

app.post('/api/update-status', async (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Missing id or status' });
  }

  const params = {
    TableName: 'OnboardingSubmissions',
    Key: { id }, // Assuming 'id' is the partition key
    UpdateExpression: 'SET #s = :status',
    ExpressionAttributeNames: {
      '#s': 'status',
    },
    ExpressionAttributeValues: {
      ':status': status,
    },
    ReturnValues: 'UPDATED_NEW'
  };

  try {
    await dynamoDB.update(params).promise();
    res.json({ success: true });
  } catch (err) {
    console.error('DynamoDB update error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});


// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
