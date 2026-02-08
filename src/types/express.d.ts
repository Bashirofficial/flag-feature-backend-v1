import { Request } from 'express';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'ADMIN' | 'MEMBER';
        organizationId: string;
      };
      
      // For API key authentication on public routes
      apiKey?: {
        id: string;
        organizationId: string;
        environmentId: string;
        environmentKey: string;
      };
    }
  }
}

export {};


/*import { Role } from "@prisma/client";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: Role;
    };
  }
}
*/