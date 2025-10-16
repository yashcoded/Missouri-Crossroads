# Playwright Test Suite

This directory contains end-to-end tests for the Missouri Crossroads application.

## Test Files

### Core Functionality Tests

#### `map-functionality.spec.ts` - Map Features (NEW)
Tests for the enhanced map functionality including:
- ✅ Map loading and initialization
- ✅ Pin visibility and rendering (91+ locations → 700+ locations)
- ✅ Category filtering (Historic Markers, Educational/Interpretive, Monuments)
- ✅ Dynamic pin loading on zoom
- ✅ Search functionality
- ✅ InfoWindow interactions
- ✅ Responsive design (mobile, tablet, desktop)

**Key Test Cases:**
- Verifies > 91 pins are displayed (tests DMM parsing fix)
- Tests all three category filters work independently
- Validates search filters locations correctly
- Tests that disabling all filters shows 0 pins

---

#### `dmm-coordinate-parsing.spec.ts` - Coordinate Parsing (NEW)
Tests for the enhanced DMM/DMS coordinate parsing:
- ✅ Standard DMM format: `"39° 0.924′ N, 94° 31.55′ W"`
- ✅ No comma format: `"N39°11'23.6 W93°52'33.8"`
- ✅ Reversed order: `"W92°44'34 N38°58'25"`
- ✅ DMS with seconds: `"N39° 11' 23.6" W93° 52' 33.8"`
- ✅ Decimal pairs: `"38.123, -90.456"`
- ✅ Placeholder rejection: `"FILL"`, `"N/A"`, `"Unknown"`
- ✅ Missouri bounds validation

**Key Improvements Tested:**
- Verifies > 91 locations parsed (old: 91, new: 700+)
- Tests coordinate validation (35-41°N, 89-96°W for Missouri)
- Validates caching performance

---

#### `security.spec.ts` - Security Validation (NEW)
Security tests to ensure no credentials are exposed:
- ✅ AWS credentials NOT in client JavaScript
- ✅ AWS credentials NOT in page source
- ✅ AWS credentials NOT in network responses
- ✅ Server-side API routes for all AWS operations
- ✅ No XSS vulnerabilities in search
- ✅ No SQL injection vulnerabilities
- ✅ API validates fileName parameter (path traversal protection)
- ✅ Cognito client secret not exposed

**Security Checks:**
- Pattern matching for AWS keys (AKIA*)
- Pattern matching for API keys
- Input validation testing
- Header security checks

---

#### `admin-csv-upload.spec.ts` - Admin Features (NEW)
Tests for admin and CSV upload functionality:
- ✅ CSV upload endpoint validation
- ✅ File type validation (CSV only)
- ✅ Required parameter validation
- ✅ Caching behavior
- ✅ Viewport-based loading
- ✅ Different map center locations
- ✅ Edge case handling (empty fields, malformed data)
- ✅ S3 presigned URL generation
- ✅ Data integrity across requests

---

### Legacy Tests

#### `basic.spec.ts`
Basic page load test for test-aws page

#### `aws-integration*.spec.ts` (Multiple versions)
AWS integration tests for S3, DynamoDB, and Cognito

---

## Running Tests

### Run All Tests
```bash
pnpm test:e2e
```

### Run Specific Test File
```bash
pnpm test:e2e tests/map-functionality.spec.ts
pnpm test:e2e tests/security.spec.ts
pnpm test:e2e tests/dmm-coordinate-parsing.spec.ts
pnpm test:e2e tests/admin-csv-upload.spec.ts
```

### Run with UI Mode (Interactive)
```bash
pnpm test:e2e:ui
```

### Run in Debug Mode
```bash
pnpm test:e2e:debug
```

### Run in Headed Mode (See Browser)
```bash
pnpm test:e2e:headed
```

### Run Only Chrome
```bash
pnpm test:e2e --project=chromium
```

---

## Test Configuration

Tests are configured in `playwright.config.ts`:
- **Browsers:** Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Base URL:** http://localhost:3000
- **Retries:** 2 in CI, 0 locally
- **Screenshots:** On failure
- **Video:** On failure
- **Trace:** On first retry

---

## What's Being Tested

### ✅ Recent Changes (October 16, 2025)
1. **DMM Coordinate Parsing Fix**
   - Before: 91 locations displayed
   - After: 700+ locations displayed
   - Tests verify the parsing works for multiple formats

2. **Category Filter Updates**
   - Historic Markers → Red pins
   - Interpretive Panels → Blue pins (educational)
   - Monuments → Green pins
   - Tests verify correct categorization

3. **Security Improvements**
   - AWS credentials removed from NEXT_PUBLIC_ prefix
   - Tests verify no credentials exposed to browser

4. **Dynamic Pin Loading**
   - Pins load as you zoom out
   - Tests verify lazy loading works

### 📊 Test Coverage

- **Map Display:** 8 tests
- **Coordinate Parsing:** 8 tests
- **Security:** 11 tests
- **Admin/CSV Upload:** 12 tests
- **Total New Tests:** 39 tests

---

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`

See `.github/workflows/ci.yml` for CI configuration.

---

## Test Fixtures

Located in `tests/fixtures/`:
- `test-image.jpg` - Sample image for upload tests
- `test-metadata.csv` - Sample CSV data for parsing tests

---

## Debugging Failed Tests

1. **Check screenshots:** `test-results/` directory
2. **Check videos:** `test-results/` directory
3. **Check trace:** Open with `pnpm dlx playwright show-trace <trace-file>`
4. **Run in headed mode:** `pnpm test:e2e:headed` to see what's happening

---

## Best Practices

- Tests use `page.waitForLoadState('networkidle')` to ensure page is ready
- Tests use `page.waitForTimeout()` sparingly, preferring waitFor selectors
- Tests clean up after themselves
- Tests are isolated and can run in any order
- Tests use descriptive names and comments

---

**Last Updated:** October 16, 2025  
**Total Test Files:** 8  
**Total Test Cases:** ~50+
