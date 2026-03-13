import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiBadRequest, apiUnauthorized, apiNotFound } from "@/lib/utils/api-response";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .transform(s => s.trim()),
  phone: z.string()
    .min(10, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d\s\-()\u200F]+$/, "Invalid phone number format")
    .transform(s => s.trim()),
  defaultAddress: z.string()
    .min(5, "Enter your full delivery address")
    .max(500)
    .transform(s => s.trim()),
  defaultCity: z.string()
    .min(2, "Enter your city")
    .max(100)
    .transform(s => s.trim()),
});

export async function PUT(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return apiUnauthorized();

  const body = await request.json().catch(() => null);
  if (!body) return apiBadRequest("Invalid request body");

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    // Return the first validation error in plain English
    return apiBadRequest(parsed.error.issues[0].message);
  }

  await db.update(users).set({
    name:           parsed.data.name,
    phone:          parsed.data.phone,
    defaultAddress: parsed.data.defaultAddress,
    defaultCity:    parsed.data.defaultCity,
    updatedAt:      new Date(),
  }).where(eq(users.id, authUser.id));

  // Return updated profile so client can update context
  return apiSuccess({
    profile: {
      name:           parsed.data.name,
      phone:          parsed.data.phone,
      defaultAddress: parsed.data.defaultAddress,
      defaultCity:    parsed.data.defaultCity,
    }
  });
}

// GET — fetch current profile values (used to pre-fill the form)
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return apiUnauthorized();

  const [user] = await db
    .select({
      name:           users.name,
      phone:          users.phone,
      defaultAddress: users.defaultAddress,
      defaultCity:    users.defaultCity,
      email:          users.email,
      avatarUrl:      users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, authUser.id));

  if (!user) return apiNotFound("User not found");

  return apiSuccess({ profile: user });
}
