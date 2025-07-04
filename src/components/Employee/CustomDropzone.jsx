import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';

const CustomDropzone = ({ 
  onFilesChange, 
  acceptedFiles = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  maxFiles = 10,
  files = [],
  onRemoveFile 
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles,
    onDrop: (acceptedFiles) => {
      onFilesChange(acceptedFiles);
    }
  });

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          padding: 4,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease',
          '&:hover': { 
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive 
            ? 'Drop the files here...' 
            : 'Drag & drop files here, or click to select'
          }
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Accepted formats: {acceptedFiles.join(', ')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Maximum {maxFiles} files
        </Typography>
      </Box>
      
      {files && files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files:
          </Typography>
          <List dense>
            {files.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  onRemoveFile && (
                    <IconButton 
                      edge="end" 
                      onClick={() => onRemoveFile(index)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  )
                }
                sx={{ 
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemText 
                  primary={file.name || file} 
                  secondary={file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default CustomDropzone;