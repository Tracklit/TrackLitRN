import React from "react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>

        <div className="mt-8 space-y-6 text-base leading-7">
          <p>
            These Terms of Service govern your use of TrackLit. By using the service, you agree to these terms.
          </p>

          <h2 className="text-xl font-semibold">Accounts</h2>
          <p>
            You’re responsible for safeguarding your account and for activity that occurs under it.
          </p>

          <h2 className="text-xl font-semibold">Acceptable Use</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Don’t misuse the service or attempt to access it in unauthorized ways.</li>
            <li>Don’t upload illegal content or content that violates others’ rights.</li>
            <li>Don’t interfere with or disrupt the service.</li>
          </ul>

          <h2 className="text-xl font-semibold">Content</h2>
          <p>
            You retain ownership of content you submit. You grant TrackLit a license to host and process that
            content solely to provide the service to you.
          </p>

          <h2 className="text-xl font-semibold">Disclaimers</h2>
          <p>
            TrackLit is provided “as is” without warranties. Training information is for informational purposes
            and not medical advice.
          </p>

          <h2 className="text-xl font-semibold">Termination</h2>
          <p>
            We may suspend or terminate accounts for violations of these terms or to protect the service and
            users.
          </p>

          <h2 className="text-xl font-semibold">Contact</h2>
          <p>
            Questions about these terms can be sent to the support email listed in the app or on our website.
          </p>
        </div>
      </div>
    </div>
  );
}

