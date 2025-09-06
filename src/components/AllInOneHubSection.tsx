import { Truck, MessageCircle, BookOpen, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const AllInOneHubSection = () => {
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
            More Than Just Parts
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-blue-600 font-semibold uppercase tracking-wide">
            Your all-in-one electronics hub.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 h-full">
              <CardContent className="space-y-4">
                <motion.div 
                  className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Users className="h-8 w-8 text-purple-600" />
                </motion.div>
                <h4 className="text-lg font-bold text-gray-900">Workshops & Events</h4>
                <p className="text-sm text-gray-600">Learn hands-on and level up your skills.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 h-full">
              <CardContent className="space-y-4">
                <motion.div 
                  className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </motion.div>
                <h4 className="text-lg font-bold text-gray-900">Knowledge Hub</h4>
                <p className="text-sm text-gray-600">Exclusive access to our library of tutorials and beginner projects.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 h-full">
              <CardContent className="space-y-4">
                <motion.div 
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Truck className="h-8 w-8 text-green-600" />
                </motion.div>
                <h4 className="text-lg font-bold text-gray-900">Fast Local Delivery</h4>
                <p className="text-sm text-gray-600">Get what you need without delays.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 h-full">
              <CardContent className="space-y-4">
                <motion.div 
                  className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <MessageCircle className="h-8 w-8 text-orange-600" />
                </motion.div>
                <h4 className="text-lg font-bold text-gray-900">Community Access</h4>
                <p className="text-sm text-gray-600">Join our community of makers and innovators.</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AllInOneHubSection;