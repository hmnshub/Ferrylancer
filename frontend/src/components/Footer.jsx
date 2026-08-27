import { Globe, Mail, Share2 } from 'lucide-react';

const columns = [
  { title: 'Platform', links: ['How it works', 'Browse talent', 'Post a project', 'Pricing'] },
  { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] },
  { title: 'Support', links: ['Help center', 'Trust & safety', 'Terms', 'Privacy'] },
];

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-blue-100">
      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <a href="#" className="flex items-center gap-2 font-display font-extrabold text-lg text-white mb-3">
            <img src="/images/ferrylance-logo.svg" alt="" className="w-8 h-8 rounded-lg" />
            Ferrylance
          </a>
          <p className="text-sm text-blue-200 max-w-xs">
            The bridge connecting Nepal's freelancers — students to professionals — with real client work.
          </p>
          <div className="flex gap-3 mt-5">
            {[Globe, Mail, Share2].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-white text-sm font-semibold mb-3">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-blue-200 hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-blue-300 flex flex-col sm:flex-row justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Ferrylance. All rights reserved.</span>
          <span>Made for Nepal's students, by students.</span>
        </div>
      </div>
    </footer>
  );
}
