# AWS Integration Tests

This directory contains comprehensive Playwright tests for the AWS integration setup.

## Test Coverage

### 🔐 Authentication Flow
- User registration with Cognito
- User sign-in
- Form validation

### 📝 Note Creation
- Note form display
- Note creation with text
- File uploads (images, audio)
- Form validation

### 👀 Notes Viewer
- Display existing notes
- Refresh functionality
- Note details display

### 📊 CSV Metadata Upload
- CSV file upload to S3
- File type validation
- Public URL generation
- Upload progress tracking

### 🔌 API Endpoints
- Notes API (GET, POST)
- S3 presign API
- Error handling

### 🚨 Error Handling
- Authentication errors
- Network errors
- Graceful degradation

### 📱 Responsive Design
- Mobile compatibility
- Tablet compatibility
- Cross-browser testing

## Running Tests

### Prerequisites
1. Install dependencies: `pnpm install`
2. Ensure your AWS environment is configured
3. Make sure your Lambda function has proper S3 permissions

### Test Commands

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests in headed mode (see browser)
pnpm test:headed

# Run tests in debug mode
pnpm test:debug

# Run specific test file
pnpm test aws-integration.spec.ts

# Run tests for specific browser
pnpm test --project=chromium
```

### Test Fixtures

Place test files in `tests/fixtures/`:
- `test-image.jpg` - Small test image for upload tests
- `test-metadata.csv` - Sample CSV for metadata upload tests

## Test Configuration

- **Base URL**: `http://localhost:3000`
- **Timeout**: 10 seconds for assertions
- **Retries**: 2 retries in CI, 0 in development
- **Parallel**: Tests run in parallel for speed
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

## CI/CD Integration

Tests are configured to run in CI environments:
- Automatic server startup
- Screenshots on failure
- Video recording on failure
- HTML report generation

## Debugging Tests

1. **Use debug mode**: `pnpm test:debug`
2. **Check screenshots**: `test-results/` directory
3. **View HTML report**: `playwright-report/` directory
4. **Check traces**: `test-results/` directory

## Common Issues

### AWS Permissions
- Ensure Lambda has S3 access
- Check bucket CORS configuration
- Verify IAM role permissions

### Test Data
- Use unique timestamps for test data
- Clean up test data after tests
- Avoid conflicts with existing data

### Network Issues
- Tests include network error handling
- Offline mode testing included
- Timeout configurations for slow operations
