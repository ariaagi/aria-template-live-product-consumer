"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type ProfilePayload = {
  ok: boolean;
  data?: {
    name?: string;
    email?: string;
    productUpdates?: boolean;
  };
  error?: string;
  detail?: string;
};

export function SettingsProfileForm(): React.ReactElement {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [productUpdates, setProductUpdates] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/settings/profile", {
          credentials: "include",
          signal: controller.signal,
        });
        const data = (await res.json()) as ProfilePayload;
        if (!mounted) {
          return;
        }
        if (!res.ok || !data.ok) {
          throw new Error("load_failed");
        }
        setName(data.data?.name ?? "");
        setEmail(data.data?.email ?? "");
        setProductUpdates(Boolean(data.data?.productUpdates));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (!mounted) {
          return;
        }
        toast.error("Could not load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          const res = await fetch("/api/settings/profile", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, productUpdates }),
          });
          const data = (await res.json()) as ProfilePayload;
          if (!res.ok || !data.ok) {
            toast.error("Could not save profile.");
            return;
          }
          setName(data.data?.name ?? name);
          setEmail(data.data?.email ?? email);
          toast.success("Profile saved.");
        } catch {
          toast.error("Could not save profile.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <div className="relative">
            <Input
              id="display-name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || saving}
              className="pr-32"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute top-1/2 right-1.5 h-7 -translate-y-1/2 gap-1.5 px-2.5"
              disabled={loading || saving || !name.trim()}
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="jane@company.com"
            type="email"
            value={email}
            readOnly
            disabled
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="text-sm font-medium">Product updates</p>
          <p className="text-xs text-muted-foreground">Receive occasional release updates.</p>
        </div>
        <Switch checked={productUpdates} onCheckedChange={setProductUpdates} disabled={loading || saving} />
      </div>
    </form>
  );
}
