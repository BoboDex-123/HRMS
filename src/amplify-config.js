// amplify-config.js or App.js before any other Auth call
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

Amplify.configure({
  ...awsExports,
  Auth: {
    ...awsExports.Auth,
    storage: window.localStorage, 
  },
});
