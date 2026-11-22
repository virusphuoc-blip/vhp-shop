import { APP_NAME, COPYRIGHT, VERSION } from '../version'

export function PlatformFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
      <p>{COPYRIGHT}</p>
      <p className="mt-1">
        {APP_NAME} v{VERSION}
      </p>
    </footer>
  )
}
