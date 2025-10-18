import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Calendar, ChevronLeft, ChevronRight, Minus, Plus, Star, Menu, X, MapPin, Tag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCartStore, useCartSummary, useCartActions } from '@/stores/useCartStore';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { z } from 'zod';

// Country codes for phone numbers
const countryCodes = [
  { value: '+961', label: '🇱🇧 Lebanon (+961)', country: 'Lebanon' },
  { value: '+1', label: '🇺🇸 USA (+1)', country: 'USA' },
  { value: '+44', label: '🇬🇧 UK (+44)', country: 'UK' },
  { value: '+971', label: '🇦🇪 UAE (+971)', country: 'UAE' },
  { value: '+966', label: '🇸🇦 Saudi Arabia (+966)', country: 'Saudi Arabia' },
  { value: '+20', label: '🇪🇬 Egypt (+20)', country: 'Egypt' },
  { value: '+962', label: '🇯🇴 Jordan (+962)', country: 'Jordan' },
  { value: '+33', label: '🇫🇷 France (+33)', country: 'France' },
  { value: '+49', label: '🇩🇪 Germany (+49)', country: 'Germany' },
  { value: '+90', label: '🇹🇷 Turkey (+90)', country: 'Turkey' },
  { value: '+91', label: '🇮🇳 India (+91)', country: 'India' },
  { value: '+86', label: '🇨🇳 China (+86)', country: 'China' },
  { value: '+81', label: '🇯🇵 Japan (+81)', country: 'Japan' },
  { value: '+82', label: '🇰🇷 South Korea (+82)', country: 'South Korea' },
  { value: '+61', label: '🇦🇺 Australia (+61)', country: 'Australia' },
  { value: '+64', label: '🇳🇿 New Zealand (+64)', country: 'New Zealand' },
  { value: '+55', label: '🇧🇷 Brazil (+55)', country: 'Brazil' },
  { value: '+52', label: '🇲🇽 Mexico (+52)', country: 'Mexico' },
  { value: '+39', label: '🇮🇹 Italy (+39)', country: 'Italy' },
  { value: '+34', label: '🇪🇸 Spain (+34)', country: 'Spain' },
];

// Lebanese regions and cities
const lebanonRegions = [
  { value: 'beirut', label: 'Beirut' },
  { value: 'mount-lebanon', label: 'Mount Lebanon' },
  { value: 'north-lebanon', label: 'North Lebanon' },
  { value: 'south-lebanon', label: 'South Lebanon' },
  { value: 'bekaa', label: 'Bekaa Valley' },
  { value: 'nabatieh', label: 'Nabatieh' }
];

// Helper function to format phone number with country code
const formatPhoneNumber = (countryCode: string, phoneNumber: string): string => {
  // Remove all non-numeric characters from phone number
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If phone starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Combine country code + cleaned number
  return countryCode + cleaned;
};

