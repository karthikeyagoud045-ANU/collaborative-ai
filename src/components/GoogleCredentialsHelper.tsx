"use client";

export default function GoogleCredentialsHelper() {
  return (
    <div style={{
      padding: "var(--sp-lg)",
      background: "var(--canvas)",
      border: "1px solid var(--hairline)",
      borderRadius: "var(--r-md)",
    }}>
      <h3 style={{ margin: 0, marginBottom: "var(--sp-sm)", fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>
        🔑 Google OAuth Setup
      </h3>
      <p style={{ fontSize: "12px", color: "var(--body)", marginBottom: "var(--sp-md)" }}>
        Follow these steps to enable Google Sign-In:
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
        <Step
          number={1}
          title="Create Google OAuth Credentials"
          link="https://console.cloud.google.com/apis/credentials"
          linkText="Open Google Cloud Console"
          desc="Create an OAuth 2.0 Client ID. Add authorized redirect URIs: https://YOUR-PROJECT.supabase.co/auth/v1/callback"
        />
        <Step
          number={2}
          title="Enable Google Provider in Supabase"
          link="https://supabase.com/dashboard/project/_/auth/providers"
          linkText="Open Supabase Auth Settings"
          desc="Go to Authentication > Providers > Google. Enable it and add your Google Client ID + Secret."
        />
        <Step
          number={3}
          title="Configure Redirect URLs"
          desc="In Supabase Dashboard > Authentication > URL Configuration, add your site URL (e.g., http://localhost:3000)"
        />
        <Step
          number={4}
          title="Test Sign-In"
          desc="Go to /auth/login and click 'Continue with Google'. You should be redirected to Google's consent screen."
        />
      </div>

      <div style={{
        marginTop: "var(--sp-md)",
        padding: "var(--sp-sm)",
        background: "var(--chip-active-bg)",
        borderRadius: "var(--r-sm)",
        fontSize: "10px",
        color: "var(--muted)",
      }}>
        <strong>Note:</strong> Google Client ID and Secret are stored in Supabase Dashboard, not in .env.local. This keeps credentials secure server-side.
      </div>
    </div>
  );
}

function Step({ number, title, link, linkText, desc }: {
  number: number;
  title: string;
  link?: string;
  linkText?: string;
  desc: string;
}) {
  return (
    <div style={{ display: "flex", gap: "var(--sp-sm)", alignItems: "flex-start" }}>
      <div style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "var(--primary-violet)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
          {title}
        </div>
        <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
          {desc}
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "10px",
              color: "var(--primary-violet)",
              textDecoration: "underline",
              display: "inline-block",
              marginTop: "2px",
            }}
          >
            {linkText} →
          </a>
        )}
      </div>
    </div>
  );
}
