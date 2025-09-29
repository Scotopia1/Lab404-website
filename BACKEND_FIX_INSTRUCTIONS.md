# 🔧 URGENT: Backend Configuration Required

## ⚠️ Critical Issue
The backend is missing a critical environment variable (`FRONTEND_URL`) that prevents WebSocket (Socket.IO) connections from working in production.

---

## 🎯 Required Fix (Server Admin Action)

### **Step 1: Update Backend Environment Variables**

**File:** `/path/to/lab404-backend/.env`

**Action:** Add this line after `ALLOWED_ORIGINS` (around line 26):

```bash
# Frontend URL for Socket.IO CORS (CRITICAL - Required for WebSocket connections)
FRONTEND_URL=https://lab404electronics.com
```

**For local development, use:**
```bash
FRONTEND_URL=http://localhost:5173
```

---

### **Step 2: Restart Backend Server**

```bash
cd /path/to/lab404-backend

# If using PM2:
pm2 restart lab404-backend

# If running directly:
npm run build
npm run dev
# OR
npm start
```

---

### **Step 3: Verify Socket.IO Endpoint**

Test that Socket.IO is accessible:

```bash
# This should return HTTP 200 OK (not 404)
curl -I https://api.lab404electronics.com/socket.io/
```

**Expected response:**
```
HTTP/2 200
...
```

**If you get 404:**
- Backend is not running
- Socket.IO is not initialized
- Check backend logs

---

### **Step 4: Check Backend Logs**

```bash
# View recent logs
pm2 logs lab404-backend --lines 50

# Filter for errors
pm2 logs lab404-backend --lines 100 | grep -E "(ERROR|WebSocket|Socket|category)"
```

**Look for:**
- ✅ `✅ WebSocket server initialized with admin namespace`
- ✅ `🚀 LAB404 Backend API Server running on...`
- ❌ Any ERROR messages related to Socket.IO
- ❌ Database connection errors

---

## 📊 Why This Fix Is Critical

### **Current Issue:**
1. Backend Socket.IO configured in `src/websocket/socketManager.ts` line 52:
   ```typescript
   cors: {
     origin: config.frontendUrl,  // Reads from FRONTEND_URL env var
   }
   ```

2. **Without `FRONTEND_URL`:** Backend defaults to `http://localhost:5173` (dev only)
3. **Production requests from:** `https://lab404electronics.com`
4. **Result:** CORS blocks ALL Socket.IO connections → 404 errors

### **Impact:**
- ❌ No real-time admin notifications
- ❌ No WebSocket connectivity
- ❌ Frontend logs flooded with connection errors (~20 retry attempts)

---

## ✅ Expected Results After Fix

### **Backend Logs Should Show:**
```
✅ Database connected successfully
✅ Database initialized successfully
🚀 LAB404 Backend API Server running on http://localhost:3000
📊 Environment: production
🗄️  Database: Lab404
🔌 WebSocket: http://localhost:3000/socket.io/
✅ WebSocket server initialized with admin namespace
```

### **Frontend Console Should Show:**
```
✅ Connected to admin WebSocket
🎉 WebSocket connection confirmed: {message: "Successfully connected to admin notifications", ...}
```

### **Errors That Should DISAPPEAR:**
```
❌ xhr poll error (api.lab404electronics.com/socket.io/)
❌ WebSocket connection error: TransportError: xhr poll error
```

---

## 🔍 Troubleshooting

### **Problem: Still Getting 404 on /socket.io/**

**Possible Causes:**
1. Backend not restarted after env change
2. Backend crashed (check `pm2 status`)
3. FRONTEND_URL has typo or wrong domain

**Debug Steps:**
```bash
# 1. Check backend status
pm2 status lab404-backend

# 2. Check environment variable is loaded
pm2 env lab404-backend | grep FRONTEND_URL

# 3. Restart with fresh environment
pm2 delete lab404-backend
cd /path/to/lab404-backend
pm2 start npm --name "lab404-backend" -- start

# 4. Watch logs in real-time
pm2 logs lab404-backend --lines 100 --raw
```

---

### **Problem: CORS Error in Browser Console**

**Symptoms:**
```
Access to XMLHttpRequest at 'https://api.lab404electronics.com/socket.io/...'
from origin 'https://lab404electronics.com' has been blocked by CORS policy
```

**Fix:**
1. Verify `FRONTEND_URL=https://lab404electronics.com` in backend `.env`
2. Verify `ALLOWED_ORIGINS` includes `https://lab404electronics.com`
3. Restart backend server
4. Clear browser cache and reload frontend

---

### **Problem: Category API 422 Error**

**Symptoms:**
```
Failed to load resource: the server responded with a status of 422 (Unprocessable Entity)
api.lab404electronics.com/api/categories
```

**Debug Steps:**
```bash
# Test category endpoint directly
curl https://api.lab404electronics.com/api/categories

# Expected: JSON array of categories
# If 422: Check backend logs for validation errors
pm2 logs lab404-backend | grep -A 5 "category"
```

**Common Causes:**
- Database query failing
- Validation middleware issue
- Database schema mismatch

---

## 📞 Contact Information

If issues persist after following these steps, please provide:

1. **Backend logs:** `pm2 logs lab404-backend --lines 100 > backend-logs.txt`
2. **Environment check:** `pm2 env lab404-backend > backend-env.txt`
3. **Backend status:** `pm2 status`
4. **Test results:** Output of curl commands above

---

## ✨ Additional Recommendations

### **1. Environment Variable Management**
- Always use `.env.example` as template
- Document all required vars in CLAUDE.md
- Add startup validation for critical vars

### **2. Monitoring Setup**
- Set up error tracking (Sentry/Rollbar)
- Monitor Socket.IO connection metrics
- Set up alerts for backend errors

### **3. Production Checklist**
- [ ] `FRONTEND_URL` set correctly
- [ ] `ALLOWED_ORIGINS` includes production domain
- [ ] JWT secrets are strong (32+ characters)
- [ ] Admin password changed from default
- [ ] Database backups configured
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured

---

## 🎓 Technical Details

### **Socket.IO Connection Flow:**
1. Frontend (https://lab404electronics.com) requests `/socket.io/`
2. Backend checks CORS origin against `FRONTEND_URL`
3. If match: Allow connection
4. If mismatch: Block with 404/CORS error
5. On success: Establish Socket.IO connection on `/admin` namespace
6. Admin receives real-time notifications

### **Why Polling Transport:**
```typescript
// WebSocketContext.tsx line 92
transports: ['polling'], // HTTP polling instead of WebSocket upgrade
upgrade: false, // Disabled to prevent mixed content issues
```

This prevents HTTPS/WSS mixed content policy issues in production.

---

## 📝 Notes

- **Priority:** 🔴 CRITICAL - Blocking admin notifications
- **Estimated Time:** 5 minutes
- **Impact:** High - Affects all admin users
- **Risk:** Low - Only adding environment variable

---

*Last Updated: 2025-09-29*
*Generated by Claude Code for LAB404 Electronics Platform*