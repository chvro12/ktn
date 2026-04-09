"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { readApiErrorMessage } from "@/lib/api-errors";
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
    <Card className="w-full max-w-md border-border shadow-none">
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Compte viewer par défaut ; coche créateur pour ouvrir une chaîne
          ensuite.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          setServerError(null);
          try {
            await mutation.mutateAsync(values);
          } catch (e) {
            setServerError(e instanceof Error ? e.message : "Erreur inconnue");
          }
        })}
      >
        <CardContent className="space-y-4">
          {serverError ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
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
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <div className="flex items-start gap-2 pt-1">
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
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            type="submit"
            className="w-full sm:w-auto"
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
