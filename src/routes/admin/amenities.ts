import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Amenities } from "@/database/models/amenities.js";
import {
    amenitiesSchema,
    type AmenitiesSchema,
} from "@/database/schemas/amenities.js";

import { getIdSchema } from "@/database/schemas/string.js";
import {
    getAmenities,
    getAmenity,
    createAmenity, deleteAmenity, updateAmenity
} from "@/controllers/admin/amenities.js";

const router = Router();


//  GET LIST (with optional filters)
const getListSchema = z.object({
    category: z.string().optional(),
});

router.get(
    "/",
    RequestMiddleware.queryValidator(getListSchema, {
        validateOnlyPresent: true,
        allowEmpty: true,
    }),
    getAmenities
);


//  GET SINGLE
router.get(
    "/:id",
    RequestMiddleware.paramValidator(getIdSchema(), "id"),
    getAmenity
);


//  CREATE
router.post(
    "/",
    RequestMiddleware.bodyValidator(amenitiesSchema, {
        validateOnlyPresent: false,
        overridePostValidation: true,
        extractOnlyRequiredFields: true,
    }),
    createAmenity
);


//  UPDATE ( based on your Space module)
router.put(
    "/:id",
    RequestMiddleware.paramValidator(getIdSchema(), "id"),

    RequestMiddleware.bodyValidator(
        amenitiesSchema, // no omit needed (unlike space)
        {
            allowEmpty: true,
            validateOnlyPresent: true,
            overridePostValidation: true,
            extractOnlyRequiredFields: true,
        }
    ),

    updateAmenity
);


//  DELETE
router.delete(
    "/:id",
    RequestMiddleware.paramValidator(getIdSchema(), "id"),
    deleteAmenity
);


export { router as AmenitiesRouter };