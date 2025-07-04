# Employee Onboarding System

## Project Description

This is a full-stack Employee Onboarding System designed to streamline the process of bringing new employees into an organization. It features an administrative portal for managing employee data and approvals, and an employee portal for new hires to submit their onboarding information and manage leave requests. The system leverages AWS services for robust backend infrastructure, including authentication, data storage, and file management.

## Features

*   **Admin Portal:**
    *   Create and manage employee accounts.
    *   Approve new employee onboarding submissions.
    *   Manage and approve employee leave requests.
*   **Employee Portal:**
    *   Secure login and authentication.
    *   Submit onboarding forms with necessary details.
    *   Submit and track leave requests.
    *   Upload documents (e.g., resume, ID).

## Tech Stack

### Frontend

*   **React.js:** A JavaScript library for building user interfaces.
*   **AWS Amplify UI React:** UI components for building cloud-connected applications.
*   **Material-UI (MUI):** A popular React UI framework for beautiful and responsive designs.
*   **Axios:** Promise-based HTTP client for making API requests.
*   **Formik & Yup:** For form management and validation.
*   **React Router DOM:** For declarative routing in the application.

### Backend (Node.js with Express)

*   **Node.js:** JavaScript runtime.
*   **Express.js:** Web application framework for Node.js.
*   **AWS SDK:** For interacting with AWS services (S3, DynamoDB, Cognito).
*   **`dotenv`:** For loading environment variables from a `.env` file.
*   **`cors`:** Middleware for enabling Cross-Origin Resource Sharing.
*   **`multer`:** Middleware for handling `multipart/form-data`, primarily for file uploads.
*   **`uuid`:** For generating unique IDs.

### AWS Services

*   **AWS Amplify:** Used for rapid development of cloud-powered applications, including authentication, API, and storage.
*   **Amazon Cognito:** User directory and authentication service.
*   **Amazon S3:** Object storage for storing uploaded documents.
*   **Amazon DynamoDB:** NoSQL database for storing employee and submission data.

## Architecture Overview

The application follows a client-server architecture:

*   **Frontend (React.js):** The user interface, running in the browser, interacts with the backend API and directly with AWS Amplify for authentication and some cloud operations.
*   **Backend (Node.js/Express):** Provides RESTful APIs for managing employee data, handling form submissions, and interacting with AWS services like DynamoDB and S3. It also handles authentication flows with Cognito.
*   **AWS Amplify:** Facilitates the connection between the frontend and various AWS services, simplifying authentication, API calls, and storage interactions.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (LTS version recommended)
*   **npm** (comes with Node.js)
*   **AWS CLI** (configured with your AWS credentials)
*   **AWS Amplify CLI**

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/BoboDex-123/HRMS.git
    cd HRMS
    ```

2.  **Frontend Installation:**

    ```bash
    npm install
    ```

3.  **Backend Installation:**

    ```bash
    cd backend
    npm install
    cd ..
    ```

### Configuration

1.  **Backend Environment Variables:**

    The backend requires environment variables for AWS credentials and service configurations. Create a `.env` file in the `backend/` directory based on the provided example:

    ```bash
    cp backend/.env.example backend/.env
    ```

    Open `backend/.env` and fill in your actual AWS credentials and service details. **Do not commit your `.env` file to version control.**

2.  **Amplify Configuration:**

    Ensure your Amplify project is correctly configured. You might need to run `amplify init` and `amplify push` if this is your first time setting up the Amplify backend or if there are updates to the cloud resources.

### Running the Application

1.  **Start the Backend Server:**

    Open a new terminal, navigate to the `backend` directory, and run:

    ```bash
    cd backend
    npm start
    ```

    The backend server will typically run on `http://localhost:5000`.

2.  **Start the Frontend Development Server:**

    Open another terminal, navigate to the root of the project (`employee-onboarding`), and run:

    ```bash
    npm start
    ```

    The frontend application will open in your browser, usually at `http://localhost:3000`.

## Deployment

This project uses AWS Amplify for cloud resource management and deployment. After making changes, you can deploy your backend and frontend updates using the Amplify CLI:

```bash
amplify push
```

For frontend hosting, you can configure Amplify Hosting.

## Project Structure

*   `amplify/`: AWS Amplify project configuration and backend definitions.
*   `backend/`: Node.js Express server, API routes, and backend logic.
    *   `.env`: Environment variables (ignored by Git).
    *   `.env.example`: Template for environment variables.
    *   `routes/`: Express route definitions.
    *   `server.js`: Main backend server entry point.
*   `public/`: Public assets for the React frontend.
*   `src/`: React frontend source code.
    *   `components/`: Reusable React components (e.g., Admin, Employee, common UI elements).
    *   `Pages/`: Top-level page components.
    *   `amplify-config.js`: Frontend Amplify configuration.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes. For major changes, please open an issue first to discuss what you would like to change.