import { Zap, Shield, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const ProblemSolutionSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            There are millions of parts you can find, and it's not easy to pick the right ones for your project
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-blue-600 font-semibold uppercase tracking-wide">
            We'll guide you through the process and help you pick the best electronics possible, without breaking the bank!
          </p>
        </motion.div>

        <div className="mb-16 sm:mb-20">
          <motion.h3 
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            So How Can You Get It Done?
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Card className="text-center p-6 sm:p-8 hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="space-y-4">
                  <motion.div 
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
                  </motion.div>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                    Search The Internet For Potential Solution
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600">
                    It's fine if you have very little to do. It will take forever to find what works for you.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Card className="text-center p-6 sm:p-8 hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="space-y-4">
                  <motion.div 
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                  >
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-600" />
                  </motion.div>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                    Pay Someone To Do It For You
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600">
                    Finding the right person that will actually get it done is not easy. Especially if you're tight on time and budget.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="text-center p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 border-2 border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 h-full relative overflow-hidden">
                <CardContent className="space-y-4 relative z-10">
                  <motion.div 
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto"
                    whileHover={{ scale: 1.15, rotate: 10 }}
                  >
                    <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                  </motion.div>
                  <h4 className="text-lg sm:text-xl font-bold text-blue-900">
                    Let LAB404 Help You And Guide You
                  </h4>
                  <p className="text-sm sm:text-base text-blue-700">
                    We're here to help you, give us the idea and we'll give you the right guidance to know what to choose and why to choose.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;