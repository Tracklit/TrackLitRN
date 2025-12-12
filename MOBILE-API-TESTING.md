# Mobile App API Testing Examples

## Base URL
```
https://app-tracklit-dev-kvnx2h.azurewebsites.net
```

## Authentication Endpoints

### 1. Login (Get JWT Token)
```bash
# Request
POST /api/mobile/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}

# Response (200 OK)
{
  "id": 1,
  "username": "your_username",
  "email": "user@example.com",
  "name": "User Name",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# cURL Example
curl -X POST https://app-tracklit-dev-kvnx2h.azurewebsites.net/api/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

### 2. Register New User
```bash
# Request
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}

# Response (200 OK)
{
  "user": {
    "id": 2,
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Authenticated Endpoints (Require JWT Token)

### 3. Get Current User
```bash
# Request
GET /api/user
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Response (200 OK)
{
  "id": 1,
  "username": "your_username",
  "email": "user@example.com",
  "name": "User Name",
  "profileImageUrl": null
}

# cURL Example
curl https://app-tracklit-dev-kvnx2h.azurewebsites.net/api/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 4. Get Activities
```bash
# Request
GET /api/activities
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Response (200 OK)
[
  {
    "id": 1,
    "userId": 1,
    "type": "run",
    "distance": 5.2,
    "duration": 1800,
    "createdAt": "2025-12-12T10:30:00Z"
  }
]
```

### 5. Get Programs
```bash
# Request
GET /api/programs
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Response (200 OK)
[
  {
    "id": 1,
    "name": "Sprint Training",
    "description": "8-week sprint program",
    "duration": 8
  }
]
```

### 6. Logout
```bash
# Request
POST /api/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Response (200 OK)
{
  "message": "Logged out successfully"
}
```

## Mobile App Code Examples

### Login Function
```typescript
// In your mobile app (tracklit-mobile/src/contexts/AuthContext.tsx)
const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await apiRequest<LoginResponse>('/api/mobile/login', {
      method: 'POST',
      data: { username, password },
      skipAuth: true, // Don't send token for login
    });

    // Store token
    await setToken(response.token);
    await setStoredUser(response);
    
    setUser(response);
    setHasValidToken(true);
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};
```

### Authenticated API Call
```typescript
// Automatically includes Authorization header
const getUserData = async () => {
  try {
    const user = await apiRequest<User>('/api/user');
    console.log('User data:', user);
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
};
```

## Testing with Postman

### Setup
1. Create new collection: "TrackLit Mobile API"
2. Set collection variable: `baseUrl = https://app-tracklit-dev-kvnx2h.azurewebsites.net`
3. Set collection variable: `token = ` (will be filled after login)

### Test Sequence

**Step 1: Login**
```
POST {{baseUrl}}/api/mobile/login
Headers: Content-Type: application/json
Body (raw JSON):
{
  "username": "testuser",
  "password": "testpass"
}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Response has token", () => pm.expect(pm.response.json()).to.have.property('token'));
// Save token
pm.collectionVariables.set("token", pm.response.json().token);
```

**Step 2: Get User (with token)**
```
GET {{baseUrl}}/api/user
Headers: 
  Authorization: Bearer {{token}}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Response has user data", () => pm.expect(pm.response.json()).to.have.property('username'));
```

## Common Response Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Valid token but insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **500 Internal Server Error** - Server error (check backend logs)

## JWT Token Details

### Token Structure
```
Header.Payload.Signature
```

### Payload Contents
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "iat": 1702396800,  // Issued at (Unix timestamp)
  "exp": 1704988800   // Expires at (30 days later)
}
```

### Token Expiration
- **Duration**: 30 days
- **Refresh**: Login again to get new token
- **Storage**: AsyncStorage on mobile (encrypted on device)

## Network Debugging Tips

### iOS (Xcode)
1. Open Xcode → Window → Devices and Simulators
2. Select your device/simulator
3. Open Console app to see NSURLSession logs

### Android (Android Studio)
1. Open Logcat in Android Studio
2. Filter by package: `com.tracklit.app`
3. Look for network request logs

### React Native Debugger
1. Install: `npm install -g react-native-debugger`
2. Open debugger: `open "rndebugger://set-debugger-loc?host=localhost&port=8081"`
3. Enable Network Inspect
4. See all API calls in Network tab

## Health Check

Test backend availability:
```bash
curl https://app-tracklit-dev-kvnx2h.azurewebsites.net/api/health

# Expected response:
{"status":"healthy","timestamp":"2025-12-12T14:30:00Z"}
```

## Support
- Backend logs: `az webapp log tail --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev`
- API documentation: Check backend code in `server/routes.ts`
- Mobile app debug logs: Look for `[API]` and `[AUTH]` prefixes in console
