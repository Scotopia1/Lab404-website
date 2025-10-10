import { Link } from 'react-router-dom';
import { ArrowRight, Shield, MessageCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const WhyChooseSection = () => {
  const scaleOnHover = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 300, damping: 20 }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Why Choose LAB404?
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-blue-600 font-semibold uppercase tracking-wide">
            The right parts, the right guidance, right here in Lebanon.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          <motion.div 
            className="text-center space-y-4 sm:space-y-6"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <motion.div 
              className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Need Advice?</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              We'll make sure you get exactly what you need. Unsure what to buy or how to use it? We're here to assist.
            </p>
          </motion.div>

          <motion.div 
            className="text-center space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <motion.div 
              className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto"
              whileHover={{ scale: 1.1, rotate: -5 }}
            >
              <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">High-Quality Products</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Reliable and beginner-friendly components. Tested electronics for every project.
            </p>
          </motion.div>

          <motion.div 
            className="text-center space-y-4 sm:space-y-6"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <motion.div 
              className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-red-600" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Step-by-Step Resources</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Tutorials and guides designed to get you building fast.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="text-center mt-8 sm:mt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Link to="/store">
            <motion.div {...scaleOnHover}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 shadow-lg">
                Start Building
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseSection;