import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTA({ onAuthClick }) {
  return (
    <section className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl2 sm:rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-900 px-6 py-12 sm:px-12 sm:py-16 text-center"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-flag-gold/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-14 -left-10 w-56 h-56 bg-flag-violet/20 rounded-full blur-3xl" />

        <h2 className="relative font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight max-w-lg mx-auto">
          Ready to bridge the gap between talent and opportunity?
        </h2>
        <p className="relative text-blue-100 mt-3 max-w-md mx-auto text-sm sm:text-base">
          We're just getting started in Nepal — be one of the first to join, whether you're here to earn or here to hire.
        </p>

        <div className="relative mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="#"
            onClick={(event) => { event.preventDefault(); onAuthClick('signup', 'client'); }}
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3.5 rounded-full shadow-soft"
          >
            Post a project <ArrowRight size={18} />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="#"
            onClick={(event) => { event.preventDefault(); onAuthClick('signup', 'talent'); }}
            className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-6 py-3.5 rounded-full border border-white/25"
          >
            Join as talent
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
