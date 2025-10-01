import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

interface ContactFormData {
  firstName: string;
  phoneNumber: string;
  email: string;
  message: string;
}

const ContactFormSection = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    phoneNumber: import.meta.env.VITE_COMPANY_PHONE || '+961',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Transform formData to match backend API expectations
      const submissionData = {
        first_name: formData.firstName,
        phone_number: formData.phoneNumber,
        email: formData.email,
        message: formData.message,
      };

      await apiClient.post('/contact-submissions', submissionData, false);

      // Show success state
      setIsSuccess(true);
      toast.success('Thank you for contacting us! We will get back to you soon.');

      // Reset form after success
      setTimeout(() => {
        setFormData({
          firstName: '',
          phoneNumber: import.meta.env.VITE_COMPANY_PHONE || '+961',
          email: '',
          message: ''
        });
        setIsSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Contact form submission error:', error);

      // Show user-friendly error message
      const errorMessage = error?.message || 'Failed to submit contact form. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Build Something Great?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get in touch with our experts and let us help you find the perfect electronics for your project.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="+961XXXXXXXX"
                      className="w-full"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="w-full"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your project or what you're looking for..."
                    className="w-full min-h-32"
                    required
                  />
                </div>
                
                <motion.div
                  whileHover={{ scale: isSubmitting || isSuccess ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting || isSuccess ? 1 : 0.98 }}
                >
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-4 shadow-lg"
                    disabled={isSubmitting || isSuccess}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Message Sent!
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactFormSection;