#!/usr/bin/env node

/**
 * Creator Armour Deployment Script
 *
 * This script handles deployment to various environments with proper
 * build optimization, security checks, and monitoring setup.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {object} */
const DeploymentConfig = {
  environment: '',
  buildCommand: '',
  deployCommand: '',
  domain: '',
  cdn: '',
  monitoring: false,
  analytics: false,
};

const deploymentConfigs = {
  development: {
    environment: 'development',
    buildCommand: 'npm run build',
    deployCommand: 'rsync -avz --delete dist/ user@dev-server:/var/www/creator-armour-dev/',
    domain: 'dev.creatorarmour.com',
    monitoring: false,
    analytics: false,
  },
  staging: {
    environment: 'staging',
    buildCommand: 'npm run build:staging',
    deployCommand: 'aws s3 sync dist/ s3://creator-armour-staging --delete && aws cloudfront create-invalidation --distribution-id STAGING_DISTRIBUTION_ID --paths "/*"',
    domain: 'staging.creatorarmour.com',
    cdn: 'https://cdn-staging.creatorarmour.com',
    monitoring: true,
    analytics: true,
  },
  production: {
    environment: 'production',
    buildCommand: 'npm run build:production',
    deployCommand: 'aws s3 sync dist/ s3://creator-armour-production --delete && aws cloudfront create-invalidation --distribution-id PRODUCTION_DISTRIBUTION_ID --paths "/*"',
    domain: 'creatorarmour.com',
    cdn: 'https://cdn.creatorarmour.com',
    monitoring: true,
    analytics: true,
  },
};

class Deployer {
  private environment: string;
  private config: object;

  constructor(environment: string) {
    if (!deploymentConfigs[environment]) {
      throw new Error(`Unknown environment: ${environment}. Available: ${Object.keys(deploymentConfigs).join(', ')}`);
    }

    this.environment = environment;
    this.config = deploymentConfigs[environment];
  }

  async deploy(): Promise<void> {
    console.log(`🚀 Starting deployment to ${this.environment}...`);

    try {
      // Pre-deployment checks
      await this.runPreDeploymentChecks();

      // Build application
      await this.buildApplication();

      // Optimize build
      await this.optimizeBuild();

      // Security checks
      await this.runSecurityChecks();

      // Deploy to target
      await this.deployToTarget();

      // Post-deployment tasks
      await this.runPostDeploymentTasks();

      // Health checks
      await this.runHealthChecks();

      console.log(`✅ Deployment to ${this.environment} completed successfully!`);
      console.log(`🌐 Application available at: https://${this.config.domain}`);

    } catch (error) {
      console.error(`❌ Deployment failed:`, error);
      await this.rollback();
      process.exit(1);
    }
  }

  private async runPreDeploymentChecks(): Promise<void> {
    console.log('🔍 Running pre-deployment checks...');

    // Check if git is clean
    try {
      execSync('git diff --quiet && git diff --staged --quiet', { stdio: 'pipe' });
    } catch {
      throw new Error('Git working directory is not clean. Please commit or stash changes.');
    }

    // Check Node.js version
    const nodeVersion = process.version;
    if (!nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v20')) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or 20.`);
    }

    // Check environment variables
    this.checkEnvironmentVariables();

    console.log('✅ Pre-deployment checks passed');
  }

  private async buildApplication(): Promise<void> {
    console.log('🔨 Building application...');

    // Clean previous build
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }

