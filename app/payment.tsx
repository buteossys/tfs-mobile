import { API_ENDPOINTS, STRIPE_CONFIG } from '@/app/config';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { CardField, initStripe, useStripe } from '@stripe/stripe-react-native';

export default function PaymentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const stripe = useStripe();
  const [cardComplete, setCardComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  const params = useLocalSearchParams<{ 
    productId: string, 
    variantId: string,
    itemPrice: string,
    shippingCost: string,
    total: string
  }>();
  
  
  // Initialize Stripe when component mounts
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        if (Platform.OS !== 'web') {
          if (!STRIPE_CONFIG.PUBLISHABLE_KEY) {
            throw new Error('Stripe publishable key is missing!');
          }
          await initStripe({
            publishableKey: STRIPE_CONFIG.PUBLISHABLE_KEY,
            merchantIdentifier: 'merchant.com.fairshoppe',
            stripeAccountId: undefined,
          });
          console.log('Stripe initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
      }
    };
    
    initializeStripe();
  }, []);

  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });

  // Create payment intent with backend
  const createPaymentIntent = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || 
        !address.line1 || !address.city || !address.state || !address.postalCode) {
      return null;
    }
    
    try {
      const amount = params.total ? parseFloat(params.total) : 0;
      
      const response = await fetch(API_ENDPOINTS.PAYMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          paymentMethodId: 'pm_card_visa', // This will be replaced with actual payment method ID
          customerInfo: customerInfo,
          billingAddress: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          },
          shippingAddress: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          }
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment intent');
      }
      
      return data.clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return null;
    }
  };

  // Initialize payment sheet for express checkout
  const initializePaymentSheet = async () => {
    if (Platform.OS === 'web') return;
    
    try {
      setLoading(true);
      
      // Create payment intent with backend
      const clientSecret = await createPaymentIntent();
      
      if (!clientSecret) {
        console.error('Failed to get client secret');
        return;
      }
      
      const { error } = await stripe.initPaymentSheet({
        merchantDisplayName: 'Fair Shoppe',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          address: {
            country: 'US',
          },
        },
      });
      
      if (error) {
        console.error('Error initializing payment sheet:', error);
        Alert.alert('Error', 'Unable to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('Error in initializePaymentSheet:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Use useEffect to initialize payment sheet when customer info and address are complete
  useEffect(() => {
    if (Platform.OS !== 'web' && 
        customerInfo.name && customerInfo.email && customerInfo.phone &&
        address.line1 && address.city && address.state && address.postalCode) {
      initializePaymentSheet();
    }
  }, [customerInfo, address, params.total]);

  const handleExpressPayment = async (type: 'apple' | 'google' | 'paypal') => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Express checkout is not supported on web.');
      return;
    }
    
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      Alert.alert('Incomplete Information', 'Please fill in all customer information fields.');
      return;
    }
    
    if (!address.line1 || !address.city || !address.state || !address.postalCode) {
      Alert.alert('Incomplete Address', 'Please fill in all required address fields.');
      return;
    }
    
    try {
      setLoading(true);
      
      // For Apple Pay and Google Pay, use the payment sheet
      if (type === 'apple' || type === 'google') {
        const { error } = await stripe.presentPaymentSheet();
        
        if (error) {
          console.error(`${type} Pay error:`, error);
          Alert.alert('Payment Failed', error.message);
          return;
        }
        
        // Payment successful - we need to get the payment intent ID from the backend
        // In a real implementation, you would get this from the payment sheet result
        // For now, we'll simulate it
        const simulatedPaymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
        setPaymentIntentId(simulatedPaymentIntentId);
        
        // Create order with Printify
        const orderId = await createOrder(simulatedPaymentIntentId);
        
        if (!orderId) {
          throw new Error('Failed to create order');
        }
        
        // Navigate to success screen
        router.push({
          pathname: '/success',
          params: { orderId: orderId }
        });
        return;
      }
      
      // For PayPal, use the createPaymentMethod approach
      if (type === 'paypal') {
        const { paymentMethod, error } = await stripe.createPaymentMethod({
          paymentMethodType: 'PayPal',
          paymentMethodData: {
            billingDetails: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: {
                line1: address.line1,
                line2: address.line2,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
              },
            },
          },
        });

        if (error) {
          console.error('PayPal payment failed:', error);
          Alert.alert('Payment Failed', error.message);
          return;
        }

        // Send payment method ID to backend to create and confirm payment intent
        const amount = params.total ? parseFloat(params.total) : 0;
        
        const paymentResponse = await fetch(API_ENDPOINTS.PAYMENT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            currency: 'usd',
            paymentMethodId: paymentMethod.id,
            customerInfo: customerInfo,
            billingAddress: {
              line1: address.line1,
              line2: address.line2,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
            },
            shippingAddress: {
              line1: address.line1,
              line2: address.line2,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
            }
          }),
        });
        
        const paymentData = await paymentResponse.json();
        
        if (!paymentData.success) {
          throw new Error(paymentData.error || 'Payment failed');
        }
        
        // Store payment intent ID for order creation
        setPaymentIntentId(paymentData.paymentIntentId);
        
        // Create order with Printify
        const orderId = await createOrder(paymentData.paymentIntentId);
        
        if (!orderId) {
          throw new Error('Failed to create order');
        }
        
        // Navigate to success screen
        router.push({
          pathname: '/success',
          params: { orderId: orderId }
        });
      }
    } catch (error) {
      console.error('Express payment error:', error);
      Alert.alert('Error', 'Something went wrong with your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create order with Printify after successful payment
  const createOrder = async (paymentIntentId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.ORDER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntentId,
          orderData: {
            items: [
              {
                productId: params.productId,
                variantId: parseInt(params.variantId),
                printProviderId: 1, // This should be dynamically determined
                imageUrl: '', // This should be the image URL from previous steps
                quantity: 1
              }
            ],
            shipping: params.shippingCost,
            customerInfo: customerInfo,
            shippingAddress: {
              firstName: customerInfo.name.split(' ')[0],
              lastName: customerInfo.name.split(' ').slice(1).join(' '),
              line1: address.line1,
              line2: address.line2,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
            }
          }
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }
      
      return data.orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  };

  const handlePayment = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported on web');
      return;
    }

    if (!cardComplete) {
      Alert.alert('Error', 'Please complete the card details');
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      Alert.alert('Error', 'Please fill in all customer information');
      return;
    }

    if (!address.line1 || !address.city || !address.state || !address.postalCode) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }

    setLoading(true);
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              line1: address.line1,
              line2: address.line2,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
            },
          },
        },
      });

      if (error) {
        throw error;
      }

      const clientSecret = await createPaymentIntent();
      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      const orderResult = await createOrder(paymentMethod.id);
      if (orderResult.success) {
        router.push({
          pathname: '/profile',
          params: {
            orderId: orderResult.orderId,
            success: 'true'
          }
        });
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.primary }]}>
      <ThemedText type="subtitle" style={[styles.title, { color: colors.accent3 }]}>
        Payment Details
      </ThemedText>

      <ScrollView style={styles.scrollView}>
        <View style={[styles.section, { backgroundColor: colors.secondary }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.accent3 }]}>
            Order Summary
          </ThemedText>
          
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryText, { color: colors.accent3 }]}>Item Price</ThemedText>
            <ThemedText style={[styles.summaryText, { color: colors.accent3 }]}>
              ${params.itemPrice || '0.00'}
            </ThemedText>
          </View>
          
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryText, { color: colors.accent3 }]}>Shipping</ThemedText>
            <ThemedText style={[styles.summaryText, { color: colors.accent3 }]}>
              ${params.shippingCost || '0.00'}
            </ThemedText>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText style={[styles.totalText, { color: colors.accent2 }]}>Total</ThemedText>
            <ThemedText style={[styles.totalText, { color: colors.accent2 }]}>
              ${params.total || '0.00'}
            </ThemedText>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.secondary }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.accent3 }]}>
            Express Checkout
          </ThemedText>
          
          <View style={styles.expressButtons}>
            {Platform.OS === 'ios' && (
              <TouchableOpacity 
                style={[
                  styles.expressButton, 
                  { backgroundColor: '#000000' },
                  loading && { opacity: 0.5 }
                ]}
                onPress={() => handleExpressPayment('apple')}
                disabled={loading}>
                <ThemedText style={styles.expressButtonText}>
                  {loading ? 'Processing...' : 'Apple Pay'}
                </ThemedText>
              </TouchableOpacity>
            )}
            
            {Platform.OS === 'android' && (
              <TouchableOpacity 
                style={[
                  styles.expressButton, 
                  { backgroundColor: '#3DDC84' },
                  loading && { opacity: 0.5 }
                ]}
                onPress={() => handleExpressPayment('google')}
                disabled={loading}>
                <ThemedText style={styles.expressButtonText}>
                  {loading ? 'Processing...' : 'Google Pay'}
                </ThemedText>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.expressButton, 
                { backgroundColor: '#0070BA' },
                loading && { opacity: 0.5 }
              ]}
              onPress={() => handleExpressPayment('paypal')}
              disabled={loading}>
              <ThemedText style={styles.expressButtonText}>
                {loading ? 'Processing...' : 'PayPal'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.secondary }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.accent3 }]}>
            Card Information
          </ThemedText>
          
          {Platform.OS !== 'web' && (
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={{
                backgroundColor: colors.primary,
                textColor: colors.accent3,
                borderColor: colors.accent3,
              }}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete);
              }}
            />
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.secondary }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.accent3 }]}>
            Customer Information
          </ThemedText>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.primary,
              color: colors.accent3,
              borderColor: colors.accent3,
            }]}
            placeholder="Full Name"
            placeholderTextColor={colors.accent3 + '80'}
            value={customerInfo.name}
            onChangeText={(text) => setCustomerInfo({ ...customerInfo, name: text })}
          />
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.primary,
              color: colors.accent3,
              borderColor: colors.accent3,
            }]}
            placeholder="Email"
            placeholderTextColor={colors.accent3 + '80'}
            value={customerInfo.email}
            onChangeText={(text) => setCustomerInfo({ ...customerInfo, email: text })}
            keyboardType="email-address"
          />
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.primary,
              color: colors.accent3,
              borderColor: colors.accent3,
            }]}
            placeholder="Phone"
            placeholderTextColor={colors.accent3 + '80'}
            value={customerInfo.phone}
            onChangeText={(text) => setCustomerInfo({ ...customerInfo, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.secondary }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.accent3 }]}>
            Shipping Address
          </ThemedText>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.primary,
              color: colors.accent3,
              borderColor: colors.accent3,
            }]}
            placeholder="Address Line 1"
            placeholderTextColor={colors.accent3 + '80'}
            value={address.line1}
            onChangeText={(text) => setAddress({ ...address, line1: text })}
          />
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.primary,
              color: colors.accent3,
              borderColor: colors.accent3,
            }]}
            placeholder="Address Line 2 (Optional)"
            placeholderTextColor={colors.accent3 + '80'}
            value={address.line2}
            onChangeText={(text) => setAddress({ ...address, line2: text })}
          />
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput, { 
                backgroundColor: colors.primary,
                color: colors.accent3,
                borderColor: colors.accent3,
              }]}
              placeholder="City"
              placeholderTextColor={colors.accent3 + '80'}
              value={address.city}
              onChangeText={(text) => setAddress({ ...address, city: text })}
            />
            <TextInput
              style={[styles.input, styles.halfInput, { 
                backgroundColor: colors.primary,
                color: colors.accent3,
                borderColor: colors.accent3,
              }]}
              placeholder="State"
              placeholderTextColor={colors.accent3 + '80'}
              value={address.state}
              onChangeText={(text) => setAddress({ ...address, state: text })}
            />
          </View>
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput, { 
                backgroundColor: colors.primary,
                color: colors.accent3,
                borderColor: colors.accent3,
              }]}
              placeholder="Postal Code"
              placeholderTextColor={colors.accent3 + '80'}
              value={address.postalCode}
              onChangeText={(text) => setAddress({ ...address, postalCode: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.halfInput, { 
                backgroundColor: colors.primary,
                color: colors.accent3,
                borderColor: colors.accent3,
              }]}
              placeholder="Country"
              placeholderTextColor={colors.accent3 + '80'}
              value={address.country}
              onChangeText={(text) => setAddress({ ...address, country: text })}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.accent3 }]}
          onPress={handleBack}
        >
          <ThemedText style={styles.buttonText}>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.accent2 }]}
          onPress={handlePayment}
          disabled={loading || !cardComplete}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? 'Processing...' : 'Pay Now'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardField: {
    height: 50,
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  expressButtons: {
    gap: 12,
  },
  expressButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  expressButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  payButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});