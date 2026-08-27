import { motion } from 'framer-motion';
import { MapPin, Clock, ShieldCheck, Paperclip, Send } from 'lucide-react';

export default function ProfilePreview() {
  return (
    <section className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        className="mb-10 md:mb-14 text-center max-w-xl mx-auto"
      >
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">
          See it before you sign up.
        </h2>
        <p className="text-muted mt-3 text-sm sm:text-base">
          A simple profile for talent, a simple brief for business — no clutter either way.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
        {/* Talent profile mockup */}
        <motion.div
          initial={{ opacity: 0, x: -24, rotate: -2 }}
          whileInView={{ opacity: 1, x: 0, rotate: -2 }}
          viewport={{ once: true, amount: 0.3 }}
          whileHover={{ rotate: 0, y: -6 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl2 shadow-soft border border-blue-50 p-5 sm:p-6 max-w-sm mx-auto"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="font-display font-extrabold text-blue-500">AS</span>
            </div>
            <div>
              <p className="font-semibold text-ink">Anisha Sherpa</p>
              <p className="text-xs text-muted flex items-center gap-1"><MapPin size={12} /> Pokhara</p>
            </div>
            <span className="ml-auto text-flag-leaf"><ShieldCheck size={20} /></span>
          </div>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Graphic designer &amp; illustrator. I help brands look like they mean it.
          </p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {['Illustration', 'Branding', 'Figma'].map((s) => (
              <span key={s} className="text-[11px] font-medium px-2 py-1 rounded-md bg-cloud text-blue-700">{s}</span>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted border-t border-cloud pt-3">
            <span className="flex items-center gap-1"><Clock size={12} /> Responds within a day</span>
            <span className="font-semibold text-ink">Rs 1,200/hr</span>
          </div>
        </motion.div>

        {/* Business project post mockup */}
        <motion.div
          initial={{ opacity: 0, x: 24, rotate: 2 }}
          whileInView={{ opacity: 1, x: 0, rotate: 2 }}
          viewport={{ once: true, amount: 0.3 }}
          whileHover={{ rotate: 0, y: -6 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl2 shadow-soft border border-blue-50 p-5 sm:p-6 max-w-sm mx-auto"
        >
          <p className="text-[11px] font-semibold text-muted mb-2">New project brief</p>
          <p className="font-semibold text-ink mb-1">Need a logo &amp; brand kit</p>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Small cafe in Lalitpur looking for a fresh logo, menu design, and social templates.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">Design</span>
            <span className="text-xs font-semibold bg-cloud text-ink px-2.5 py-1 rounded-full">Rs 15,000 budget</span>
          </div>
          <div className="flex items-center gap-2 border-t border-cloud pt-3">
            <div className="flex-1 flex items-center gap-2 text-xs text-muted bg-cloud rounded-full px-3 py-2">
              <Paperclip size={13} /> Attach brief files
            </div>
            <button className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
              <Send size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
