import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-slate-200">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center">
        <h1 className="text-5xl font-black mb-4 tracking-tighter bg-linear-to-br from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-xl text-slate-400 font-medium mb-8">
          Room Not Found
        </h2>
        <p className="text-slate-500 mb-8">
          The room you're looking for doesn't exist or the link is invalid.
        </p>
        <Link
          href="/"
          className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          Return to Lobby
        </Link>
      </div>
    </main>
  );
}
