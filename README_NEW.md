# Job Portal Frontend

Modern, responsive React application for job seekers and employers.

## 🚀 Features

- **User Dashboard**: Profile management, job applications, saved jobs
- **Company Dashboard**: Job posting, applicant management, analytics
- **Admin Panel**: User management, company verification, analytics
- **Job Search**: Advanced filtering, location-based search
- **Real-time Chat**: WebSocket-powered messaging between users and companies
- **Resume Builder**: Interactive resume creation and PDF export
- **Resume Upload**: Parse and auto-fill profile from resume
- **Notifications**: Real-time notifications for applications and messages
- **Responsive Design**: Mobile-first, works on all devices
- **Dark Mode**: Toggle between light and dark themes

## 🛠️ Tech Stack

- **Framework**: React 18.2
- **Routing**: React Router v7
- **UI Library**: Material-UI (MUI)
- **Forms**: Formik + Yup validation
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Styling**: Tailwind CSS + CSS Modules
- **Charts**: Recharts
- **PDF**: jsPDF, html2canvas

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your backend URL
# See Configuration section below
```

## ⚙️ Configuration

Edit `.env` file:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5000/api

# Resume Parser Service URL (optional)
REACT_APP_RESUME_PARSER_URL=http://localhost:5001

# Google Analytics (optional)
REACT_APP_GA_ID=G-XXXXXXXXXX

# Environment
NODE_ENV=development
```

For production (`.env.production`):
```env
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_RESUME_PARSER_URL=https://your-parser.onrender.com
```

## 🏃‍♂️ Running Locally

```bash
# Development mode with hot reload
npm start

# Build for production
npm run build

# Test production build locally
npm install -g serve
serve -s build
```

## 🌐 Deployment on Vercel

### Quick Deploy Button
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

### Manual Deployment

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/job-portal-frontend.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **New Project**
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Create React App
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`
     - **Install Command**: `npm install`

3. **Add Environment Variables**
   In Vercel project settings → Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   REACT_APP_RESUME_PARSER_URL=https://your-parser.onrender.com
   ```

4. **Deploy**
   - Click **Deploy**
   - Wait for build (2-5 minutes)
   - Get your URL: `https://your-project.vercel.app`

### Custom Domain (Optional)
1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate auto-configured

## 📱 Features Guide

### For Job Seekers
- Create and manage profile
- Upload resume or use resume builder
- Search and filter jobs
- Apply to jobs with cover letter
- Track application status
- Save jobs for later
- Chat with companies
- Get job recommendations

### For Companies
- Create company profile
- Post and manage jobs
- Review applications
- Schedule interviews
- Chat with candidates
- View analytics dashboard
- Manage notifications

### For Admins
- User management
- Company verification
- Job moderation
- System analytics
- Audit logs

## 🎨 Customization

### Theme Colors
Edit `src/index.css` or `tailwind.config.js`:
```css
:root {
  --primary-color: #3B82F6;
  --secondary-color: #10B981;
  --accent-color: #F59E0B;
}
```

### Logo
Replace `public/logo.png` with your logo

### Metadata
Edit `public/index.html`:
```html
<title>Your Job Portal</title>
<meta name="description" content="Find your dream job">
```

## 📁 Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   │   ├── common/      # Shared components
│   │   ├── Company/     # Company components
│   │   ├── Chat/        # Chat components
│   │   └── admin/       # Admin components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── utils/           # Helper functions
│   ├── context/         # React context
│   ├── App.js           # Main app component
│   └── index.js         # Entry point
└── package.json
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## 🔧 Performance Optimization

### Already Implemented
- Code splitting with React.lazy
- Image optimization
- Lazy loading
- Memoization (useMemo, useCallback)
- Debounced search
- Infinite scroll pagination

### Additional Optimizations
See `IMPLEMENTATION_GUIDE.md` for detailed optimization steps

## 🐛 Troubleshooting

### CORS Errors
Ensure backend has correct CORS configuration:
```javascript
// backend/server.js
app.use(cors({
  origin: 'https://your-frontend.vercel.app',
  credentials: true
}));
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Connection Issues
Check `.env` has correct `REACT_APP_API_URL`

### Socket.IO Not Connecting
Ensure backend Socket.IO CORS is configured for your frontend URL

## 📊 Performance Metrics

- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices)
- **Bundle Size**: ~2MB (optimized)
- **First Contentful Paint**: <2s
- **Time to Interactive**: <3s

## 🔒 Security

- XSS protection
- CSRF tokens
- Secure HTTP-only cookies
- Input sanitization
- API rate limiting
- JWT token validation

## 🌍 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📱 Progressive Web App (PWA)

This app is PWA-ready:
- Installable on mobile/desktop
- Offline support (service worker)
- App manifest configured
- App icons included

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📝 License

MIT License

## 📧 Support

- GitHub Issues
- Email: support@jobportal.com

## 🔗 Related Projects

- [Backend API](https://github.com/yourusername/job-portal-backend)
- [Resume Parser](https://github.com/yourusername/resume-parser-service)

---

**Built with ❤️ using React**
