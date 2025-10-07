# Geusi-Backend

A backend project for Geusi application.

## 🚀 Quick Start

### Prerequisites
- Node.js
- npm or yarn
- MongoDB

### Installation
```bash
# Clone the repository
git clone https://github.com/himuexe/Geusi-Backend.git
cd Geusi-Backend
cd backend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🤝 Contribution Guidelines

### How to Contribute

1. **Fork the Project**
   - Click the "Fork" button at the top right of the repository page

2. **Create your Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit your Changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push to the Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open a Pull Request**
   - Go to your forked repository on GitHub
   - Click "Compare & pull request"
   - Add a descriptive title and explanation of your changes

###  Important Reminder

**Always sync your fork and pull changes to your local machine before making any changes to avoid merge conflicts:**

```bash
# Add upstream remote (only needed once)
git remote add upstream https://github.com/himuexe/Geusi-Backend.git

# Sync your fork before starting work
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# Then create your feature branch
git checkout -b feature/YourFeatureName
```

### Development Workflow
```bash
# Always start with syncing
git fetch upstream
git merge upstream/main

# Then work on your feature
# Make your changes
git add .
git commit -m "Your descriptive commit message"
git push origin your-feature-branch
```
