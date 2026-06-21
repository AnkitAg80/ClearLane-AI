# Vercel Frontend Build Fix

## What Changed

Added a root `vercel.json` file so Vercel builds the nested React frontend before serving the FastAPI app.

Updated the root `README.md` troubleshooting notes to explain why the deployed page can show `Frontend build not found` and how the Vercel config prevents it.

## Where It Changed

The new deployment config lives in `vercel.json`.

The documentation update is in `README.md`.

## Why It Helps

The FastAPI server serves the React app from `frontend/dist`.

On Vercel, the backend was deployed successfully, but the frontend build step was not running because the React app is inside the `frontend/` folder and there was no root Vercel config telling Vercel to build it.

The new build command runs:

```powershell
cd frontend && npm ci && npm run build
```

This creates `frontend/dist` during deployment, so the FastAPI fallback page should no longer appear.

## What Should Happen Next

Commit and push `vercel.json` with the rest of the deployment changes.

Redeploy the same branch on Vercel.

If Vercel still shows the fallback page, open the Vercel build logs and confirm the frontend build command ran successfully before the Python app was packaged.
