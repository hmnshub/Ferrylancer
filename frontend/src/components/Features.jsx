import { motion } from 'framer-motion';
import { features } from '../data/content';

export default function Features() {
  return (
    <section id="features" className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 scroll-mt-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        className="mb-10 md:mb-14 text-center max-w-xl mx-auto"
      >
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">
          Built so trust isn't a gamble.
        </h2>
        <p className="text-muted mt-3 text-sm sm:text-base">
          Every safeguard exists so clients hire confidently and students get paid fairly.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="flex gap-4 bg-white rounded-xl2 p-5 sm:p-6 border border-cloud shadow-card"
          >
            <div
              className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: f.accent }}
            >
              <f.icon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-semibold text-ink mb-1">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
