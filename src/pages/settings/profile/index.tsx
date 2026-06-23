import { BadgeCheck, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/services/hooks/use-user";
import { getAdminLabel } from "@/utils/data/admin";
import ChangePasswordDialog from "@/containers/admins/change-password";

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <div className="rounded-md border border-border/70 bg-background/40 px-4 py-3">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 min-h-6 break-words text-base font-medium text-foreground">
      {value || "-"}
    </p>
  </div>
);

export default function SettingsProfile() {
  const { userData, userLevel } = useUser();
  const memberType =
    typeof userLevel === "string" ? getAdminLabel(userLevel as any) : "-";
  const designation =
    (userData as any)?.designation || (userData as any)?.role || "-";
  const isActive = userData?.isActive !== false;

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="overflow-hidden">
          <div className="h-20 bg-primary/20" />
          <CardContent className="-mt-10 flex flex-col items-center px-6 pb-6 text-center">
            <div className="flex size-20 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-sm">
              <UserRound className="size-9" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">
              {userData?.name || "Profile"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              @{userData?.username || "username"}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
              <ShieldCheck className="size-4 text-primary" />
              {memberType}
            </div>
            <div className="mt-5 flex w-full justify-center">
              <ChangePasswordDialog id={userData?.id} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Profile Details</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your account information and access details.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300">
                <BadgeCheck className="size-4" />
                {isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="Full Name" value={userData?.name} />
              <DetailItem label="Username" value={userData?.username} />
              <DetailItem label="Designation" value={designation} />
              <DetailItem label="Member Type" value={memberType} />
              <DetailItem label="Email" value={userData?.email} />
            </div>

            <div className="grid gap-3 rounded-md border bg-muted/20 p-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Mail className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {userData?.email || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Phone className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Mobile</p>
                  <p className="text-sm text-muted-foreground">
                    {userData?.phone || "-"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
