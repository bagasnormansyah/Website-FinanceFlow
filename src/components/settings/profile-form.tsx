"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfile } from "@/lib/actions/settings";
import { CURRENCIES } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { Controller } from "react-hook-form";

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      currency: (CURRENCIES.includes(profile.currency as (typeof CURRENCIES)[number])
        ? profile.currency
        : "IDR") as ProfileInput["currency"],
    },
  });

  async function onSubmit(values: ProfileInput) {
    const result = await updateProfile(values);
    if (result.success) {
      toast.success(result.message ?? "Pengaturan disimpan.");
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal menyimpan pengaturan.");
    }
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={email} disabled readOnly />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Nama Lengkap</Label>
        <Input id="profile-name" {...form.register("full_name")} />
        {errors.full_name ? <p className="text-xs text-destructive">{errors.full_name.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label>Mata Uang</Label>
        <Controller
          control={form.control}
          name="currency"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.currency ? <p className="text-xs text-destructive">{errors.currency.message}</p> : null}
      </div>
      <Button type="submit">Simpan Pengaturan</Button>
    </form>
  );
}
