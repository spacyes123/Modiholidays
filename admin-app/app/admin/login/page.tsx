import { configured } from "@/lib/supabase";
import { login } from "@/lib/actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="login-page">
      <section className="login-card">
        <img
          className="login-logo"
          src="/assets/brand/logo-256.png"
          alt="Modi Holidays"
          width="150"
          height="150"
        />
        <p className="eyebrow">Private travel operations</p>
        <h1>A thoughtful journey starts here.</h1>
        <p>Authorised Modi Holidays employees only.</p>
        {!configured() ? (
          <div className="notice">
            <strong>Secure setup required</strong>
            <p>
              Authentication is not configured. No dashboard or customer records
              are available. Follow the admin setup guide to connect Supabase
              and provision an employee account.
            </p>
          </div>
        ) : (
          <form action={login}>
            <label>
              Work email
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {query.error && (
              <p role="alert" className="error">
                Sign-in failed or employee access is not enabled. Contact the
                administrator.
              </p>
            )}
            <button type="submit">Sign in securely</button>
          </form>
        )}
        <a href="/index.html">← Public website</a>
        <p className="small">
          No public registration. Contact the business administrator for access.
        </p>
      </section>
    </main>
  );
}
