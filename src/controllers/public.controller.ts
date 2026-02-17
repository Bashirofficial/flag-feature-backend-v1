import { Request, Response } from "express";
import prisma from "../db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AsyncHandler } from "../utils/AsyncHandler"; 

//--------- Controllers (C) ---------//

/* C1. Get all flags for the environment */
const getAllFlags = AsyncHandler(async (req: Request, res: Response) => {

    const { organizationId, environmentId} = req.apiKey!;
    
    const flags = await prisma.featureFlag.findMany({
        where: { organizationId, isActive: true },
        include: {
            environmentValues: {
                where: {
                    environmentId
                }
            }
        }
    })
    const flagsMap: Record<string, any> = {};

    flags.forEach((flag) => {
        if (flag.environmentValues.length > 0) {
            flagsMap[flag.key] = flag.environmentValues[0]?.value ?? null;
        }
    })
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,  
                {
                    flags: flagsMap,
                    environment: req.apiKey!.environmentKey,
                }, 
                "Flags retrieved successfully"),
        );
});


/* C2. Get a single flag by key value */
const getFlagByKey =  AsyncHandler(async (req: Request, res: Response) => {

    return res
        .status(200)
        .json(
            new ApiResponse(200, , "")
        )
})


/* C3. Get multiple specific flag */
const getBulkFlags =  AsyncHandler(async (req: Request, res: Response) => {

    return res
        .status(200)
        .json(
            new ApiResponse(200, , "")
        )
})


/* C4. Check if a flag is enabled  */
const isFlagEnabled =  AsyncHandler(async (req: Request, res: Response) => {

    return res
        .status(200)
        .json(
            new ApiResponse(200, , "")
        )
})