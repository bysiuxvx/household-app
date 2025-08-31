# Deployment Guide for Household App on fly.io

## Prerequisites

1. Install the [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. Log in to your Fly.io account: `fly auth login`
3. Install Docker (for local testing)

## Initial Setup

1. **Update Configuration**
   - Rename the app in `fly.toml` (replace `your-app-name` with your desired app name)
   - Update the `primary_region` in `fly.toml` if needed

2. **Create the Fly.io App**
   ```bash
   fly launch --no-deploy
   ```
   - Choose to create a new Postgres database when prompted
   - Choose to set up a Redis instance if needed
   - Choose not to deploy immediately

3. **Set Environment Variables**
   ```bash
   # Get the database URL
   fly secrets set DATABASE_URL="$(fly secrets get DATABASE_URL)"
   
   # Set other required environment variables
   fly secrets set NODE_ENV=production
   fly secrets set DIRECT_URL="$(fly config env get DATABASE_URL)"
   
   # Set Clerk environment variables
   fly secrets set CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   fly secrets set CLERK_SECRET_KEY=your_clerk_secret_key
   ```

## Deploying the Application

1. **Build and Deploy**
   ```bash
   fly deploy
   ```

2. **Run Database Migrations**
   ```bash
   fly ssh console -C "cd /app && pnpm --filter backend exec prisma migrate deploy"
   ```

3. **Verify Deployment**
   ```bash
   fly status
   fly logs
   ```

## Updating the Application

1. Make your code changes
2. Test locally with Docker:
   ```bash
   docker build -t household-app .
   docker run -p 8080:8080 --env-file .env household-app
   ```
3. Deploy changes:
   ```bash
   fly deploy
   ```

## Troubleshooting

- Check application logs: `fly logs`
- SSH into the VM: `fly ssh console`
- View app status: `fly status`
- Check database connection: `fly postgres connect -a your-app-db`

## Important Notes

- The application runs on port 8080 internally
- Database migrations run automatically on deployment
- Environment variables are managed via Fly.io secrets
- The application uses a volume for persistent storage at `/data`
