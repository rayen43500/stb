import { Link } from 'react-router-dom'

/** Barre compacte visiteurs — pas de sidebar, ton produit / SaaS léger. */
export function PublicChrome() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F8FAFC] ring-1 ring-[#E2E8F0]">
            <img src="/image.png" alt="STB" className="h-6 w-auto" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-[#0F172A]">STB Crédits</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navigation publique">
          <Link
            to="/simulation"
            className="hidden rounded-[10px] px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] sm:inline"
          >
            Simulation
          </Link>
          <Link
            to="/assistant"
            className="hidden rounded-[10px] px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] md:inline"
          >
            Assistant
          </Link>
          <Link
            to="/login"
            className="rounded-[10px] px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            Connexion
          </Link>
          <Link
            to="/register"
            className="rounded-[10px] bg-[#1D4ED8] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF]"
          >
            Inscription
          </Link>
        </nav>
      </div>
    </header>
  )
}
