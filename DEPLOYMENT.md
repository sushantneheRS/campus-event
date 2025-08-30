# Backend Deployment Guide

## Render Deployment

### Prerequisites
- Node.js 18+ 
- MongoDB connection string
- Environment variables configured

### Environment Variables
Create these in your Render dashboard:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://your-frontend-domain.com
SOCKET_CORS_ORIGIN=https://your-frontend-domain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Build Settings
- **Build Command**: `npm install && npm run postinstall`
- **Start Command**: `node server.js`
- **Health Check Path**: `/api/health`

### Sharp Module Issues
If you encounter Sharp module errors:

1. **Automatic Fix**: The `postinstall` script will rebuild Sharp for Linux
2. **Fallback Processing**: Images will be saved without resizing if Sharp fails
3. **Manual Rebuild**: Run `npm rebuild sharp --platform=linux --arch=x64`

### Troubleshooting

#### Build Fails
- Check Node.js version (18+ required)
- Verify environment variables
- Check MongoDB connection

#### Runtime Errors
- Check logs in Render dashboard
- Verify all environment variables are set
- Check MongoDB connection string

#### Image Processing Issues
- Sharp module will auto-rebuild on Linux
- Fallback processor handles basic image saving
- Check file permissions for uploads directory

### Health Check
The `/api/health` endpoint should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```
