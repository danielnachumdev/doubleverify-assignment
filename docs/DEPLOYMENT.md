# Deployment Guide

This document provides comprehensive instructions for deploying the ATM System to various cloud platforms and environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Heroku Deployment](#heroku-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [AWS Deployment](#aws-deployment)
7. [Health Checks and Monitoring](#health-checks-and-monitoring)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Git

### Development Tools (Optional)
- Docker and Docker Compose
- kubectl (for Kubernetes deployment)
- Heroku CLI (for Heroku deployment)
- AWS CLI (for AWS deployment)

## Environment Configuration

### Environment Variables

The application uses the following environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `API_VERSION` | API version | `1.0.0` | No |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `HEALTH_CHECK_PATH` | Health check endpoint | `/health` | No |

### Configuration Files

1. **`.env.example`** - Template for environment variables
2. **`.env.production`** - Production environment settings
3. **`app.json`** - Heroku deployment configuration
4. **`Procfile`** - Heroku process definition

## Heroku Deployment

### Quick Deploy

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Manual Deployment

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-atm-system-app
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set API_VERSION=1.0.0
   heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
   heroku config:set LOG_LEVEL=info
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Verify Deployment**
   ```bash
   heroku open
   curl https://your-app.herokuapp.com/health
   ```

### Heroku Configuration

The `app.json` file configures:
- Buildpacks (Node.js)
- Environment variables
- Add-ons (PostgreSQL)
- Formation (web dyno)

## Docker Deployment

### Local Docker

1. **Build Image**
   ```bash
   docker build -t atm-system .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e NODE_ENV=production \
     -e CORS_ORIGIN=* \
     atm-system
   ```

3. **Verify**
   ```bash
   curl http://localhost:3000/health
   ```

### Docker Compose

1. **Start Services**
   ```bash
   docker-compose up --build
   ```

2. **Production with Nginx**
   ```bash
   docker-compose --profile production up --build
   ```

3. **Stop Services**
   ```bash
   docker-compose down
   ```

### Docker Hub Deployment

1. **Tag Image**
   ```bash
   docker tag atm-system your-username/atm-system:latest
   ```

2. **Push to Registry**
   ```bash
   docker push your-username/atm-system:latest
   ```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (local or cloud)
- kubectl configured
- Docker image pushed to registry

### Deploy to Kubernetes

1. **Update Image in Deployment**
   ```yaml
   # In k8s-deployment.yaml
   image: your-username/atm-system:latest
   ```

2. **Apply Configuration**
   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```

3. **Verify Deployment**
   ```bash
   kubectl get pods
   kubectl get services
   kubectl get ingress
   ```

4. **Check Logs**
   ```bash
   kubectl logs -l app=atm-system
   ```

### Kubernetes Features

The deployment includes:
- **Deployment**: 3 replicas with resource limits
- **Service**: ClusterIP service for internal communication
- **Ingress**: External access with SSL termination
- **ConfigMap**: Configuration management
- **PodDisruptionBudget**: High availability

### Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment atm-system --replicas=5

# Auto-scaling (optional)
kubectl autoscale deployment atm-system --cpu-percent=70 --min=3 --max=10
```

## AWS Deployment

### AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize Application**
   ```bash
   eb init atm-system
   ```

3. **Create Environment**
   ```bash
   eb create production
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

### AWS ECS (Fargate)

1. **Create Task Definition**
   ```json
   {
     "family": "atm-system",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "atm-system",
         "image": "your-account.dkr.ecr.region.amazonaws.com/atm-system:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "healthCheck": {
           "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
           "interval": 30,
           "timeout": 5,
           "retries": 3
         }
       }
     ]
   }
   ```

2. **Create Service**
   ```bash
   aws ecs create-service \
     --cluster your-cluster \
     --service-name atm-system \
     --task-definition atm-system:1 \
     --desired-count 2 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
   ```

## Health Checks and Monitoring

### Health Check Endpoints

The application provides multiple health check endpoints:

1. **`/health`** - Comprehensive health check with system information
   ```json
   {
     "status": "OK",
     "message": "ATM System is running",
     "timestamp": "2023-12-07T10:30:00.000Z",
     "uptime": 3600,
     "environment": "production",
     "version": "1.0.0",
     "memory": {
       "used": 45.67,
       "total": 128.00,
       "external": 2.34
     },
     "system": {
       "platform": "linux",
       "nodeVersion": "v18.17.0",
       "pid": 1
     }
   }
   ```

2. **`/ready`** - Readiness probe for Kubernetes
3. **`/live`** - Liveness probe for Kubernetes

### Monitoring Setup

#### Application Performance Monitoring (APM)

1. **New Relic**
   ```bash
   npm install newrelic
   # Add to start of server.ts: require('newrelic');
   ```

2. **DataDog**
   ```bash
   npm install dd-trace
   # Add to start of server.ts: require('dd-trace').init();
   ```

#### Log Aggregation

1. **Heroku Logs**
   ```bash
   heroku logs --tail
   ```

2. **Docker Logs**
   ```bash
   docker logs -f container-name
   ```

3. **Kubernetes Logs**
   ```bash
   kubectl logs -f deployment/atm-system
   ```

## Security Considerations

### Production Security Checklist

- [ ] HTTPS enabled (SSL/TLS certificates)
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] Input validation in place
- [ ] Error messages don't expose sensitive information
- [ ] Dependencies regularly updated
- [ ] Security audits performed

### Security Headers

The application automatically sets these security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (HTTPS only)

## Performance Optimization

### Production Optimizations

1. **Node.js Clustering**
   ```javascript
   // Add to server.ts for multi-core utilization
   const cluster = require('cluster');
   const numCPUs = require('os').cpus().length;
   
   if (cluster.isMaster) {
     for (let i = 0; i < numCPUs; i++) {
       cluster.fork();
     }
   } else {
     // Start server
   }
   ```

2. **Caching**
   - Implement Redis for session storage
   - Add response caching for static endpoints
   - Use CDN for static assets

3. **Database Optimization**
   - Connection pooling
   - Query optimization
   - Read replicas for scaling

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :3000
   # Kill process
   kill -9 PID
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   docker stats
   # Increase memory limit
   docker run -m 512m atm-system
   ```

3. **Health Check Failures**
   ```bash
   # Test health endpoint
   curl -v http://localhost:3000/health
   # Check application logs
   docker logs container-name
   ```

### Debugging

1. **Enable Debug Logging**
   ```bash
   export LOG_LEVEL=debug
   npm start
   ```

2. **Check Environment Variables**
   ```bash
   printenv | grep -E "(NODE_ENV|PORT|CORS_ORIGIN)"
   ```

3. **Validate Configuration**
   ```bash
   # Test configuration
   npm run health:check
   ```

### Support

For deployment issues:

1. Check the [GitHub Issues](https://github.com/your-username/atm-system/issues)
2. Review application logs
3. Verify environment configuration
4. Test health endpoints
5. Contact support at support@atm-system.com

## Rollback Procedures

### Heroku Rollback
```bash
heroku releases
heroku rollback v123
```

### Kubernetes Rollback
```bash
kubectl rollout history deployment/atm-system
kubectl rollout undo deployment/atm-system
```

### Docker Rollback
```bash
docker tag atm-system:previous atm-system:latest
docker-compose up --build
```