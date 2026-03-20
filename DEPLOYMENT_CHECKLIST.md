# Deployment Checklist - Nhat Nam Manager

## Pre-Deployment

### Environment Variables
- [ ] `DATABASE_URL` - SQLite path (e.g., `file:./prisma/dev.db`)
- [ ] `JWT_SECRET` - Strong random secret for JWT signing (min 32 chars)
- [ ] `ADMIN_PASSWORD` - Initial admin password (default: `123456@Abc`)
- [ ] Google Drive credentials (if enabled):
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GOOGLE_REFRESH_TOKEN`
  - [ ] `GOOGLE_DRIVE_ROOT_FOLDER_ID`

### Database
- [ ] Run `npx prisma db push` to sync schema
- [ ] Run `npx prisma generate` to regenerate client
- [ ] Run `npx prisma db seed` to populate test data

### Code Quality
- [ ] No LSP errors in VS Code
- [ ] Build passes: `npm run build`
- [ ] Typecheck passes: `npx nuxt typecheck`

---

## Production Deployment

### Build Process
```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed data (optional, for demo)
npx prisma db seed

# Build for production
npm run build
```

### Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Edit with production values
nano .env
```

### Server Requirements
- Node.js 18+ (recommended: 20.x LTS)
- Minimum 512MB RAM
- SQLite database file backed up regularly

---

## Backup & Restore

### Backup Database
```bash
# Stop server first
pm2 stop nhat-nam-manager

# Copy database file
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)

# Restart server
pm2 start nhat-nam-manager
```

### Restore Database
```bash
# Stop server
pm2 stop nhat-nam-manager

# Restore from backup
cp prisma/dev.db.backup.20240101 prisma/dev.db

# Restart server
pm2 start nhat-nam-manager
```

---

## PM2 Process Manager

### Start Application
```bash
# Start with ecosystem file
pm2 start ecosystem.config.js

# Or start directly
pm2 start npm --name "nhat-nam-manager" -- start
```

### Common Commands
```bash
pm2 list                    # Show all processes
pm2 logs nhat-nam-manager   # View logs
pm2 restart nhat-nam-manager # Restart
pm2 stop nhat-nam-manager   # Stop
pm2 delete nhat-nam-manager # Remove from PM2
```

---

## Testing Checklist

### Authentication
- [ ] Admin login works
- [ ] Sale login works
- [ ] Design login works
- [ ] Construction login works
- [ ] Role-based route protection works
- [ ] JWT expiration handled

### Lead Flow
- [ ] Create lead
- [ ] View leads (role-filtered)
- [ ] Assign designer
- [ ] Update design status
- [ ] Convert lead to customer + project

### Project Management
- [ ] View projects
- [ ] Add receipts
- [ ] Add expenses
- [ ] Task management
- [ ] Task filters and bulk actions

### Reporting
- [ ] Financial reports
- [ ] Project progress reports
- [ ] Team performance
- [ ] Lead funnel

### Notifications
- [ ] Notification bell displays
- [ ] Mark as read works
- [ ] Notifications page loads

---

## Rollback Plan

If issues occur after deployment:

1. **Immediate rollback**: Restore database backup
2. **Code rollback**: Use git to revert to previous version
3. **Hotfix**: Create fix branch, test, merge, rebuild

---

## Monitoring

### Log Locations
- Application logs: `~/.pm2/logs/`
- Error logs: Check PM2 logs

### Key Metrics to Monitor
- API response times
- Database query performance
- Memory usage
- Disk space (especially for SQLite)

---

## Support Contacts

- Development Team: [contact info]
- Server Admin: [contact info]
