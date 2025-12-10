import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import CustomDropzone from './CustomDropzone';
import {
    Box,
    Button,
    TextField,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Paper,
    Grid,
    CircularProgress,
    Alert,
    FormControlLabel,
    Checkbox,
    Container,
} from '@mui/material';
import { motion } from 'framer-motion';
import config from '../../config';

const steps = ['Personal Information', 'Education Details', 'Document Upload'];

// Validation schema for each step
const stepValidationSchemas = [
    // Step 0: Personal Information
    Yup.object({
        firstName: Yup.string().required('First name is required'),
        lastName: Yup.string().required('Last name is required'),
        dob: Yup.date().required('Date of Birth is required'),
        permanentAddress: Yup.string().required('Permanent address is required'),
        email: Yup.string().email('Invalid email').required('Email is required'),
        phone: Yup.string().matches(/^[0-9]{10}$/, "Phone number must be 10 digits").required("Phone number is required"),
    }),
    // Step 1: Education Details
    Yup.object({
        panNumber: Yup.string().matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format (e.g., ABCDE1234F)').required('PAN is required'),
        schoolName: Yup.string().required('School name is required'),
        collegeName: Yup.string().required('College name is required'),
        universityName: Yup.string().when('hasPostGraduation', {
            is: true,
            then: (schema) => schema.required('University name is required for post graduation'),
            otherwise: (schema) => schema.notRequired()
        }),
    }),
    // Step 2: Document Upload (no Yup validation, handled separately)
    Yup.object({}),
];

// Full validation schema for final submission
const fullValidationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    dob: Yup.date().required('Date of Birth is required'),
    permanentAddress: Yup.string().required('Permanent address is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string().matches(/^[0-9]{10}$/, "Phone number must be 10 digits").required("Phone number is required"),
    panNumber: Yup.string().matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format').required('PAN is required'),
    schoolName: Yup.string().required('School name is required'),
    collegeName: Yup.string().required('College name is required'),
    universityName: Yup.string().when('hasPostGraduation', {
        is: true,
        then: (schema) => schema.required('University name is required for post graduation'),
        otherwise: (schema) => schema.notRequired()
    }),
});

