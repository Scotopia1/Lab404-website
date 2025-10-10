import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProblemSolutionSection from '@/components/ProblemSolutionSection';
import WhyChooseSection from '@/components/WhyChooseSection';
import FeaturedProductsSection from '@/components/FeaturedProductsSection';
import AllInOneHubSection from '@/components/AllInOneHubSection';
import ContactFormSection from '@/components/ContactFormSection';
import FooterSection from '@/components/FooterSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <ProblemSolutionSection />
      <WhyChooseSection />
      <FeaturedProductsSection />
      <AllInOneHubSection />
      <ContactFormSection />
      <FooterSection />
    </div>
  );
};

export default Index;