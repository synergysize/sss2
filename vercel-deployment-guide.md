# Vercel Deployment Guide for Tooltip Update

The tooltip changes have been successfully merged from `performance-optimizations` into a new branch called `tooltip-update` and pushed to GitHub.

## Option 1: Update Vercel Deployment Branch

1. Log into your Vercel account
2. Navigate to the sss2 project
3. Go to Settings > Git
4. Change the Production Branch from `main` to `tooltip-update`
5. Save the changes
6. Trigger a new deployment

## Option 2: Create a Pull Request (Recommended)

1. Go to: https://github.com/synergysize/sss2/pull/new/tooltip-update
2. Create a pull request to merge `tooltip-update` into `main`
3. Review the changes (you should see the tooltip modifications)
4. Approve and merge the pull request
5. This will automatically trigger a Vercel deployment from the updated `main` branch

## Option 3: Manual Deployment

If neither of the above options work:

1. Log into Vercel
2. Navigate to the sss2 project
3. Click on the "Deployments" tab
4. Click "Deploy" button
5. Select the `tooltip-update` branch
6. Confirm deployment

## Verifying the Changes

After deployment is complete, visit https://sss2-six.vercel.app/ and check that:

1. The tooltips no longer show "Wallet Details" header
2. The "Holds Only" line has been removed
3. Wallet addresses are clickable and link to Solscan

## Troubleshooting

If changes aren't visible immediately:
1. Clear your browser cache or open in incognito mode
2. Check Vercel deployment logs for any errors
3. Wait a few minutes for the CDN to update