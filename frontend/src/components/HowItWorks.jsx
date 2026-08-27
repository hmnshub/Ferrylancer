import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { talentSteps, businessSteps } from '../data/content';

const tracks = [
  { id: 'for-talent', key: 'talent', label: 'For talent', title: 'Earn from what you\u2019re good at', steps: talentSteps, accent: '#1E4FE0', image: '/images/freelancer-laptop.svg' },
  { id: 'for-business', key: 'business', label: 'For business', title: 'Find talent you can trust', steps: businessSteps, accent: '#E23744', image: '/images/hiring-search.svg' },
];

function Track({ track }) {
  return (
    <div id={track.id} className="scroll-mt-20">
      <div className="rounded-2xl overflow-hidden bg-white border border-cloud shadow-card">
        <div className="p-5 sm:p-6" style={{ backgroundColor: `${track.accent}0D` }}>
          <img src={track.image} alt="" className="w-full max-w-[220px] mx-auto" />
        </div>

        <div className="p-5 sm:p-6">
          <h3 className="font-display font-extrabold text-lg sm:text-xl text-ink mb-4">{track.title}</h3>

          <div className="grid grid-cols-2 gap-3">
            {track.steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-xl p-3 bg-cloud/60"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2" style={{ backgroundColor: track.accent }}>
                  <s.icon size={16} strokeWidth={2.3} />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-ink leading-snug">{s.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const [active, setActive] = useState('talent');
  const activeTrack = tracks.find((t) => t.key === active);

  return (
    <section className="bg-cloud">
      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight mb-6 text-center"
        >
          How Ferrylance works.
        </motion.h2>

        {/* Mobile: switch between tracks. Desktop: show both side by side. */}
        <div className="md:hidden flex justify-center gap-2 mb-6">
          {tracks.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: active === t.key ? t.accent : '#FFFFFF',
                color: active === t.key ? '#FFFFFF' : t.accent,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="md:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <Track track={activeTrack} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden md:grid grid-cols-2 gap-8">
          {tracks.map((t) => <Track key={t.key} track={t} />)}
        </div>
      </div>
    </section>
  );
}
