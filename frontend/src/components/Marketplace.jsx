import { motion } from 'framer-motion';
import { categories } from '../data/content';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.06, ease: 'easeOut' } }),
};

export default function Marketplace() {
  return (
    <section className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">
          Every kind of work, covered.
        </h2>
        <p className="text-muted mt-2 max-w-xl text-sm sm:text-base">
          Whatever you're good at, there's a category for it.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {categories.map((c, i) => (
          <motion.a
            key={c.name}
            href="#for-talent"
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            whileHover={{ y: -6 }}
            className="rounded-xl2 p-4 sm:p-5 text-white shadow-card flex flex-col justify-between min-h-[110px] sm:min-h-[130px]"
            style={{ background: `linear-gradient(145deg, ${c.hex}, ${c.hex}CC)` }}
          >
            <c.icon size={22} strokeWidth={2.2} />
            <p className="font-semibold text-sm sm:text-base leading-snug">{c.name}</p>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
