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
    Checkbox
} from '@mui/material';

const steps = ['Personal Information', 'Education Details', 'Document Upload'];

const validationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    dob: Yup.date().required('Date of Birth is required'),
    permanentAddress: Yup.string().required('Permanent address is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string().matches(/^[0-9]{10}$/, "Phone number must be 10 digits").required("Phone number is required"),
    panNumber: Yup.string().matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid Pan format').required('Pan is required'),
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

    const formik = useFormik({
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
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            setIsSubmitting(true);
            setSubmitError('');
            try {
                const formData = new FormData();
                

                Object.entries(values).forEach(([key, value]) => {
                    formData.append(key, value);
                });
                
                Object.entries(files).forEach(([key, fileArray]) => {
                    if (Array.isArray(fileArray)) {
                        fileArray.forEach((file, i) => {
                            if (file) formData.append(`${key}[${i}]`, file);
                        });
                    }
                });

                console.log('Submitting', values, files);
                
                fetch("http://localhost:5000/submit", {
                method: "POST",
                body: formData
                });

                await new Promise(resolve => setTimeout(resolve, 1500));
                setSubmitSuccess(true);
            }
            catch (error) {
                setSubmitError('Submission failed, please try again');
                console.error('Submission error', error);
            }
            finally {
                setIsSubmitting(false);
            }
        },
    });

    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            formik.handleSubmit();
        }
        else {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleFileChange = (name) => (newFiles) => {
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
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="firstName"
                                name="firstName"
                                label="First Name"
                                value={formik.values.firstName}
                                onChange={formik.handleChange}
                                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                                helperText={formik.touched.firstName && formik.errors.firstName}
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
                                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                                helperText={formik.touched.lastName && formik.errors.lastName}
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
                                error={formik.touched.dob && Boolean(formik.errors.dob)}
                                helperText={formik.touched.dob && formik.errors.dob}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="phone"
                                name="phone"
                                label="Phone Number"
                                value={formik.values.phone}
                                onChange={formik.handleChange}
                                error={formik.touched.phone && Boolean(formik.errors.phone)}
                                helperText={formik.touched.phone && formik.errors.phone}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label="Email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="permanentAddress"
                                name="permanentAddress"
                                label="Permanent Address"
                                multiline
                                rows={4}
                                value={formik.values.permanentAddress}
                                onChange={formik.handleChange}
                                error={formik.touched.permanentAddress && Boolean(formik.errors.permanentAddress)}
                                helperText={formik.touched.permanentAddress && formik.errors.permanentAddress}
                            />
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="schoolName"
                                name="schoolName"
                                label="School Name"
                                value={formik.values.schoolName}
                                onChange={formik.handleChange}
                                error={formik.touched.schoolName && Boolean(formik.errors.schoolName)}
                                helperText={formik.touched.schoolName && formik.errors.schoolName}
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
                                error={formik.touched.collegeName && Boolean(formik.errors.collegeName)}
                                helperText={formik.touched.collegeName && formik.errors.collegeName}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="panNumber"
                                name="panNumber"
                                label="PAN Number"
                                value={formik.values.panNumber}
                                onChange={formik.handleChange}
                                error={formik.touched.panNumber && Boolean(formik.errors.panNumber)}
                                helperText={formik.touched.panNumber && formik.errors.panNumber}
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
                                    error={formik.touched.universityName && Boolean(formik.errors.universityName)}
                                    helperText={formik.touched.universityName && formik.errors.universityName}
                                />
                            </Grid>
                        )}
                    </Grid>
                );
            case 2:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Upload Documents
                            </Typography>
                            <Typography variant='body2' color="textSecondary" gutterBottom>
                                Please upload clear scans of the following documents:
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} style={{ padding: '16px', marginBottom: '16px' }}>
                                <Typography variant='subtitle1' gutterBottom>
                                    Aadhaar Card (Masked)
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Upload a copy showing only last 4 digits
                                </Typography>
                                <CustomDropzone
                                    acceptedFiles={['.pdf', '.jpg', '.jpeg', '.png']}
                                    onFilesChange={handleFileChange('aadhaar')}
                                    maxFiles={1}
                                    files={files.aadhaar}
                                    onRemoveFile={(index) => removeFile('aadhaar', index)}
                                />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} style={{ padding: '16px', marginBottom: '16px' }}>
                                <Typography variant='subtitle1' gutterBottom>
                                    PAN Card
                                </Typography>
                                <CustomDropzone
                                    acceptedFiles={['.pdf', '.jpg', '.jpeg', '.png']}
                                    onFilesChange={handleFileChange('pan')}
                                    maxFiles={1}
                                    files={files.pan}
                                    onRemoveFile={(index) => removeFile('pan', index)}
                                />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} style={{ padding: '16px', marginBottom: '16px' }}>
                                <Typography variant='subtitle1' gutterBottom>
                                    12th Marksheet
                                </Typography>
                                <CustomDropzone
                                    acceptedFiles={['.pdf', '.jpg', '.jpeg', '.png']}
                                    onFilesChange={handleFileChange('marksheet')}
                                    maxFiles={1}
                                    files={files.marksheet}
                                    onRemoveFile={(index) => removeFile('marksheet', index)}
                                />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} style={{ padding: '16px', marginBottom: '16px' }}>
                                <Typography variant='subtitle1' gutterBottom>
                                    Semester Marksheets
                                </Typography>
                                <CustomDropzone
                                    acceptedFiles={['.pdf', '.jpg', '.jpeg', '.png']}
                                    onFilesChange={handleFileChange('semesterMarksheets')}
                                    maxFiles={8}
                                    files={files.semesterMarksheets}
                                    onRemoveFile={(index) => removeFile('semesterMarksheets', index)}
                                />
                            </Paper>
                        </Grid>
                        {formik.values.hasPostGraduation && (
                            <Grid item xs={12} md={6}>
                                <Paper elevation={2} style={{ padding: '16px', marginBottom: '16px' }}>
                                    <Typography variant='subtitle1' gutterBottom>
                                        Post Graduation Certificate
                                    </Typography>
                                    <CustomDropzone
                                        acceptedFiles={['.pdf', '.jpg', '.jpeg', '.png']}
                                        onFilesChange={handleFileChange('postGraduationCertificate')}
                                        maxFiles={1}
                                        files={files.postGraduationCertificate}
                                        onRemoveFile={(index) => removeFile('postGraduationCertificate', index)}
                                    />
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
        <Box sx={{ width: '100%' }}>
            <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {submitSuccess ? (
                <Paper elevation={3} sx={{ p: 3, mt: 3, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                        Onboarding Submitted Successfully!
                    </Typography>
                    <Typography variant="body1">
                        Thank you for completing your onboarding! We will review your documents and contact you soon.
                    </Typography>
                </Paper>
            ) : (
                <>
                    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                        {getStepContent(activeStep)}
                    </Paper>

                    {submitError && (
                        <Alert severity='error' sx={{ mt: 2 }}>
                            {submitError}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        {activeStep !== 0 && (
                            <Button onClick={handleBack} sx={{ mr: 1 }}>
                                Back
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={isSubmitting}
                        >
                            {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
                            {isSubmitting && (
                                <CircularProgress size={24} sx={{ position: 'absolute' }} />
                            )}
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default OnboardingForm;