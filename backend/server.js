require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const { createSession, requireAdminAuth } = require('./middleware/auth');

const app = express();

// CORS configuration - restrict to specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please slow down' }
});

app.use(generalLimiter);

// AWS Config
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 15 // Max 15 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', requireAdminAuth, adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === Admin Login Route ===
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  // Input validation
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid input format' });
  }

  // Check for super admin credentials first
  if (
    username === process.env.SUPER_ADMIN_USERNAME &&
    password === process.env.SUPER_ADMIN_PASSWORD
  ) {
    const token = createSession(username, 'superadmin');
    return res.json({ success: true, token, role: 'superadmin' });
  }

  // Check for regular admin credentials
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = createSession(username, 'admin');
    return res.json({ success: true, token, role: 'admin' });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// === Submit Onboarding Form Route ===
app.post('/submit', upload.any(), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dob, address, panNumber,
            schoolName, collegeName, universityName, hasPostGraduation } = req.body;

    // Input validation
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const submissionId = uuidv4();
    const documents = {};

    // Upload files to S3
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fieldName = file.fieldname;
        const fileKey = `submissions/${submissionId}/${fieldName}/${Date.now()}-${file.originalname}`;

        await s3.upload({
          Bucket: process.env.S3_BUCKET,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype
        }).promise();

        const fileUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        if (!documents[fieldName]) {
          documents[fieldName] = [];
        }
        documents[fieldName].push(fileUrl);
      }
    }

    // Save to DynamoDB
    const submission = {
      id: submissionId,
      firstName,
      lastName,
      email,
      phone,
      dob: dob || null,
      address: address || null,
      panNumber: panNumber || null,
      schoolName: schoolName || null,
      collegeName: collegeName || null,
      universityName: universityName || null,
      hasPostGraduation: hasPostGraduation === 'true',
      documents: JSON.stringify(documents),
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: null
    };

    await dynamoDB.put({
      TableName: 'OnboardingSubmissions',
      Item: submission
    }).promise();

    res.json({ success: true, submissionId });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'Failed to submit onboarding form' });
  }
});

// === Get Submissions Route (Protected) ===
// Use ?includeDeleted=true to include soft-deleted records (for super admin)
app.get('/api/submissions', requireAdminAuth, async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await dynamoDB.scan({ TableName: 'OnboardingSubmissions' }).promise();

    let items = result.Items;

    // Filter out deleted records unless includeDeleted is true
    if (!includeDeleted) {
      items = items.filter(item => !item.isDeleted);
    }

    const submissions = items.map(item => {
      const documents = item.documents ? JSON.parse(item.documents) : {};
      const files = [];

      for (const field in documents) {
        const fileArray = documents[field];
        if (Array.isArray(fileArray)) {
          fileArray.forEach(url => {
            // Safely extract S3 object key
            try {
              const urlObj = new URL(url);
              const key = urlObj.pathname.substring(1); // Remove leading slash
              files.push({ key, field });
            } catch {
              // Invalid URL, skip
            }
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

// === Soft-Delete Submission Route (Protected) ===
app.post('/api/submissions/delete', requireAdminAuth, async (req, res) => {
  const { id } = req.body;

  // Input validation
  if (!id) {
    return res.status(400).json({ error: 'Missing submission id' });
  }

  const params = {
    TableName: 'OnboardingSubmissions',
    Key: { id },
    UpdateExpression: 'SET isDeleted = :deleted, deletedAt = :deletedAt',
    ExpressionAttributeValues: {
      ':deleted': true,
      ':deletedAt': new Date().toISOString()
    },
    ReturnValues: 'UPDATED_NEW'
  };

  try {
    await dynamoDB.update(params).promise();
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (err) {
    console.error('DynamoDB delete error:', err);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// === Restore Submission Route (Protected - Super Admin only) ===
app.post('/api/submissions/restore', requireAdminAuth, async (req, res) => {
  const { id } = req.body;

  // Input validation
  if (!id) {
    return res.status(400).json({ error: 'Missing submission id' });
  }

  const params = {
    TableName: 'OnboardingSubmissions',
    Key: { id },
    UpdateExpression: 'SET isDeleted = :deleted, deletedAt = :deletedAt',
    ExpressionAttributeValues: {
      ':deleted': false,
      ':deletedAt': null
    },
    ReturnValues: 'UPDATED_NEW'
  };

  try {
    await dynamoDB.update(params).promise();
    res.json({ success: true, message: 'Submission restored successfully' });
  } catch (err) {
    console.error('DynamoDB restore error:', err);
    res.status(500).json({ error: 'Failed to restore submission' });
  }
});

// === Get S3 Signed URL Route (Protected) ===
app.get('/api/s3-url', requireAdminAuth, async (req, res) => {
  const { key } = req.query;

  // Input validation
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid file key' });
  }

  // Prevent path traversal
  if (key.includes('..') || key.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid file key' });
  }

  try {
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Expires: 3600,
      ResponseContentDisposition: 'attachment'
    });
    res.json({ url });
  } catch (err) {
    console.error('S3 error:', err);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

// === Update Status Route (Protected) ===
app.post('/api/update-status', requireAdminAuth, async (req, res) => {
  const { id, status } = req.body;

  // Input validation
  if (!id || !status) {
    return res.status(400).json({ error: 'Missing id or status' });
  }

  const validStatuses = ['Pending', 'Approved', 'Rejected', 'Leave Approved', 'Leave Rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const params = {
    TableName: 'OnboardingSubmissions',
    Key: { id },
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

// === Submit Leave Request Route ===
app.post('/api/leave-request', async (req, res) => {
  try {
    const { employeeEmail, leaveType, fromDate, toDate, reason } = req.body;

    // Input validation
    if (!employeeEmail || !leaveType || !fromDate || !toDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const leaveId = uuidv4();

    const leaveRequest = {
      id: leaveId,
      employeeEmail,
      leaveType,
      fromDate,
      toDate,
      reason: reason || '',
      status: 'Pending',
      submittedAt: new Date().toISOString()
    };

    await dynamoDB.put({
      TableName: 'LeaveRequests',
      Item: leaveRequest
    }).promise();

    res.json({ success: true, leaveId });
  } catch (err) {
    console.error('Leave request error:', err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
