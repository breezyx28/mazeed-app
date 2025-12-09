import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface Icon3DProps {
  icon: LucideIcon;
  isActive?: boolean;
  size?: number;
}

export const Icon3D = ({ icon: Icon, isActive = false, size = 24 }: Icon3DProps) => {
  return (
    <motion.div
      className={`relative ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={isActive ? { y: -2 } : { y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Shadow layer */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          filter: 'blur(4px)',
          transform: 'translateY(2px) translateX(1px)',
        }}
        animate={isActive ? { opacity: 0.4 } : { opacity: 0.2 }}
      >
        <Icon size={size} />
      </motion.div>
      
      {/* Main icon */}
      <motion.div
        className="relative z-10"
        animate={isActive ? { 
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          scale: 1.05 
        } : { 
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          scale: 1 
        }}
        transition={{ duration: 0.2 }}
      >
        <Icon size={size} />
      </motion.div>
      
      {/* Glow effect for active state */}
      {isActive && (
        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1.2 }}
          style={{
            background: 'radial-gradient(circle, currentColor 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />
      )}
    </motion.div>
  );
};