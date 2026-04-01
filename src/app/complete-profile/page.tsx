"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name:           z.string().min(2, "At least 2 characters").max(100),
  phone:          z.string().min(10, "Enter a valid number").max(20)
                    .regex(/^[+\d\s\-()\u200F]+$/, "Numbers only"),
  defaultAddress: z.string().min(5, "Enter your full address").max(500),
  defaultCity:    z.string().min(2, "Enter your city").max(100),
});

type FormValues = z.infer<typeof schema>;

function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, getIdToken, setUserProfile } = useAuth();

  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [serverError, setServerError] = useState("");

  // Where to go after saving — passed as ?redirect=/kitchen/abc
  const redirectTo = searchParams.get("redirect") ?? "/";

  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name:           "",
      phone:          "",
      defaultAddress: "",
      defaultCity:    "",
    },
  });

  // Protect route
  useEffect(() => {
    // We do explicit redirect inside the render loop OR here.
    // The prompt requested exact code:
    // if (!user) { router.push('/login'); return null }
    // Let's keep the standard structure but add the prompt's condition below.
  }, []);

  // Pre-fill form with existing profile values on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch("/api/account/profile-update", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const profile = data.data?.profile;
        if (profile) {
          reset({
            name:           profile.name           ?? user?.name ?? "",
            phone:          profile.phone           ?? "",
            defaultAddress: profile.defaultAddress  ?? "",
            defaultCity:    profile.defaultCity     ?? "",
          });
        }
      } catch (e) {
         console.warn("Failed to load profile", e)
      }
      finally { setLoadingProfile(false); }
    }
    if (!loading) {
      if (user) loadProfile();
      else setLoadingProfile(false);
    }
  }, [user, loading, getIdToken, reset]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    setServerError("");
    try {
      const token = await getIdToken();
      const res = await fetch("/api/account/profile-update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to save profile");

      // Update context so rest of app has fresh data
      if (setUserProfile) {
          setUserProfile(result.data?.profile ?? null);
      }

      // Proceed to destination
      router.replace(redirectTo);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center dark:bg-neutral-900">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin dark:border-neutral-700 dark:border-t-orange-500" />
      </div>
    );
  }

  if (!user) {
    router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white flex items-center justify-center px-4 py-12 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="w-full max-w-md animate-slide-up">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden dark:bg-neutral-800 border dark:border-neutral-700">

          {/* Top banner */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-white text-center">
            <div className="text-4xl mb-2">🍱</div>
            <h1 className="text-xl font-bold">Confirm your details</h1>
            <p className="text-orange-100 text-sm mt-1">
              Kitchens use this to confirm your order
            </p>
          </div>

          <div className="px-8 py-7">

            {/* Signed-in as */}
            {user && (
              <div className="flex items-center gap-3 bg-neutral-50 rounded-2xl p-3 mb-6 border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-700">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-9 h-9 rounded-full ring-2 ring-orange-200" />
                  : <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold dark:bg-orange-900/30 dark:text-orange-400">{user.email?.[0]?.toUpperCase()}</div>
                }
                <div className="min-w-0">
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Signed in as</p>
                  <p className="text-sm font-medium text-neutral-700 truncate dark:text-neutral-200">{user.email}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 dark:text-neutral-400">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  {...register("name")}
                  placeholder="Ahmed Khan"
                  autoComplete="name"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition dark:bg-neutral-900 dark:text-white ${
                    errors.name
                      ? "border-red-300 focus:ring-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800"
                      : "border-neutral-200 focus:ring-orange-400 focus:border-orange-400 dark:border-neutral-700 dark:focus:border-orange-500"
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 dark:text-neutral-400">
                  Phone / WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  {...register("phone")}
                  placeholder="+92 300 1234567"
                  autoComplete="tel"
                  type="tel"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition dark:bg-neutral-900 dark:text-white ${
                    errors.phone
                      ? "border-red-300 focus:ring-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800"
                      : "border-neutral-200 focus:ring-orange-400 focus:border-orange-400 dark:border-neutral-700 dark:focus:border-orange-500"
                  }`}
                />
                <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                  🔒 Only shared with the kitchen you order from
                </p>
                {errors.phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.phone.message}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 dark:text-neutral-400">
                  Delivery Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  {...register("defaultAddress")}
                  placeholder="House #12, Street 4, F-10/3"
                  rows={2}
                  autoComplete="street-address"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition resize-none dark:bg-neutral-900 dark:text-white ${
                    errors.defaultAddress
                      ? "border-red-300 focus:ring-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800"
                      : "border-neutral-200 focus:ring-orange-400 focus:border-orange-400 dark:border-neutral-700 dark:focus:border-orange-500"
                  }`}
                />
                {errors.defaultAddress && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.defaultAddress.message}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 dark:text-neutral-400">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  {...register("defaultCity")}
                  placeholder="Islamabad"
                  autoComplete="address-level2"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition dark:bg-neutral-900 dark:text-white ${
                    errors.defaultCity
                      ? "border-red-300 focus:ring-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800"
                      : "border-neutral-200 focus:ring-orange-400 focus:border-orange-400 dark:border-neutral-700 dark:focus:border-orange-500"
                  }`}
                />
                {errors.defaultCity && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.defaultCity.message}</p>}
              </div>

              {/* Server error */}
              {serverError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 mt-2">
                  <span>⚠️</span> {serverError}
                </div>
              )}

              {/* Save button — STRICTLY disabled until all fields valid */}
              <button
                type="submit"
                disabled={!isValid || saving}
                className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 mt-4 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-neutral-800 ${
                  isValid && !saving
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 active:scale-[0.98]"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-500"
                }`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save & Continue →"
                )}
              </button>

              {/* No skip — hard requirement */}
              <p className="text-center text-[11px] text-neutral-400 pb-1 font-medium mt-4">
                Required to place orders. You can update anytime from your account.
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center dark:bg-neutral-900">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin dark:border-neutral-700 dark:border-t-orange-500" />
      </div>
    }>
      <ProfileForm />
    </Suspense>
  );
}
