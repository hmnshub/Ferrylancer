import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Star, Briefcase } from 'lucide-react';

export default function Hero({ onAuthClick }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-70" />
      <div className="absolute top-40 -left-20 w-64 h-64 bg-mist rounded-full blur-3xl opacity-70" />
      <img
        src="/images/himal-skyline.svg"
        alt=""
        className="absolute top-0 left-0 w-full h-20 sm:h-28 md:h-40 object-cover opacity-80 pointer-events-none"
      />

      <div className="relative max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-14 sm:pt-28 md:pt-32 md:pb-24 grid lg:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center lg:text-left"
        >
          <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            Nepal's freelance marketplace, for everyone
          </span>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.12] tracking-tight text-ink">
            Skilled at something?
            <span className="text-blue-500"> Get paid for it.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted max-w-lg mx-auto lg:mx-0">
            Ferrylance connects anyone who can freelance — students, professionals, career-changers — with clients who need real work done. Verified profiles, smart matching, secure escrow payments.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="#for-business"
              onClick={(event) => { event.preventDefault(); onAuthClick('signup', 'client'); }}
              className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-full shadow-soft"
            >
              Post a project <ArrowRight size={18} />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="#for-talent"
              onClick={(event) => { event.preventDefault(); onAuthClick('signup', 'talent'); }}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3.5 rounded-full border border-blue-100"
            >
              Start freelancing
            </motion.a>
          </div>
        </motion.div>

        {/* Mockups: stacked + static on mobile, floating/absolute from sm up */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
          className="mt-4 lg:mt-0 flex flex-col items-center gap-4 sm:relative sm:h-[400px] sm:block sm:gap-0"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full max-w-[260px] bg-white rounded-xl2 shadow-soft border border-blue-50 p-4
                       sm:absolute sm:top-0 sm:left-0 sm:w-64 sm:max-w-none sm:z-10"
          >
            <p className="text-[11px] font-semibold text-muted mb-3">Your profile</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-blue-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-2.5 w-24 bg-cloud rounded-full mb-1.5" />
                <div className="h-2 w-16 bg-cloud rounded-full" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {['Design', 'Figma', 'Branding'].map((s) => (
                <span key={s} className="text-[10px] font-medium px-2 py-1 rounded-md bg-blue-50 text-blue-700">{s}</span>
              ))}
            </div>
            <div className="w-full bg-blue-500 text-white text-xs font-semibold text-center py-2 rounded-lg">
              Available for work
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="w-full max-w-[240px] bg-white rounded-xl2 shadow-soft border border-blue-50 p-4
                       sm:absolute sm:bottom-4 sm:right-0 sm:w-60 sm:max-w-none"
          >
            <p className="text-[11px] font-semibold text-muted mb-2 flex items-center gap-1.5">
              <Briefcase size={12} /> New project posted
            </p>
            <p className="text-sm font-semibold text-ink mb-1">Instagram reel editing</p>
            <p className="text-xs text-muted mb-3">Budget: Rs 8,000 &middot; 5 days</p>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
              <Star size={12} fill="currentColor" /> 4 candidates matched
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="hidden sm:flex sm:absolute sm:top-1/2 sm:-translate-y-1/2 sm:right-4 items-center gap-2 bg-white shadow-soft border border-blue-50 rounded-2xl px-4 py-3"
          >
            <CheckCircle2 className="text-flag-leaf" size={20} />
            <div>
              <p className="text-xs font-semibold text-ink">Payment secured</p>
              <p className="text-[11px] text-muted">Held in escrow</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
