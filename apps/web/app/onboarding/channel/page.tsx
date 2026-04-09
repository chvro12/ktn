import { ChannelOnboardingGate } from "@/components/channel/channel-onboarding-gate";
import { AppShell } from "@/components/layout/app-shell";

export default function ChannelOnboardingPage() {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center py-12">
        <ChannelOnboardingGate />
      </div>
    </AppShell>
  );
}
