"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { loginFormSchema, type LoginFormValues } from "@/lib/schemas/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const res = await apiFetch("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const msg = await readApiErrorMessage(res, "Connexion impossible");
        throw new Error(msg);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["channel", "me"] });
      router.push(nextPath);
      router.refresh();
    },
  });

  return (
    <Card className="w-full max-w-md border-border shadow-none">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Utilise l’email et le mot de passe de ton compte Katante.
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
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
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
            <Label htmlFor="login-password">Mot de passe</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!form.formState.errors.password}
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Connexion…" : "Se connecter"}
          </Button>
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            Pas de compte ?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
