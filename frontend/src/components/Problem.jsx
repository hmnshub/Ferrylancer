import { motion } from 'framer-motion';
import { problems } from '../data/content';

export default function Problem() {
  return (
    <section className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        className="mb-10 md:mb-14 max-w-xl"
      >
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">
          Freelancing in Nepal is harder than it should be.
        </h2>
        <p className="text-muted mt-3 text-sm sm:text-base">
          Talented people and the businesses who need them keep missing each other. Here's what's broken.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
        {problems.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-xl2 p-5 sm:p-6 bg-white border border-cloud shadow-card"
          >
            <span className="block w-9 h-1 rounded-full mb-4" style={{ backgroundColor: p.accent }} />
            <h3 className="font-semibold text-ink mb-2 leading-snug">{p.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
