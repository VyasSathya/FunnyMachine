import { Request, Response, NextFunction } from 'express';
import semver from 'semver';

export interface VersionConfig {
  minVersion: string;
  maxVersion: string;
}

export const checkVersion = (config: VersionConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = req.headers['accept-version'] as string || '1.0.0';

    if (!semver.valid(version)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid version format. Please use semantic versioning (e.g., 1.0.0)'
      });
    }

    if (!semver.satisfies(version, `>=${config.minVersion} <=${config.maxVersion}`)) {
      return res.status(400).json({
        success: false,
        error: `API version ${version} is not supported. Please use versions between ${config.minVersion} and ${config.maxVersion}`
      });
    }

    // Add version to request for use in routes
    req.apiVersion = version;
    next();
  };
}; 