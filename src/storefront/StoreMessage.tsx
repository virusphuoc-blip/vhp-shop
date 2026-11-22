import { PlatformFooter } from '../components/Footer'

export function StoreMessage({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="text-5xl">{icon}</div>
          <h1 className="mt-3 text-xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{text}</p>
        </div>
      </main>
      <PlatformFooter />
    </div>
  )
}
