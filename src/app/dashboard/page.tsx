import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/session";
import Link from "next/link";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/");
  }

  const payload = await verifySessionToken(token);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Calendarium
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{payload.email}</span>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-full border border-black/15 px-4 py-2 text-sm hover:bg-black/5"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          Bienvenido, {payload.email}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Esta es tu área protegida. Aquí podrás gestionar tu calendario.
        </p>
      </main>
    </div>
  );
}
