import { Request, Response } from "express";
import prisma from "../db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AsyncHandler } from "../utils/AsyncHandler"; 

//--------- Controllers (C) ---------//

/* C1. Get all flags */
const getAllFlags = AsyncHandler(async (req: Request, res: Response) => {

    const organizationId = req.user!.organizationId;
    
    const flags = await prisma.featureFlag.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            key: true,
            name: true,
            description: true,
            type: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200,  flags, "Flags retrieved successfully"),
        );
});


/* C2. Get a flag */
const getFlag = AsyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const flag = await prisma.featureFlag.findUnique({
        where: { 
            id,
            organizationId,
         },

        select: {
            id: true,
            key: true,
            name: true,
            description: true,
            type: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,

            environmentValues: {
                orderBy: {
                    environment: {
                        sortOrder: "asc" 
                    } 
                }, 
                select: {
                    value: true,
                    environment: {
                        select: {
                            id: true,
                            name: true,
                            key: true
                        }, 
                    },
                }
                
            }  
        }
    })
    
    if (!flag) {
        throw new ApiError(404, "Flag not found")
    }
 

    return res
        .status(200)
        .json(
            new ApiResponse(200,  flag, "Flag retrieved successfully"),
        );
});


/* C3. Create a flag */
const createFlag = AsyncHandler(async (req: Request, res: Response) => {
  const { key, name, description, type = 'BOOLEAN', defaultValue} = req.body;
  const organizationId = req.user!.organizationId;

  const existingFlag = await prisma.featureFlag.findUnique({
    where: {
        key,
        organizationId,
    }
  })

  if (existingFlag) {
    throw new ApiError(409, 'Flag with this key already exists')
  }

  const environments = await prisma.environment.findMany({
    where: { organizationId },
    orderBy: { sortOrder: 'asc' }
  })

  if (environments.length === 0) {
    throw new ApiError(400, 'No  environments found for organization')
  }

  let initialValue: any = defaultValue !== undefined ? defaultValue: false;

  if (type === 'BOOLEAN' && typeof initialValue !== 'boolean') {
    initialValue = false;
  } else if (type === 'NUMBER' && typeof initialValue !== 'number') {
    initialValue = 0;
  } else if (type === 'STRING' && typeof initialValue !== 'string') {
    initialValue = '';
  }

  const flag = await prisma.$transaction(async (tx) => {
    const newFlag = await tx.featureFlag.create({
        data: {
            key,
            name,
            description,
            type,
            organizationId
        }
    })

    await Promise.all(
        environments.map((ev) =>
            tx.flagEnvironmentValue.create({
                data: {
                    flagId: newFlag.id,
                    environmentId: env.id,
                    value: initialValue
                }
            })
        )
    )

    await tx.auditLog.create({
        data: {
            action: 'FLAG_CREATED',
            resourceType: 'flag',
            resourceId: newFlag.id,
            resourceName: key,
            organizationId,
            userId: req.user!.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }
    })

    return newFlag;
  })

  return res
    .status(200)
    .json(
      new ApiResponse(200,  { id: flag.id }, "Flag created successfully"),
    );
});

/* C4. Update a flag */
const updateFlag = AsyncHandler(async (req: Request, res: Response) => {
 
  return res
    .status(200)
    .json(
      new ApiResponse(200,  , " "),
    );
});


/* C5. Delete a flag */
const deleteFlag = AsyncHandler(async (req: Request, res: Response) => {
 
  return res
    .status(200)
    .json(
      new ApiResponse(200,  , " "),
    );
});


/* C3. Update flag for specific value of environment */
const getFlag = AsyncHandler(async (req: Request, res: Response) => {
 
  return res
    .status(200)
    .json(
      new ApiResponse(200,  , " "),
    );
});
