const awsExports = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.REACT_APP_COGNITO_APP_CLIENT_ID || '',
      region: process.env.REACT_APP_AWS_REGION || 'ap-southeast-2',
    }
  }
};

export default awsExports;
