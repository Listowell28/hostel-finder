import { motion } from 'framer-motion';

const AnimatedCard = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay }}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className={className}
  >
    {children}
  </motion.div>
);

export default AnimatedCard;