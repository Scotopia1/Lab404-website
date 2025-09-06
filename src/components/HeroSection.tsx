import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const HeroSection = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const scaleOnHover = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 300, damping: 20 }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-gradient-to-r from-red-500 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-red-600/20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          <motion.div variants={fadeInUp} className="space-y-4">
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #fecaca 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Looking For{' '}
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
                transition={{ duration: 0.5 }}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Electronics
              </motion.span>
              <br className="hidden sm:block" />
              or{' '}
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.05, rotate: [1, -1, 1, 0] }}
                transition={{ duration: 0.5 }}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Tech Parts
              </motion.span>{' '}
              In Lebanon?
            </motion.h1>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-6">
            <motion.h2 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-100"
              whileHover={{ scale: 1.02 }}
            >
              Not sure what to choose?
            </motion.h2>
            
            <motion.h3 
              className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white"
              whileHover={{ scale: 1.02 }}
            >
              We got you covered!
            </motion.h3>
            
            <motion.p 
              className="text-lg sm:text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed px-4"
              variants={fadeInUp}
            >
              <motion.span 
                className="font-bold text-white"
                whileHover={{ color: '#fecaca' }}
              >
                Stop
              </motion.span>{' '}
              wasting time to guess what you need, let our experts{' '}
              <motion.span 
                className="font-bold"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
                whileHover={{ scale: 1.05 }}
              >
                GUIDE
              </motion.span>{' '}
              you instead.
            </motion.p>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-6 justify-center mt-12 px-4"
          >
            <Link to="/store">
              <motion.div
                {...scaleOnHover}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(239, 68, 68, 0.4)"
                }}
              >
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg px-8 py-4 h-14 shadow-2xl border-0 relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <span className="relative z-10 flex items-center">
                    I Want This!
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-6 w-6" />
                    </motion.div>
                  </span>
                </Button>
              </motion.div>
            </Link>
            
            <motion.div
              {...scaleOnHover}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)"
              }}
            >
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 text-lg px-8 py-4 h-14 backdrop-blur-sm bg-white/5 shadow-2xl relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <span className="relative z-10">Browse Products</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;