// Form validation schema
const checkoutSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required'),
  countryCode: z.string().min(1, 'Please select country code'),
  mobile: z.string().min(6, 'Please enter a valid mobile number').regex(/^[0-9]+$/, 'Only numbers are allowed'),
  email: z.string().email('Please enter a valid email address'),
  addressLine1: z.string().min(5, 'Street address is required (minimum 5 characters)'),
  addressLine2: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  region: z.string().min(1, 'Please select your delivery region'),
  postalCode: z.string().optional(),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(['cash_on_delivery'])
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem } = useCartStore();
  const cartSummary = useCartSummary();
  const { clearCart } = useCartActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    countryCode: '+961', // Default to Lebanon
    mobile: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    building: '',
    floor: '',
    city: '',
    region: '',
    postalCode: '',
    note: '',
    paymentMethod: 'cash_on_delivery'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeApplied, setPromoCodeApplied] = useState<{
    code: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
  } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/store');
      toast.error('Your cart is empty');
    }
  }, [items.length, navigate]);

  // Handle form input changes
  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    try {
      checkoutSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof CheckoutFormData] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Apply promo code
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsValidatingPromo(true);
    setPromoError('');

    try {
      const cartItems = items.map((item, index) => ({
        sku: item.productId, // Using productId as SKU
        quantity: item.quantity,
        price: item.price,
      }));

      const result = await apiClient.validatePromoCode(
        promoCode.toUpperCase(),
        cartSummary.subtotal,
        cartItems
      );

      setPromoCodeApplied(result);
      toast.success(`Promo code applied! You saved $${result.discount_amount.toFixed(2)}`);
    } catch (error: any) {
      setPromoError(error.message || 'Invalid promo code');
      setPromoCodeApplied(null);
      toast.error(error.message || 'Invalid promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Remove promo code
  const handleRemovePromoCode = () => {
    setPromoCode('');
    setPromoCodeApplied(null);
    setPromoError('');
    toast.info('Promo code removed');
  };

  // Calculate final total with promo code discount
  const finalTotal = promoCodeApplied
    ? cartSummary.total - promoCodeApplied.discount_amount
    : cartSummary.total;

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Convert region to proper label
      const regionLabel = lebanonRegions.find(r => r.value === formData.region)?.label || 'Lebanon';

      // Format phone number for API (combine country code + number)
      const formattedPhone = formatPhoneNumber(formData.countryCode, formData.mobile);

      // Construct full name for guest_name
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const orderData: any = {
        payment_method: formData.paymentMethod,
        guest_email: formData.email,
        guest_name: fullName,
        guest_phone: formattedPhone,
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_line_1: formData.addressLine1,
          address_line_2: formData.addressLine2 || '',
          building: formData.building || '',
          floor: formData.floor || '',
          city: formData.city,
          state: regionLabel,
          postal_code: formData.postalCode || '00000',
          country: 'Lebanon',
          phone: formattedPhone,
        },
        currency: 'USD',
      };

      // Only add optional fields if they have values
      if (formData.note && formData.note.trim()) {
        orderData.notes = formData.note.trim();
      }

      // Only add promo_code if one is applied
      if (promoCodeApplied?.code) {
        orderData.promo_code = promoCodeApplied.code;
      }

      console.log('Submitting order with data:', JSON.stringify(orderData, null, 2));

      const response = await apiClient.post('/orders', orderData);

      if (response && response.order_number) {
        clearCart();
        toast.success(`Order placed successfully! Order #${response.order_number}`, {
          description: 'You will receive a confirmation call shortly.',
          duration: 8000,
        });
        navigate('/', {
          state: {
            orderConfirmation: {
              orderNumber: response.order_number,
              total: response.total_amount,
            }
          }
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Show specific error message if available
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to place order';
        toast.error(errorMessage, {
          description: error.response.data?.details ? JSON.stringify(error.response.data.details) : 'Please check your information and try again.'
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  if (items.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Simple Header with only X button */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/store')}
              className="hover:bg-red-50 hover:text-red-600 rounded-full h-10 w-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Delivery Information */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-blue-900">Delivery Information</h2>
            </div>

            <div className="space-y-6">
              {/* Name - Split into First and Last */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-blue-700">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={cn("mt-1", errors.firstName && "border-red-300")}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-blue-700">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={cn("mt-1", errors.lastName && "border-red-300")}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              {/* Mobile Number - Split into Country Code and Number */}
              <div>
                <Label className="text-sm font-medium text-blue-700">Mobile Number *</Label>
                <div className="grid grid-cols-12 gap-2 mt-1">
                  {/* Country Code Dropdown */}
                  <div className="col-span-5">
                    <Select
                      value={formData.countryCode}
                      onValueChange={(value) => handleInputChange('countryCode', value)}
                    >
                      <SelectTrigger className={cn(errors.countryCode && "border-red-300")}>
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Phone Number Input */}
                  <div className="col-span-7">
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      className={cn(errors.mobile && "border-red-300")}
                      placeholder="76666341"
                    />
                  </div>
                </div>
                {errors.countryCode && <p className="mt-1 text-sm text-red-600">{errors.countryCode}</p>}
                {errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>}
                {!errors.mobile && !errors.countryCode && (
                  <p className="mt-1 text-xs text-blue-600">Enter your phone number without country code</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-blue-700">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={cn("mt-1", errors.email && "border-red-300")}
                  placeholder="your.email@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Address Line 1 */}
              <div>
                <Label htmlFor="addressLine1" className="text-sm font-medium text-blue-700">Street Address *</Label>
                <Input
                  id="addressLine1"
                  value={formData.addressLine1}
                  onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  className={cn("mt-1", errors.addressLine1 && "border-red-300")}
                  placeholder="Street name and number"
                />
                {errors.addressLine1 && <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>}
              </div>

              {/* Address Line 2 */}
              <div>
                <Label htmlFor="addressLine2" className="text-sm font-medium text-blue-700">Address Line 2 (Optional)</Label>
                <Input
                  id="addressLine2"
                  value={formData.addressLine2}
                  onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                  className="mt-1"
                  placeholder="Apartment, suite, unit, etc."
                />
              </div>

              {/* Building and Floor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="building" className="text-sm font-medium text-blue-700">Building (Optional)</Label>
                  <Input
                    id="building"
                    value={formData.building}
                    onChange={(e) => handleInputChange('building', e.target.value)}
                    className="mt-1"
                    placeholder="Building name/number"
                  />
                </div>
                <div>
                  <Label htmlFor="floor" className="text-sm font-medium text-blue-700">Floor (Optional)</Label>
                  <Input
                    id="floor"
                    value={formData.floor}
                    onChange={(e) => handleInputChange('floor', e.target.value)}
                    className="mt-1"
                    placeholder="Floor number"
                  />
                </div>
              </div>

              {/* City and Region */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium text-blue-700">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={cn("mt-1", errors.city && "border-red-300")}
                    placeholder="Enter city name"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
                <div>
                  <Label htmlFor="region" className="text-sm font-medium text-blue-700">Region *</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => handleInputChange('region', value)}
                  >
                    <SelectTrigger className={cn("mt-1", errors.region && "border-red-300")}>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {lebanonRegions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
                </div>
              </div>

              {/* Postal Code */}
              <div>
                <Label htmlFor="postalCode" className="text-sm font-medium text-blue-700">Postal Code (Optional)</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="mt-1"
                  placeholder="Enter postal code"
                />
              </div>

              {/* Note */}
              <div>
                <Label htmlFor="note" className="text-sm font-medium text-blue-700">Additional Notes (Optional)</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => handleInputChange('note', e.target.value)}
                  className="mt-1"
                  placeholder="Any special instructions for delivery or notes about your order"
                  rows={3}
                />
                {errors.note && <p className="mt-1 text-sm text-red-600">{errors.note}</p>}
              </div>

              {/* Payment Method */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800 mb-2">Payment Method</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <Label className="text-sm font-medium text-green-800">Cash on Delivery Only</Label>
                </div>
                <p className="text-xs text-green-700 mt-2">Pay when your order is delivered to your doorstep</p>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingBag className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-green-900">Order Summary</h2>
            </div>

            <div className="space-y-4">
              {/* Products */}
              {items.map((item, index) => (
                <div key={item.id || `item-${index}`} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border-2 border-green-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-xs font-medium text-green-600">IMG</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500">ID: {item.productId}</p>
                    <p className="text-sm font-semibold text-green-600">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-black bg-gray-100 px-3 py-1 rounded-full">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>
              ))}

              {/* Promo Code */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium text-gray-700">Have a promo code?</Label>
                </div>
                {!promoCodeApplied ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError('');
                      }}
                      className={cn("flex-1", promoError && "border-red-300")}
                      disabled={isValidatingPromo}
                    />
                    <Button
                      onClick={handleApplyPromoCode}
                      disabled={isValidatingPromo || !promoCode.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isValidatingPromo ? 'Validating...' : 'Apply'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">{promoCodeApplied.code}</p>
                        <p className="text-xs text-blue-700">
                          {promoCodeApplied.discount_type === 'percentage'
                            ? `${promoCodeApplied.discount_value}% off`
                            : `$${promoCodeApplied.discount_value.toFixed(2)} off`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePromoCode}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-600">{promoError}</p>}
              </div>

              {/* Totals */}
              <div className="pt-6 space-y-3 bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-semibold text-green-700">${cartSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="font-medium">Tax</span>
                  <span className="font-semibold text-green-700">
                    ${cartSummary.tax ? cartSummary.tax.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="font-medium">Shipping</span>
                  <span className="font-semibold text-green-700">Free</span>
                </div>
                {promoCodeApplied && (
                  <div className="flex justify-between text-sm text-blue-700 bg-blue-100 -mx-4 px-4 py-2">
                    <span className="font-medium">Promo Discount ({promoCodeApplied.code})</span>
                    <span className="font-semibold">-${promoCodeApplied.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-green-300 pt-3">
                  <div className="flex justify-between text-lg font-bold text-green-800">
                    <span>Total (USD)</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                  {promoCodeApplied && (
                    <p className="text-xs text-green-700 mt-1">
                      You saved ${promoCodeApplied.discount_amount.toFixed(2)}!
                    </p>
                  )}
                </div>
              </div>

              {/* Confirm Order Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 mt-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? 'Processing Order...' : 'Place Order (Cash on Delivery)'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}