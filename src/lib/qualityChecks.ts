interface QualityCheck {
  id: string;
  name: string;
  category: 'performance' | 'accessibility' | 'seo' | 'security' | 'functionality';
  status: 'pass' | 'fail' | 'warning' | 'pending';
  score?: number;
  message: string;
  details?: string;
  recommendation?: string;
}

interface QualityReport {
  id: string;
  timestamp: Date;
  overallScore: number;
  checks: QualityCheck[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    total: number;
  };
}

class QualityAssurance {
  private checks: QualityCheck[] = [];
  private isRunning = false;

  async runAllChecks(): Promise<QualityReport> {
    if (this.isRunning) {
      throw new Error('Quality checks are already running');
    }

    this.isRunning = true;
    this.checks = [];

    try {
      // Run all quality checks
      await Promise.all([
        this.checkPerformance(),
        this.checkAccessibility(),
        this.checkSEO(),
        this.checkSecurity(),
        this.checkFunctionality()
      ]);

      // Calculate overall score
      const passedChecks = this.checks.filter(c => c.status === 'pass').length;
      const totalChecks = this.checks.length;
      const overallScore = Math.round((passedChecks / totalChecks) * 100);

      const report: QualityReport = {
        id: `qa-${Date.now()}`,
        timestamp: new Date(),
        overallScore,
        checks: [...this.checks],
        summary: {
          passed: this.checks.filter(c => c.status === 'pass').length,
          failed: this.checks.filter(c => c.status === 'fail').length,
          warnings: this.checks.filter(c => c.status === 'warning').length,
          total: this.checks.length
        }
      };

      return report;
    } finally {
      this.isRunning = false;
    }
  }

  private async checkPerformance(): Promise<void> {
    // Check Core Web Vitals
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.navigationStart;
      this.checks.push({
        id: 'perf-load-time',
        name: 'Page Load Time',
        category: 'performance',
        status: loadTime < 3000 ? 'pass' : loadTime < 5000 ? 'warning' : 'fail',
        score: Math.max(0, 100 - (loadTime / 50)),
        message: `Page loads in ${loadTime.toFixed(0)}ms`,
        details: `Target: <3s, Current: ${(loadTime / 1000).toFixed(2)}s`,
        recommendation: loadTime > 3000 ? 'Optimize images, reduce bundle size, enable caching' : undefined
      });

      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
      this.checks.push({
        id: 'perf-dom-ready',
        name: 'DOM Content Loaded',
        category: 'performance',
        status: domContentLoaded < 2000 ? 'pass' : domContentLoaded < 3000 ? 'warning' : 'fail',
        score: Math.max(0, 100 - (domContentLoaded / 30)),
        message: `DOM ready in ${domContentLoaded.toFixed(0)}ms`,
        details: `Target: <2s, Current: ${(domContentLoaded / 1000).toFixed(2)}s`,
        recommendation: domContentLoaded > 2000 ? 'Reduce JavaScript bundle size, optimize critical CSS' : undefined
      });
    }

    // Check bundle size
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsSize = resources
      .filter(r => r.name.includes('.js'))
      .reduce((acc, r) => acc + (r.transferSize || 0), 0);

    this.checks.push({
      id: 'perf-bundle-size',
      name: 'JavaScript Bundle Size',
      category: 'performance',
      status: jsSize < 500000 ? 'pass' : jsSize < 1000000 ? 'warning' : 'fail',
      score: Math.max(0, 100 - (jsSize / 10000)),
      message: `Bundle size: ${(jsSize / 1024).toFixed(0)}KB`,
      details: `Target: <500KB, Current: ${(jsSize / 1024).toFixed(0)}KB`,
      recommendation: jsSize > 500000 ? 'Enable code splitting, remove unused dependencies' : undefined
    });

