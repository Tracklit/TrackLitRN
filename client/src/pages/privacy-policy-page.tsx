import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>

        <div className="mt-8 space-y-6 text-base leading-7">
          <p>
            This Privacy Policy describes how TrackLit collects, uses, and shares information when you use the
            TrackLit app and related services.
          </p>

          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information (e.g., email, name, username).</li>
            <li>Authentication data (e.g., OAuth provider identifiers, login sessions).</li>
            <li>Content you provide (e.g., training logs, uploads, messages) as part of using the service.</li>
            <li>Technical information (e.g., device/browser info, IP address, and basic analytics/logging).</li>
          </ul>

          <h2 className="text-xl font-semibold">How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide, maintain, and improve the service.</li>
            <li>To authenticate you and secure accounts.</li>
            <li>To communicate about updates, security, and support.</li>
            <li>To comply with legal obligations and enforce our terms.</li>
          </ul>

          <h2 className="text-xl font-semibold">Sharing</h2>
          <p>
            We may share information with service providers that help us operate the app (e.g., hosting, storage,
            analytics) and when required by law. We do not sell your personal information.
          </p>

          <h2 className="text-xl font-semibold">Your Choices</h2>
          <p>
            You can request account deletion or data export by contacting support using the email listed on the
            app’s sign-in screen or store listing.
          </p>

          <h2 className="text-xl font-semibold">Contact</h2>
          <p>
            For privacy questions, contact us via the support email listed in the app or on our website.
          </p>
        </div>
      </div>
    </div>
  );
}

