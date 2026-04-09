"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  channelOnboardingSchema,
  type ChannelOnboardingValues,
} from "@/lib/schemas/auth";

export function ChannelOnboardingForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ChannelOnboardingValues>({
    resolver: zodResolver(channelOnboardingSchema),
    defaultValues: {
      handle: "",
      name: "",
      description: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ChannelOnboardingValues) => {
      const res = await apiFetch("/v1/channels", {
        method: "POST",
        body: JSON.stringify({
          handle: values.handle.toLowerCase(),
          name: values.name.trim(),
          description: values.description?.trim() ?? "",
        }),
      });
      if (!res.ok) {
        const msg = await readApiErrorMessage(
          res,
          "Impossible de créer la chaîne",
        );
        throw new Error(msg);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["channel", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.push("/");
      router.refresh();
    },
  });

  return (
    <Card className="w-full max-w-md border-border shadow-none">
      <CardHeader>
        <CardTitle>Ta chaîne</CardTitle>
        <CardDescription>
          Handle unique dans l’URL (ex.{" "}
          <span className="font-mono text-xs">/channel/mon-handle</span>), nom
          public affiché aux viewers.
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
            <Label htmlFor="ch-handle">Handle</Label>
            <Input
              id="ch-handle"
              autoComplete="off"
              placeholder="ma-chaine"
              aria-invalid={!!form.formState.errors.handle}
              {...form.register("handle")}
            />
            {form.formState.errors.handle ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.handle.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ch-name">Nom de la chaîne</Label>
            <Input
              id="ch-name"
              autoComplete="organization"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ch-desc">Description (optionnel)</Label>
            <textarea
              id="ch-desc"
              rows={3}
              className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-invalid={!!form.formState.errors.description}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Création…" : "Créer la chaîne"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
