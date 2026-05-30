"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AUTH_BTN_H =
  "box-border !h-10 !min-h-10 !max-h-10 shrink-0 py-0 leading-none";

const AUTH_BUTTON_WRAP = "mx-auto w-full sm:max-w-xs";

type AuthViewCardProps = {
  pathname: "sign-in" | "sign-up";
  googleStartHref: string | null;
  appName: string;
  logoSrc?: string | null;
};

function GoogleAuthQueryBanner(): React.ReactElement | null {
  const searchParams = useSearchParams();
  const key = searchParams.get("google");
  const text =
    key === "error"
      ? "Google sign-in failed. Try again or use email below."
      : key === "soon"
        ? "Google sign-in is not configured yet. Use email below."
        : key === "ok"
          ? "Google verified, but no session was created."
          : null;
  if (!text) {
    return null;
  }
  return (
    <p className="text-balance text-sm text-amber-700 dark:text-amber-400">{text}</p>
  );
}

function GoogleButtonAndSeparator(props: {
  googleStartHref: string | null;
}): React.ReactElement {
  const { googleStartHref } = props;

  if (!googleStartHref) {
    return (
      <div className="grid w-full gap-4">
        <div className="flex items-center gap-3 py-1">
          <Separator className="flex-1" />
          <span className="shrink-0 text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-4">
      <div className={AUTH_BUTTON_WRAP}>
        <a
          href={googleStartHref}
          className={cn(
            AUTH_BTN_H,
            "inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Image
            src="/logos/googlesearch.png"
            alt=""
            aria-hidden
            width={16}
            height={16}
            className="size-4 shrink-0 rounded-sm"
          />
          Continue with Google
        </a>
      </div>
      <div className="flex items-center gap-3 py-1">
        <Separator className="flex-1" />
        <span className="shrink-0 text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
    </div>
  );
}

export function AuthViewCard({
  pathname,
  googleStartHref,
  appName,
  logoSrc,
}: AuthViewCardProps): React.ReactElement {
  const router = useRouter();
  const isSignIn = pathname === "sign-in";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [formPending, setFormPending] = useState(false);

  return (
    <section className="w-full max-w-md space-y-6 sm:space-y-8">
      <div className="flex items-center justify-center gap-2">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt=""
            aria-hidden
            width={20}
            height={20}
            className="size-5 rounded-sm object-cover"
          />
        ) : null}
        <p className="text-sm font-medium text-foreground">{appName}</p>
      </div>
      <Suspense fallback={null}>
        <GoogleAuthQueryBanner />
      </Suspense>

      <Card className="w-full max-w-md gap-0 overflow-hidden py-0">
        <CardHeader className="grid w-full gap-4 border-b border-border/50 px-4 py-5 text-center sm:px-6 sm:py-6">
          <CardTitle className="text-lg font-heading font-medium leading-snug md:text-xl">
            {isSignIn ? "Sign In" : "Sign Up"}
          </CardTitle>
          <CardDescription className="text-balance text-xs leading-relaxed text-muted-foreground md:text-sm">
            {isSignIn
              ? "Enter your email below to login to your account"
              : "Enter your email below to create your account"}
          </CardDescription>
          <div className="w-full text-left">
            <GoogleButtonAndSeparator googleStartHref={googleStartHref} />
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-6">
          <form
            className="grid w-full items-start gap-4 sm:gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setFormPending(true);
              try {
                if (isSignIn) {
                  const { error } = await authClient.signIn.email({
                    email: email.trim(),
                    password,
                    callbackURL: "/home",
                  });
                  if (error) {
                    toast.error(error.message ?? "Sign in failed.");
                    return;
                  }
                } else {
                  const { error } = await authClient.signUp.email({
                    email: email.trim(),
                    password,
                    name: name.trim() || email.trim().split("@")[0] || "User",
                    callbackURL: "/home",
                  });
                  if (error) {
                    toast.error(error.message ?? "Sign up failed.");
                    return;
                  }
                }
                router.push("/home");
                router.refresh();
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Something went wrong. Try again."
                );
              } finally {
                setFormPending(false);
              }
            }}
          >
            {!isSignIn ? (
              <div className="grid gap-2.5">
                <Label htmlFor="auth-name">Name</Label>
                <Input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                />
              </div>
            ) : null}
            <div className="grid gap-2.5">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>
            <div className={cn(AUTH_BUTTON_WRAP, "mt-0.5")}>
              <Button
                type="submit"
                className={cn(
                  AUTH_BTN_H,
                  "w-full rounded-md gap-2 text-primary-foreground"
                )}
                disabled={formPending}
              >
                {formPending
                  ? isSignIn
                    ? "Signing in…"
                    : "Creating account…"
                  : isSignIn
                    ? "Sign in with email"
                    : "Create account"}
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {isSignIn ? (
              <>
                Need an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  href="/auth/sign-in"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