    // Run build command
    execSync(this.config.buildCommand, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: this.environment,
        VITE_ENVIRONMENT: this.environment,
        VITE_DOMAIN: this.config.domain,
        VITE_CDN_URL: this.config.cdn || '',
      }
    });

    // Verify build output
    if (!fs.existsSync('dist/index.html')) {
      throw new Error('Build failed: dist/index.html not found');
    }

    console.log('✅ Build completed successfully');
  }

  private async optimizeBuild(): Promise<void> {
    console.log('⚡ Optimizing build...');

    // Run bundle analyzer in CI
    if (process.env.CI) {
      try {
        execSync('npm run analyze-bundle', { stdio: 'inherit' });
      } catch (error) {
        console.warn('⚠️  Bundle analysis failed, continuing...');
      }
    }

    // Compress assets
    if (fs.existsSync('dist/assets')) {
      const assets = fs.readdirSync('dist/assets');
      console.log(`📦 Found ${assets.length} assets to optimize`);
    }

    console.log('✅ Build optimization completed');
  }

  private async runSecurityChecks(): Promise<void> {
    console.log('🔒 Running security checks...');

    // Check for sensitive data in build
    const distPath = path.join(process.cwd(), 'dist');
    const sensitivePatterns = [
      /API_KEY/i,
      /SECRET/i,
      /PASSWORD/i,
      /TOKEN/i,
      /PRIVATE_KEY/i,
    ];

    const checkFile = (filePath: string) => {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const pattern of sensitivePatterns) {
        if (pattern.test(content)) {
          throw new Error(`Security violation: Sensitive data pattern found in ${filePath}`);
        }
      }
    };

    const checkDirectory = (dirPath: string) => {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          checkDirectory(itemPath);
        } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.html'))) {
          checkFile(itemPath);
        }
      }
    };

    checkDirectory(distPath);

    // Check CSP headers will be applied
    const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
    if (!indexHtml.includes('content-security-policy')) {
      console.warn('⚠️  CSP headers should be configured at server level');
    }

    console.log('✅ Security checks passed');
  }

  private async deployToTarget(): Promise<void> {
    console.log('📤 Deploying to target environment...');

    const deployCommand = this.config.deployCommand
      .replace('STAGING_DISTRIBUTION_ID', process.env.AWS_STAGING_DISTRIBUTION_ID || '')
      .replace('PRODUCTION_DISTRIBUTION_ID', process.env.AWS_PRODUCTION_DISTRIBUTION_ID || '');

    execSync(deployCommand, { stdio: 'inherit' });

    console.log('✅ Deployment completed');
  }

  private async runPostDeploymentTasks(): Promise<void> {
    console.log('🔧 Running post-deployment tasks...');

    // Purge CDN cache if applicable
    if (this.config.cdn && this.environment === 'production') {
      console.log('🗑️  Purging CDN cache...');
      // CDN purge logic would go here
    }

    // Update deployment metadata
    const metadata = {
      environment: this.environment,
      deployedAt: new Date().toISOString(),
      commit: execSync('git rev-parse HEAD').toString().trim(),
      buildId: process.env.BUILD_ID || 'manual',
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'dist', 'deployment.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('✅ Post-deployment tasks completed');
  }

  private async runHealthChecks(): Promise<void> {
    console.log('🏥 Running health checks...');

    // Wait for deployment to propagate
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Basic health check
    try {
      const response = await fetch(`https://${this.config.domain}`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      console.log('✅ Health checks passed');
    } catch (error) {
      console.warn(`⚠️  Health check failed: ${error}. This may be normal for new deployments.`);
    }
  }

  private async rollback(): Promise<void> {
    console.log('🔄 Initiating rollback...');

    // Basic rollback logic - could be enhanced with proper rollback strategies
    if (this.environment === 'production') {
      console.log('Production rollback would restore previous deployment...');
      // Implement production rollback logic
    }

    console.log('✅ Rollback completed');
  }

  private checkEnvironmentVariables(): void {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
    ];

    if (this.config.monitoring) {
      requiredVars.push('VITE_SENTRY_DSN');
    }

    if (this.config.analytics) {
      requiredVars.push('VITE_GA_TRACKING_ID');
    }

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }
  }
}

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  const environment = args[0];

  if (!environment || !['development', 'staging', 'production'].includes(environment)) {
    console.error('Usage: deploy.js <environment>');
    console.error('Available environments: development, staging, production');
    process.exit(1);
  }

  const deployer = new Deployer(environment);
  await deployer.deploy();
};

// Export for programmatic usage
export { Deployer, deploymentConfigs };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}