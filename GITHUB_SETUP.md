# GitHub Repository Setup Instructions

Your local repository is ready! Follow these steps to connect it to GitHub:

## Step 1: Create Repository on GitHub

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `inventory-manager` (or your preferred name)
   - **Description**: "Full-stack inventory management system"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Replace:**
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repository name

## Alternative: Using SSH

If you prefer SSH (and have it set up):

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 3: Verify

After pushing, refresh your GitHub repository page. You should see all your files!

## Next Steps

Once your code is on GitHub:

1. **Deploy Backend to Render**:
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Connect your GitHub repository to Render

2. **Deploy Frontend to Vercel**:
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Import your GitHub repository to Vercel

## Current Repository Status

✅ Git repository initialized
✅ Initial commit created
✅ Branch renamed to `main`
✅ Ready to push to GitHub

## Troubleshooting

### If you get "repository not found" error:
- Check that the repository name and username are correct
- Make sure you have access to the repository
- Verify you're authenticated with GitHub (`git config --global user.name` and `git config --global user.email`)

### If you get authentication errors:
- Use a Personal Access Token instead of password
- Or set up SSH keys for GitHub

### To check your remote:
```bash
git remote -v
```

### To update remote URL:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

