"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatClientFetchErrorMessage,
  readApiErrorMessage,
} from "@/lib/api-errors";
import { apiFetch } from "@/lib/api";
import { registerFormSchema, type RegisterFormValues } from "@/lib/schemas/auth";

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      username: "",
      displayName: "",
      password: "",
      isCreator: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      const res = await apiFetch("/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          username: values.username,
          displayName: values.displayName,
          password: values.password,
          role: values.isCreator ? "CREATOR" : "VIEWER",
        }),
      });
      if (!res.ok) {
        const msg = await readApiErrorMessage(res, "Inscription impossible");
        throw new Error(msg);
      }
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["channel", "me"] });
      if (variables.isCreator) {
        router.push("/onboarding/channel");
      } else {
        router.push("/");
      }
      router.refresh();
    },
  });

  const isCreator = form.watch("isCreator");

  return (
    <Card className="w-full max-w-lg rounded-[2rem] border border-border/70 bg-card/90 py-0 shadow-[0_28px_80px_-48px_rgba(23,23,23,0.45)]">
      <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
        <div className="mb-2 inline-flex size-11 items-center justify-center rounded-2xl bg-foreground text-primary-foreground shadow-[0_18px_40px_-28px_rgba(0,0,0,0.6)]">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Créer un compte
        </CardTitle>
        <CardDescription>
          Rejoins Katante pour regarder, sauvegarder ou publier tes propres
          vidéos.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          setServerError(null);
          try {
            await mutation.mutateAsync(values);
          } catch (e) {
            setServerError(formatClientFetchErrorMessage(e));
          }
        })}
      >
        <CardContent className="space-y-4 px-6 pb-6 sm:px-7">
          {serverError ? (
            <p
              className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {serverError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!form.formState.errors.email}
              className="h-11 rounded-xl border-border/70 bg-background/75"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-username">Nom d’utilisateur</Label>
            <Input
              id="reg-username"
              autoComplete="username"
              aria-invalid={!!form.formState.errors.username}
              className="h-11 rounded-xl border-border/70 bg-background/75"
              {...form.register("username")}
            />
            {form.formState.errors.username ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.username.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-display">Nom affiché</Label>
            <Input
              id="reg-display"
              autoComplete="name"
              aria-invalid={!!form.formState.errors.displayName}
              className="h-11 rounded-xl border-border/70 bg-background/75"
              {...form.register("displayName")}
            />
            {form.formState.errors.displayName ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.displayName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Mot de passe</Label>
            <Input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!form.formState.errors.password}
              className="h-11 rounded-xl border-border/70 bg-background/75"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <input
              id="reg-creator"
              type="checkbox"
              className="mt-1 size-4 rounded border-input"
              {...form.register("isCreator")}
            />
            <div>
              <Label htmlFor="reg-creator" className="font-normal">
                Je veux publier des vidéos (créateur)
              </Label>
              <p className="text-xs text-muted-foreground">
                Tu pourras créer ta chaîne juste après l’inscription.
              </p>
            </div>
          </div>
          {isCreator ? (
            <p className="text-xs text-muted-foreground">
              Après inscription, redirection vers la création de chaîne.
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 rounded-b-[2rem] border-t border-border/70 bg-muted/35 px-6 py-5 sm:flex-row sm:justify-between sm:px-7">
          <Button
            type="submit"
            className="h-11 w-full rounded-xl sm:w-auto"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Création…" : "S’inscrire"}
          </Button>
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            Déjà inscrit ?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