const OnboardingForm = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [files, setFiles] = useState({
        aadhaar: [],
        pan: [],
        marksheet: [],
        semesterMarksheets: [],
        postGraduationCertificate: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [fileErrors, setFileErrors] = useState({});

    const formik = useFormik
    ({
        initialValues: {
            firstName: '',
            lastName: '',
            dob: '',
            permanentAddress: '',
            email: '',
            phone: '',
            panNumber: '',
            schoolName: '',
            collegeName: '',
            universityName: '',
            hasPostGraduation: false,
        },
        validationSchema: fullValidationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values) => {
            // Validate files on final submission
            const newFileErrors = {};
            if (files.aadhaar.length === 0) {
                newFileErrors.aadhaar = 'Aadhaar card is required';
            }
            if (files.pan.length === 0) {
                newFileErrors.pan = 'PAN card is required';
            }
            if (files.marksheet.length === 0) {
                newFileErrors.marksheet = '12th marksheet is required';
            }
            if (files.semesterMarksheets.length === 0) {
                newFileErrors.semesterMarksheets = 'At least one semester marksheet is required';
            }
            if (values.hasPostGraduation && files.postGraduationCertificate.length === 0) {
                newFileErrors.postGraduationCertificate = 'Post graduation certificate is required';
            }

            if (Object.keys(newFileErrors).length > 0) {
                setFileErrors(newFileErrors);
                setSubmitError('Please upload all required documents');
                return;
            }

            setIsSubmitting(true);
            setSubmitError('');
            try {
                const formData = new FormData();

                Object.entries(values).forEach(([key, value]) => {
                    formData.append(key, value);
                });

                Object.entries(files).forEach(([key, fileArray]) => {
                    if (Array.isArray(fileArray)) {
                        fileArray.forEach((file) => {
                            if (file) formData.append(key, file);
                        });
                    }
                });

                const response = await fetch(`${config.API_URL}/submit`, {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Submission failed');
                }

                const result = await response.json();
                if (result.success) {
                    setSubmitSuccess(true);
                } else {
                    throw new Error(result.error || 'Submission failed');
                }
            }
            catch (error) {
                setSubmitError(error.message || 'Submission failed, please try again');
                console.error('Submission error', error);
            }
            finally {
                setIsSubmitting(false);
            }
        },
    });

    // Get fields to validate for current step
    const getFieldsForStep = (step) => {
        switch (step) {
            case 0:
                return ['firstName', 'lastName', 'dob', 'permanentAddress', 'email', 'phone'];
            case 1:
                return ['panNumber', 'schoolName', 'collegeName', ...(formik.values.hasPostGraduation ? ['universityName'] : [])];
            case 2:
                return [];
            default:
                return [];
        }
    };

    const validateStep = async (step) => {
        const fieldsToValidate = getFieldsForStep(step);

        // Touch all fields in the current step to show errors
        const touchedFields = {};
        fieldsToValidate.forEach(field => {
            touchedFields[field] = true;
        });
        formik.setTouched({ ...formik.touched, ...touchedFields });

        // Validate using step-specific schema
        try {
            await stepValidationSchemas[step].validate(formik.values, { abortEarly: false });
            return true;
        } catch (err) {
            return false;
        }
    };

    const handleNext = async () => {
        if (activeStep === steps.length - 1) {
            // Final step - submit the form
            formik.handleSubmit();
        } else {
            // Validate current step before proceeding
            const isValid = await validateStep(activeStep);
            if (isValid) {
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleFileChange = (name) => (newFiles) => {
        // Clear file error when files are added
        if (fileErrors[name]) {
            setFileErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }

        if (name === 'semesterMarksheets') {
            setFiles(prev => ({
                ...prev,
                [name]: [...(prev[name] || []), ...newFiles].slice(0, 8)
            }));
        } else {
            setFiles(prev => ({
                ...prev,
                [name]: newFiles
            }));
        }
    };

    const removeFile = (category, index) => {
        setFiles(prev => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== index)
        }));
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="firstName"
                                name="firstName"
                                label="First Name"
                                value={formik.values.firstName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                                helperText={formik.touched.firstName && formik.errors.firstName}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="lastName"
                                name="lastName"
                                label="Last Name"
                                value={formik.values.lastName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                                helperText={formik.touched.lastName && formik.errors.lastName}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="dob"
                                name="dob"
                                label="Date of Birth"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formik.values.dob}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.dob && Boolean(formik.errors.dob)}
                                helperText={formik.touched.dob && formik.errors.dob}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="phone"
                                name="phone"
                                label="Phone Number"
                                placeholder="10-digit mobile number"
                                value={formik.values.phone}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.phone && Boolean(formik.errors.phone)}
                                helperText={formik.touched.phone && formik.errors.phone}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label="Email"
                                type="email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="permanentAddress"
                                name="permanentAddress"
                                label="Permanent Address"
                                multiline
                                rows={3}
                                value={formik.values.permanentAddress}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.permanentAddress && Boolean(formik.errors.permanentAddress)}
                                helperText={formik.touched.permanentAddress && formik.errors.permanentAddress}
                                required
                            />
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="schoolName"
                                name="schoolName"
                                label="School Name (10th/12th)"
                                value={formik.values.schoolName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.schoolName && Boolean(formik.errors.schoolName)}
                                helperText={formik.touched.schoolName && formik.errors.schoolName}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="collegeName"
                                name="collegeName"
                                label="College/University Name"
                                value={formik.values.collegeName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.collegeName && Boolean(formik.errors.collegeName)}
                                helperText={formik.touched.collegeName && formik.errors.collegeName}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="panNumber"
                                name="panNumber"
                                label="PAN Number"
                                placeholder="ABCDE1234F"
                                value={formik.values.panNumber}
                                onChange={(e) => {
                                    // Auto uppercase for PAN
                                    formik.setFieldValue('panNumber', e.target.value.toUpperCase());
                                }}
                                onBlur={formik.handleBlur}
                                error={formik.touched.panNumber && Boolean(formik.errors.panNumber)}
                                helperText={formik.touched.panNumber && formik.errors.panNumber}
                                inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formik.values.hasPostGraduation}
                                        onChange={formik.handleChange}
                                        name="hasPostGraduation"
                                        color="primary"
                                    />
                                }
                                label="I have post-graduation qualifications"
                            />
                        </Grid>
                        {formik.values.hasPostGraduation && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    id="universityName"
                                    name="universityName"
                                    label="Post-Graduation University Name"
                                    value={formik.values.universityName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.universityName && Boolean(formik.errors.universityName)}
                                    helperText={formik.touched.universityName && formik.errors.universityName}
                                    required
                                />
                            </Grid>
                        )}
                    </Grid>
                );
            case 2:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Upload Documents
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Please upload clear scans of the following documents (PDF, JPG, or PNG)
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 2,
                                    border: fileErrors.aadhaar ? '2px solid' : 'none',
                                    borderColor: 'error.main'
                                }}
                            >
                                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                                    Aadhaar Card (Masked) *
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Upload a copy showing only last 4 digits
                                </Typography>
                                <CustomDropzone
                                    acceptedFiles={['.pdf', '.jpg', '.jpeg', '.png']}
                                    onFilesChange={handleFileChange('aadhaar')}
                                    maxFiles={1}
                                    files={files.aadhaar}
                                    onRemoveFile={(index) => removeFile('aadhaar', index)}
                                />
                                {fileErrors.aadhaar && (
                                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        {fileErrors.aadhaar}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 2,
                                    border: fileErrors.pan ? '2px solid' : 'none',
                                    borderColor: 'error.main'
                                }}
                            >
                                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                                    PAN Card *
                                </Typography>
                                <CustomDropzone
                                    acceptedFiles={['.pdf', '.jpg', '.jpeg', '.png']}
                                    onFilesChange={handleFileChange('pan')}
                                    maxFiles={1}
                                    files={files.pan}
                                    onRemoveFile={(index) => removeFile('pan', index)}
                                />
                                {fileErrors.pan && (
                                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        {fileErrors.pan}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 2,
                                    border: fileErrors.marksheet ? '2px solid' : 'none',
                                    borderColor: 'error.main'
                                }}
                            >
                                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                                    12th Marksheet *
                                </Typography>
                                <CustomDropzone
                                    acceptedFiles={['.pdf', '.jpg', '.jpeg', '.png']}
                                    onFilesChange={handleFileChange('marksheet')}
                                    maxFiles={1}
                                    files={files.marksheet}
                                    onRemoveFile={(index) => removeFile('marksheet', index)}
                                />
                                {fileErrors.marksheet && (
                                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        {fileErrors.marksheet}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 2,
                                    border: fileErrors.semesterMarksheets ? '2px solid' : 'none',
                                    borderColor: 'error.main'
                                }}
                            >
                                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                                    Semester Marksheets *
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Upload up to 8 semester marksheets
                                </Typography>
                                <CustomDropzone
                                    acceptedFiles={['.pdf', '.jpg', '.jpeg', '.png']}
                                    onFilesChange={handleFileChange('semesterMarksheets')}
                                    maxFiles={8}
                                    files={files.semesterMarksheets}
                                    onRemoveFile={(index) => removeFile('semesterMarksheets', index)}
                                />
                                {fileErrors.semesterMarksheets && (
                                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        {fileErrors.semesterMarksheets}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        {formik.values.hasPostGraduation && (
                            <Grid item xs={12} md={6}>
                                <Paper
                                    elevation={2}
                                    sx={{
                                        p: 2,
                                        border: fileErrors.postGraduationCertificate ? '2px solid' : 'none',
                                        borderColor: 'error.main'
                                    }}
                                >
                                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                                        Post Graduation Certificate *
                                    </Typography>
                                    <CustomDropzone
                                        acceptedFiles={['.pdf', '.jpg', '.jpeg', '.png']}
                                        onFilesChange={handleFileChange('postGraduationCertificate')}
                                        maxFiles={1}
                                        files={files.postGraduationCertificate}
                                        onRemoveFile={(index) => removeFile('postGraduationCertificate', index)}
                                    />
                                    {fileErrors.postGraduationCertificate && (
                                        <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                                            {fileErrors.postGraduationCertificate}
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                );
            default:
                return 'Unknown Step';
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
                        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 700, mb: 4 }}>
                            Employee Onboarding
                        </Typography>

                        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                            {steps.map((label, index) => (
                                <Step key={label}>
                                    <StepLabel
                                        sx={{
                                            '& .MuiStepLabel-label': {
                                                fontWeight: activeStep === index ? 600 : 400,
                                            },
                                        }}
                                    >
                                        {label}
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        {submitSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="h5" gutterBottom color="success.main" fontWeight={600}>
                                        Onboarding Submitted Successfully!
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        Thank you for completing your onboarding! We will review your documents and contact you soon.
                                    </Typography>
                                </Box>
                            </motion.div>
                        ) : (
                            <>
                                <Box sx={{ mb: 4 }}>
                                    {getStepContent(activeStep)}
                                </Box>

                                {submitError && (
                                    <Alert severity="error" sx={{ mb: 3 }}>
                                        {submitError}
                                    </Alert>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                                    <Button
                                        onClick={handleBack}
                                        disabled={activeStep === 0}
                                        variant="outlined"
                                        sx={{ px: 4 }}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        disabled={isSubmitting}
                                        sx={{ px: 4, minWidth: 120 }}
                                    >
                                        {isSubmitting ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : activeStep === steps.length - 1 ? (
                                            'Submit'
                                        ) : (
                                            'Next'
                                        )}
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default OnboardingForm;
