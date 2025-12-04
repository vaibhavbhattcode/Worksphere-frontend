# 🚀 Frontend Deployment Guide - Vercel

Complete step-by-step guide to deploy your WorkSphere frontend on Vercel.

---

## 📋 Prerequisites

✅ Frontend code pushed to GitHub: `https://github.com/vaibhavbhattcode/Worksphere-frontend`
✅ Backend deployed on Render (you need the URL)
✅ Vercel account: [Sign up here](https://vercel.com/signup)

---

## 🎯 Quick Deployment (Fastest Way)

### Option 1: Deploy via Vercel Dashboard

#### Step 1: Go to Vercel
1. Open https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**

#### Step 2: Import Repository
1. Select **"Import Git Repository"**
2. Find and select: `Worksphere-frontend`
3. Click **"Import"**

#### Step 3: Configure Project
- **Framework Preset**: `Create React App` (auto-detected)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `build` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

#### Step 4: Add Environment Variables
Click **"Environment Variables"** section and add:

```bash
# Required - Backend API URL
REACT_APP_API_URL
https://worksphere-backend.onrender.com/api

REACT_APP_BACKEND_URL
https://worksphere-backend.onrender.com

# Optional - Resume Parser (add after parser is deployed)
REACT_APP_RESUME_PARSER_URL
https://worksphere-resume-parser.onrender.com

# Optional - If using RapidAPI
REACT_APP_RAPIDAPI_KEY
your_rapidapi_key_here
```

**⚠️ Important**: Replace `worksphere-backend.onrender.com` with your **actual backend URL from Render**!

#### Step 5: Deploy
1. Click **"Deploy"**
2. Wait 2-5 minutes for build
3. ✅ Done! Your frontend is live!

---

## 📍 After Deployment

### Get Your Frontend URL
After deployment completes, Vercel will show:
```
🎉 Your project is live at: https://worksphere-frontend.vercel.app
```

**Copy this URL - you'll need it!**

---

## 🔗 Connect Frontend to Backend

### Step 1: Update Backend CORS
Your backend needs to allow requests from your frontend URL.

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Open your **backend service** (`worksphere-backend`)
3. Click **"Environment"** tab
4. Find `FRONTEND_URL` variable
5. Update to your Vercel URL:
   ```
   FRONTEND_URL=https://worksphere-frontend.vercel.app
   ```
6. Click **"Save Changes"**
7. Wait 2-3 minutes for backend to redeploy

### Step 2: Test the Connection
1. Visit your frontend URL
2. Try to register/login
3. Check browser console (F12) for errors
4. If you see CORS errors, double-check backend `FRONTEND_URL` setting

---

## ✅ Verification Checklist

After deployment, test these features:

- [ ] Frontend homepage loads without errors
- [ ] Can navigate between pages
- [ ] Register new user works
- [ ] Login works
- [ ] Dashboard loads after login
- [ ] No CORS errors in browser console
- [ ] API calls work (check Network tab in DevTools)
- [ ] Images and assets load correctly

---

## 🐛 Common Issues & Solutions

### Issue 1: Build Fails
**Error**: `npm install` fails or build times out

**Solutions**:
```bash
# Option A: Clear node_modules locally and recommit
cd "E:\Job Portal (2)\Job Portal\frontend"
Remove-Item -Recurse -Force node_modules
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push

# Option B: Check Vercel build logs
# Look for specific package causing issues
# Update that package in package.json
```

### Issue 2: Environment Variables Not Working
**Error**: API calls go to `localhost` or `undefined`

**Solution**:
1. Environment variables in React must start with `REACT_APP_`
2. In Vercel, go to: **Settings** → **Environment Variables**
3. Add all variables for **Production** environment
4. Redeploy: **Deployments** → **...** → **Redeploy**

### Issue 3: CORS Errors
**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
```javascript
// Backend needs to allow your frontend URL
// In backend .env or Render environment variables:
FRONTEND_URL=https://your-frontend.vercel.app

// Backend server.js should have:
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Issue 4: 404 on Page Refresh
**Error**: Refreshing any page shows 404

**Solution**: ✅ Already fixed! `vercel.json` handles this with:
```json
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
```

### Issue 5: Build Succeeds but Page is Blank
**Error**: White screen, no errors

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify `REACT_APP_API_URL` is set correctly
3. Check if homepage field in `package.json` is set (should be `"/"`)
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

---

## 🔄 Redeployment

### When to Redeploy?

Redeploy when you:
- Change environment variables
- Update code in GitHub
- Add new features
- Fix bugs

### How to Redeploy?

**Automatic (Recommended)**:
- Push to GitHub → Vercel auto-deploys

**Manual**:
1. Go to Vercel dashboard
2. Click your project
3. Go to **Deployments** tab
4. Click **...** on latest deployment
5. Click **Redeploy**

---

## 🎨 Custom Domain (Optional)

### Add Your Own Domain

1. **Buy a domain** (from Namecheap, GoDaddy, etc.)

2. **In Vercel**:
   - Go to project **Settings** → **Domains**
   - Click **Add Domain**
   - Enter your domain: `www.yourjobportal.com`
   - Click **Add**

3. **Update DNS** (at your domain provider):
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Wait for SSL**:
   - SSL certificate auto-generates (5-10 minutes)
   - Your site will be available at your custom domain

---

## 📊 Monitor Your Frontend

### Vercel Analytics (Free)

1. Go to project dashboard
2. Click **Analytics** tab
3. Enable **Web Analytics**
4. See:
   - Page views
   - Unique visitors
   - Top pages
   - Countries

### Performance Monitoring

1. Click **Speed Insights** tab
2. Enable it
3. Monitor:
   - Core Web Vitals
   - Load times
   - Performance score

---

## 🔧 Advanced Configuration

### Build Settings

If you need to customize build:

1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Override:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### Environment Variables Per Environment

You can set different variables for:
- **Production**: Live site
- **Preview**: Pull request previews
- **Development**: Local development

### Branch Deployments

Vercel auto-deploys:
- `main` branch → Production URL
- Other branches → Preview URLs
- Pull requests → Preview URLs with comments

---

## 💡 Pro Tips

### 1. Preview Deployments
Every commit to non-main branches gets a preview URL:
```
https://worksphere-frontend-git-feature-xyz.vercel.app
```
Perfect for testing before merging!

### 2. Deployment Protection
Enable password protection for previews:
- Settings → Deployment Protection
- Useful for private projects

### 3. Instant Rollback
If deployment breaks:
- Go to Deployments tab
- Click previous working deployment
- Click "Promote to Production"
- Instant rollback!

### 4. Environment Variable Secrets
For sensitive keys:
- Add as environment variables in Vercel
- Never commit to Git
- They're encrypted and secure

---

## 📱 Mobile Testing

After deployment, test on mobile:

1. **Responsive Design**:
   - Open DevTools (F12)
   - Toggle device toolbar
   - Test different screen sizes

2. **Real Device Testing**:
   - Visit your Vercel URL on phone
   - Test touch interactions
   - Check load speed on mobile network

---

## 🚀 Next Steps After Deployment

1. **Update Backend**: Add frontend URL to backend CORS
2. **Test Features**: Register, login, apply to jobs
3. **Share URL**: Send to friends/recruiters
4. **Monitor**: Check Vercel analytics daily
5. **Optimize**: Use Vercel Speed Insights
6. **Custom Domain**: Add your own domain
7. **SEO**: Add meta tags, sitemap

---

## 📞 Need Help?

### Vercel Support
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Twitter: @vercel

### Check Logs
If something breaks:
1. Vercel dashboard → Your project
2. Click on failed deployment
3. Click **"Building"** to see build logs
4. Look for red error messages

---

## 📋 Quick Reference Commands

```bash
# Push new changes to trigger deployment
git add .
git commit -m "Update frontend"
git push origin main

# Install Vercel CLI (optional)
npm i -g vercel

# Deploy from command line
vercel --prod

# Pull environment variables locally
vercel env pull
```

---

## ✅ Deployment Complete!

Your frontend should now be live at:
```
🌐 https://worksphere-frontend.vercel.app
```

Test it thoroughly and enjoy your deployed job portal! 🎉

---

## 🔗 Important URLs to Save

```
Frontend:  https://_____________________.vercel.app
Backend:   https://_____________________.onrender.com
Parser:    https://_____________________.onrender.com

GitHub Frontend:  https://github.com/vaibhavbhattcode/Worksphere-frontend
GitHub Backend:   https://github.com/vaibhavbhattcode/Worksphere-backend
GitHub Parser:    https://github.com/vaibhavbhattcode/Worksphere-resume-parser
```

Save these URLs for future reference!
