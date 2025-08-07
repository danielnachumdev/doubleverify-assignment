# EC2 Deployment Guide - Docker Setup

This guide provides comprehensive instructions for deploying the ATM System to AWS EC2 using Docker.

## Overview

This deployment uses:
- **AWS EC2** instance for hosting
- **Docker** for containerization
- **Docker Compose** for orchestration
- **Nginx** as reverse proxy (optional)
- **Let's Encrypt** for SSL certificates (optional)

## Prerequisites

- AWS Account with EC2 access
- Domain name (optional, for SSL)
- Basic knowledge of AWS EC2 and Docker
- SSH key pair for EC2 access

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance

1. **Login to AWS Console** and navigate to EC2
2. **Launch Instance** with these specifications:
   - **AMI**: Ubuntu Server 22.04 LTS (Free Tier Eligible)
   - **Instance Type**: t3.micro (Free Tier) or t3.small (recommended)
   - **Key Pair**: Create or select existing key pair
   - **Security Group**: Create new with these rules:
     - SSH (22) - Your IP only
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom TCP (3000) - 0.0.0.0/0 (for direct access)

3. **Launch Instance** and note the public IP address

### 1.2 Connect to Instance

```bash
# Replace with your key file and public IP
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 2: Install Docker and Dependencies

### 2.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
```

### 2.3 Reconnect and Verify

```bash
# Reconnect to EC2
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Verify installations
docker --version
docker-compose --version
```

## Step 3: Deploy Application

### 3.1 Clone Repository

```bash
# Clone your repository (replace with your repo URL)
git clone https://github.com/your-username/atm-system.git
cd atm-system
```

### 3.2 Configure Environment

```bash
# Create environment file
cat > .env.production << EOF
NODE_ENV=production
PORT=3000
API_VERSION=1.0.0
CORS_ORIGIN=*
LOG_LEVEL=info
HEALTH_CHECK_PATH=/health
EOF
```

### 3.3 Build and Start Services

```bash
# Build and start the application
docker-compose up --build -d

# Verify containers are running
docker-compose ps
```

### 3.4 Initialize Demo Data

```bash
# Wait for application to start (30 seconds)
sleep 30

# Seed demo data
curl -X POST http://localhost:3000/seed

# Verify application is running
curl http://localhost:3000/health
```

## Step 4: Test Deployment

### 4.1 Test from EC2 Instance

```bash
# Check health
curl http://localhost:3000/health

# Check API info
curl http://localhost:3000/

# Test balance inquiry
curl http://localhost:3000/accounts/123456789/balance

# Test withdrawal
curl -X POST http://localhost:3000/accounts/123456789/withdraw \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

### 4.2 Test from External

```bash
# Replace with your EC2 public IP
export EC2_IP="your-ec2-public-ip"

# Test from your local machine
curl http://$EC2_IP:3000/health
curl http://$EC2_IP:3000/accounts/123456789/balance
```

## Step 5: Production Setup (Optional)

### 5.1 Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/atm-system
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or EC2 public IP
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint (bypass rate limiting)
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # No rate limiting for health checks
        limit_req off;
    }
}
```

Enable the site:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/atm-system /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5.2 Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Create symlink
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 6: Monitoring and Maintenance

### 6.1 View Logs

```bash
# Application logs
docker-compose logs -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### 6.2 Container Management

```bash
# Check container status
docker-compose ps

# Restart services
docker-compose restart

# Update application
git pull
docker-compose up --build -d

# Stop services
docker-compose down

# Remove everything (including volumes)
docker-compose down -v
```

### 6.3 System Monitoring

```bash
# Check system resources
htop
df -h
free -h

# Check Docker resources
docker system df
docker stats
```

## Step 7: Backup and Recovery

### 7.1 Create Backup Script

```bash
# Create backup directory
mkdir -p ~/backups

# Create backup script
nano ~/backup.sh
```

Add this content:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups"

# Create backup
mkdir -p "$BACKUP_DIR/$DATE"

# Backup application data (if any persistent data exists)
docker-compose exec atm-system tar czf - /app/data 2>/dev/null | cat > "$BACKUP_DIR/$DATE/app_data.tar.gz" || echo "No app data to backup"

# Backup configuration
cp -r ~/atm-system "$BACKUP_DIR/$DATE/"

# Keep only last 7 backups
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR/$DATE"
```

Make executable and run:
```bash
chmod +x ~/backup.sh
./backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

## Step 8: Security Hardening

### 8.1 Firewall Configuration

```bash
# Install and configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check status
sudo ufw status
```

### 8.2 Fail2Ban Setup

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create jail configuration
sudo nano /etc/fail2ban/jail.local
```

Add this configuration:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
```

Start Fail2Ban:
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status
```

## Troubleshooting

### Common Issues

1. **Port 3000 not accessible**
   ```bash
   # Check if application is running
   docker-compose ps
   
   # Check if port is open
   sudo netstat -tlnp | grep :3000
   
   # Check security group in AWS Console
   ```

2. **Docker permission denied**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

3. **Application not starting**
   ```bash
   # Check logs
   docker-compose logs
   
   # Check environment variables
   docker-compose exec atm-system env
   ```

4. **Nginx configuration errors**
   ```bash
   # Test configuration
   sudo nginx -t
   
   # Check logs
   sudo tail -f /var/log/nginx/error.log
   ```

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Docker health
docker-compose ps

# System health
df -h
free -h
uptime
```

## Cost Estimation

### EC2 Instance Costs (US East 1)
- **t3.micro**: ~$8.50/month (Free Tier eligible for first year)
- **t3.small**: ~$17/month (recommended for production)
- **Data Transfer**: First 1GB free, then $0.09/GB

### Additional Costs
- **Elastic IP**: $0 if attached to running instance
- **EBS Storage**: $0.10/GB-month (default 8GB = $0.80/month)
- **Domain**: ~$12/year (optional)

**Total Monthly Cost**: $8.50-$17 (first year free with t3.micro)

## Maintenance Schedule

### Daily
- Monitor application logs
- Check system resources

### Weekly
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review security logs: `sudo fail2ban-client status`
- Check backup status

### Monthly
- Review and rotate logs
- Update Docker images: `docker-compose pull && docker-compose up -d`
- Security audit: `sudo lynis audit system`

## Support

For deployment issues:
1. Check application logs: `docker-compose logs`
2. Verify environment configuration
3. Test health endpoints
4. Check AWS security groups
5. Review this documentation

## Cleanup

To completely remove the deployment:

```bash
# Stop and remove containers
docker-compose down -v

# Remove Docker images
docker system prune -a

# Remove application files
rm -rf ~/atm-system

# Remove Nginx configuration
sudo rm /etc/nginx/sites-enabled/atm-system
sudo rm /etc/nginx/sites-available/atm-system
sudo systemctl restart nginx

# Terminate EC2 instance via AWS Console
```