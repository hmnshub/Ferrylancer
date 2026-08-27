import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const links = [
  { label: 'For talent', href: '#for-talent' },
  { label: 'For business', href: '#for-business' },
  { label: 'Why Ferrylance', href: '#features' },
];

export default function Navbar({ session, onAuthClick }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-50">
      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink">
          <img src="/images/ferrylance-logo.svg" alt="" className="w-8 h-8 rounded-lg shadow-soft" />
          <span className="tracking-tight">
            Ferry<span className="text-blue-500">lance</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm font-medium text-muted hover:text-blue-600 transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {session ? <span className="text-sm font-semibold text-blue-600 px-3 py-2">{session.user.email}</span> : <button onClick={() => onAuthClick('login')} className="text-sm font-semibold text-blue-600 hover:text-blue-700 px-3 py-2">Log in</button>}
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            href="#"
            onClick={(event) => { event.preventDefault(); onAuthClick('signup', 'client'); }}
            className="text-sm font-semibold bg-blue-500 text-white px-4 py-2.5 rounded-full shadow-soft"
          >
            Post a project
          </motion.a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-blue-50 bg-white"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-sm font-medium text-ink border-b border-cloud"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setOpen(false); onAuthClick('login'); }} className="flex-1 text-center text-sm font-semibold text-blue-600 border border-blue-100 rounded-full py-2.5">Log in</button>
                <button onClick={() => { setOpen(false); onAuthClick('signup', 'client'); }} className="flex-1 text-center text-sm font-semibold bg-blue-500 text-white rounded-full py-2.5 shadow-soft">Post a project</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