    // Check image optimization
    const images = resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i));
    const largeImages = images.filter(img => (img.transferSize || 0) > 100000);
    
    this.checks.push({
      id: 'perf-image-optimization',
      name: 'Image Optimization',
      category: 'performance',
      status: largeImages.length === 0 ? 'pass' : largeImages.length < 3 ? 'warning' : 'fail',
      score: Math.max(0, 100 - (largeImages.length * 20)),
      message: `${largeImages.length} large images (>100KB) found`,
      details: `Total images: ${images.length}, Large: ${largeImages.length}`,
      recommendation: largeImages.length > 0 ? 'Compress images, use WebP format, implement lazy loading' : undefined
    });
  }

  private async checkAccessibility(): Promise<void> {
    // Check for alt text on images
    const images = document.querySelectorAll('img');
    const missingAlt = Array.from(images).filter(img => !img.alt || img.alt.trim() === '');
    
    this.checks.push({
      id: 'a11y-alt-text',
      name: 'Image Alt Text',
      category: 'accessibility',
      status: missingAlt.length === 0 ? 'pass' : missingAlt.length < 3 ? 'warning' : 'fail',
      score: Math.max(0, 100 - (missingAlt.length * 10)),
      message: `${missingAlt.length} images missing alt text`,
      details: `Total images: ${images.length}, Missing alt: ${missingAlt.length}`,
      recommendation: missingAlt.length > 0 ? 'Add descriptive alt text to all images' : undefined
    });

    // Check for headings hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const h1Count = document.querySelectorAll('h1').length;
    
    this.checks.push({
      id: 'a11y-heading-structure',
      name: 'Heading Structure',
      category: 'accessibility',
      status: h1Count === 1 ? 'pass' : h1Count === 0 ? 'fail' : 'warning',
      score: h1Count === 1 ? 100 : h1Count === 0 ? 0 : 70,
      message: `${h1Count} H1 headings found`,
      details: `Total headings: ${headings.length}, H1 count: ${h1Count}`,
      recommendation: h1Count !== 1 ? 'Use exactly one H1 per page for proper heading hierarchy' : undefined
    });

    // Check for form labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
    const unlabeledInputs = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      
      return !label && !ariaLabel && !ariaLabelledBy;
    });

    this.checks.push({
      id: 'a11y-form-labels',
      name: 'Form Labels',
      category: 'accessibility',
      status: unlabeledInputs.length === 0 ? 'pass' : unlabeledInputs.length < 3 ? 'warning' : 'fail',
      score: Math.max(0, 100 - (unlabeledInputs.length * 15)),
      message: `${unlabeledInputs.length} form inputs missing labels`,
      details: `Total inputs: ${inputs.length}, Unlabeled: ${unlabeledInputs.length}`,
      recommendation: unlabeledInputs.length > 0 ? 'Add proper labels or aria-label attributes to all form inputs' : undefined
    });

    // Check color contrast (basic check)
    const buttons = document.querySelectorAll('button');
    let lowContrastButtons = 0;
    
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      
      // Simple contrast check (this is a simplified version)
      if (bgColor === textColor || bgColor === 'rgba(0, 0, 0, 0)') {
        lowContrastButtons++;
      }
    });

    this.checks.push({
      id: 'a11y-color-contrast',
      name: 'Color Contrast',
      category: 'accessibility',
      status: lowContrastButtons === 0 ? 'pass' : lowContrastButtons < 3 ? 'warning' : 'fail',
      score: Math.max(0, 100 - (lowContrastButtons * 10)),
      message: `${lowContrastButtons} elements may have contrast issues`,
      details: `Checked ${buttons.length} buttons`,
      recommendation: lowContrastButtons > 0 ? 'Ensure sufficient color contrast (4.5:1 ratio minimum)' : undefined
    });
  }

  private async checkSEO(): Promise<void> {
    // Check meta tags
    const title = document.querySelector('title');
    const metaDescription = document.querySelector('meta[name="description"]');
    const metaViewport = document.querySelector('meta[name="viewport"]');
    
    this.checks.push({
      id: 'seo-title',
      name: 'Page Title',
      category: 'seo',
      status: title && title.textContent && title.textContent.length > 10 ? 'pass' : 'fail',
      score: title && title.textContent ? Math.min(100, title.textContent.length * 2) : 0,
      message: title ? `Title: "${title.textContent}" (${title.textContent?.length} chars)` : 'No title found',
      recommendation: !title || !title.textContent || title.textContent.length < 10 ? 'Add a descriptive page title (30-60 characters)' : undefined
    });

    this.checks.push({
      id: 'seo-meta-description',
      name: 'Meta Description',
      category: 'seo',
      status: metaDescription && metaDescription.getAttribute('content') ? 'pass' : 'warning',
      score: metaDescription ? 100 : 50,
      message: metaDescription ? `Description found (${metaDescription.getAttribute('content')?.length} chars)` : 'No meta description',
      recommendation: !metaDescription ? 'Add a meta description (150-160 characters)' : undefined
    });

    this.checks.push({
      id: 'seo-viewport',
      name: 'Viewport Meta Tag',
      category: 'seo',
      status: metaViewport ? 'pass' : 'fail',
      score: metaViewport ? 100 : 0,
      message: metaViewport ? 'Viewport meta tag found' : 'No viewport meta tag',
      recommendation: !metaViewport ? 'Add viewport meta tag for mobile optimization' : undefined
    });

    // Check for structured data
    const structuredData = document.querySelectorAll('[itemscope], script[type="application/ld+json"]');
    
    this.checks.push({
      id: 'seo-structured-data',
      name: 'Structured Data',
      category: 'seo',
      status: structuredData.length > 0 ? 'pass' : 'warning',
      score: structuredData.length > 0 ? 100 : 70,
      message: `${structuredData.length} structured data elements found`,
      recommendation: structuredData.length === 0 ? 'Add structured data for better search engine understanding' : undefined
    });
  }

  private async checkSecurity(): Promise<void> {
    // Check HTTPS
    const isHTTPS = window.location.protocol === 'https:';
    
    this.checks.push({
      id: 'security-https',
      name: 'HTTPS Connection',
      category: 'security',
      status: isHTTPS ? 'pass' : 'fail',
      score: isHTTPS ? 100 : 0,
      message: isHTTPS ? 'Site served over HTTPS' : 'Site not using HTTPS',
      recommendation: !isHTTPS ? 'Enable HTTPS for secure data transmission' : undefined
    });

    // Check for mixed content
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const httpResources = resources.filter(r => r.name.startsWith('http://'));
    
    this.checks.push({
      id: 'security-mixed-content',
      name: 'Mixed Content',
      category: 'security',
      status: httpResources.length === 0 ? 'pass' : 'warning',
      score: Math.max(0, 100 - (httpResources.length * 10)),
      message: `${httpResources.length} HTTP resources on HTTPS page`,
      recommendation: httpResources.length > 0 ? 'Update all HTTP resources to HTTPS' : undefined
    });

    // Check for external scripts
    const scripts = document.querySelectorAll('script[src]');
    const externalScripts = Array.from(scripts).filter(script => {
      const src = script.getAttribute('src');
      return src && !src.startsWith('/') && !src.includes(window.location.hostname);
    });

    this.checks.push({
      id: 'security-external-scripts',
      name: 'External Scripts',
      category: 'security',
      status: externalScripts.length < 3 ? 'pass' : externalScripts.length < 6 ? 'warning' : 'fail',
      score: Math.max(0, 100 - (externalScripts.length * 5)),
      message: `${externalScripts.length} external scripts loaded`,
      details: `Total scripts: ${scripts.length}, External: ${externalScripts.length}`,
      recommendation: externalScripts.length > 5 ? 'Review and minimize external script dependencies' : undefined
    });

    // Check for inline styles and scripts
    const inlineScripts = document.querySelectorAll('script:not([src])');
    const inlineStyles = document.querySelectorAll('style');
    
    this.checks.push({
      id: 'security-inline-content',
      name: 'Inline Content Security',
      category: 'security',
      status: inlineScripts.length < 2 && inlineStyles.length < 3 ? 'pass' : 'warning',
      score: Math.max(0, 100 - (inlineScripts.length * 5) - (inlineStyles.length * 3)),
      message: `${inlineScripts.length} inline scripts, ${inlineStyles.length} inline styles`,
      recommendation: inlineScripts.length > 2 || inlineStyles.length > 3 ? 'Consider using CSP-compliant external files' : undefined
    });
  }

  private async checkFunctionality(): Promise<void> {
    // Check for JavaScript errors
    const errorCount = (window as any).__errorCount__ || 0;
    
    this.checks.push({
      id: 'func-js-errors',
      name: 'JavaScript Errors',
      category: 'functionality',
      status: errorCount === 0 ? 'pass' : errorCount < 3 ? 'warning' : 'fail',
      score: Math.max(0, 100 - (errorCount * 15)),
      message: `${errorCount} JavaScript errors detected`,
      recommendation: errorCount > 0 ? 'Fix JavaScript errors for proper functionality' : undefined
    });

    // Check navigation functionality
    const navLinks = document.querySelectorAll('a[href], button[onclick]');
    const brokenLinks = Array.from(navLinks).filter(link => {
      const href = link.getAttribute('href');
      const onclick = link.getAttribute('onclick');
      return (!href || href === '#') && !onclick;
    });

    this.checks.push({
      id: 'func-navigation',
      name: 'Navigation Links',
      category: 'functionality',
      status: brokenLinks.length === 0 ? 'pass' : brokenLinks.length < 3 ? 'warning' : 'fail',
      score: Math.max(0, 100 - (brokenLinks.length * 10)),
      message: `${brokenLinks.length} potentially broken navigation links`,
      details: `Total links: ${navLinks.length}, Broken: ${brokenLinks.length}`,
      recommendation: brokenLinks.length > 0 ? 'Ensure all navigation links have proper destinations' : undefined
    });

    // Check form functionality
    const forms = document.querySelectorAll('form');
    const formsWithoutAction = Array.from(forms).filter(form => 
      !form.getAttribute('action') && !form.getAttribute('onsubmit')
    );

    this.checks.push({
      id: 'func-forms',
      name: 'Form Functionality',
      category: 'functionality',
      status: formsWithoutAction.length === 0 ? 'pass' : 'warning',
      score: Math.max(0, 100 - (formsWithoutAction.length * 20)),
      message: `${formsWithoutAction.length} forms without action handlers`,
      details: `Total forms: ${forms.length}`,
      recommendation: formsWithoutAction.length > 0 ? 'Add proper action handlers to all forms' : undefined
    });

    // Check responsive design
    const hasViewportMeta = document.querySelector('meta[name="viewport"]');
    const hasMediaQueries = Array.from(document.styleSheets).some(sheet => {
      try {
        return Array.from(sheet.cssRules || []).some(rule => 
          rule instanceof CSSMediaRule
        );
      } catch {
        return false;
      }
    });

    this.checks.push({
      id: 'func-responsive',
      name: 'Responsive Design',
      category: 'functionality',
      status: hasViewportMeta && hasMediaQueries ? 'pass' : 'warning',
      score: (hasViewportMeta ? 50 : 0) + (hasMediaQueries ? 50 : 0),
      message: `Viewport: ${hasViewportMeta ? 'Yes' : 'No'}, Media queries: ${hasMediaQueries ? 'Yes' : 'No'}`,
      recommendation: !hasViewportMeta || !hasMediaQueries ? 'Implement responsive design with viewport meta and media queries' : undefined
    });
  }
}

// Create singleton instance
export const qualityAssurance = new QualityAssurance();

// React hook for quality checks
export const useQualityChecks = () => {
  const runQualityChecks = async () => {
    return await qualityAssurance.runAllChecks();
  };

  return {
    runQualityChecks
  };
};

export type { QualityCheck, QualityReport };
export default qualityAssurance;