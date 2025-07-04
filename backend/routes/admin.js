const express = require('express');
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

router.post('/create-employee', async (req, res) => {
  console.log("✅ Received create-employee POST request");

  const { username, email } = req.body;

  const client = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new AdminCreateUserCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: username,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
    ],
    TemporaryPassword: 'Welcome@123',
    MessageAction: 'SUPPRESS',
  });

  try {
    const response = await client.send(command);
    console.log("✅ Cognito response:", response);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error creating Cognito user:", err);
    res.status(500).json({ message: 'Failed to create employee' });
  }
});

module.exports = router;
