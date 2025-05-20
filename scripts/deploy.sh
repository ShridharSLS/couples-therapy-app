#!/bin/bash

# Simple deployment script for Couples Therapy App
echo "🚀 Deploying Couples Therapy App..."

# Step 1: Build the application
echo "📦 Building application..."
npm run build

# Step 2: Make a commit with the latest changes
echo "💾 Committing changes..."
git add .
git commit -m "Deploy: Updates from $(date)"

# Step 3: Push to GitHub to trigger Vercel deployment
echo "🔄 Pushing to GitHub to trigger Vercel deployment..."
git push origin main

echo "✅ Deployment process completed!"
echo "⏳ Vercel should now be building your application."
echo "🌐 Check your Vercel dashboard for deployment status."
