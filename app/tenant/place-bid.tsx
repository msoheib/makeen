import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Chip, RadioButton, Switch, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { 
  ArrowLeft,
  Home,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Shield,
  Zap,
  Car,
  Bed,
  Bath
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import { useApi } from '@/hooks/useApi';
import { propertiesApi, bidsApi } from '@/lib/api';

export default function PlaceBidScreen() {
  const router = useRouter();
  const { propertyId } = useLocalSearchParams();
  const { theme } = useAppTheme();

  // Get property details
  const { 
    data: property, 
    loading: propertyLoading, 
    error: propertyError 
  } = useApi(() => propertiesApi.getById(propertyId as string), [propertyId]);

  // Bid form state
  const [bidAmount, setBidAmount] = useState('');
  const [rentalDuration, setRentalDuration] = useState('12');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Validation states
  const [bidAmountError, setBidAmountError] = useState('');
  const [securityDepositError, setSecurityDepositError] = useState('');
  const [moveInDateError, setMoveInDateError] = useState('');

  const validateBidAmount = () => {
    const amount = parseFloat(bidAmount);
    if (!bidAmount || isNaN(amount) || amount <= 0) {
      setBidAmountError('يرجى إدخال مبلغ صحيح');
      return false;
    }
    
    if (property?.data?.minimum_bid_amount && amount < property.data.minimum_bid_amount) {
      setBidAmountError(`الحد الأدنى للعرض هو ${formatPrice(property.data.minimum_bid_amount)}`);
      return false;
    }
    
    if (property?.data?.maximum_bid_amount && amount > property.data.maximum_bid_amount) {
      setBidAmountError(`الحد الأقصى للعرض هو ${formatPrice(property.data.maximum_bid_amount)}`);
      return false;
    }
    
    setBidAmountError('');
    return true;
  };

  const validateSecurityDeposit = () => {
    const deposit = parseFloat(securityDeposit);
    if (!securityDeposit || isNaN(deposit) || deposit < 0) {
      setSecurityDepositError('يرجى إدخال مبلغ صحيح للعربون');
      return false;
    }
    setSecurityDepositError('');
    return true;
  };

  const validateMoveInDate = () => {
    if (!moveInDate) {
      setMoveInDateError('يرجى تحديد تاريخ الانتقال');
      return false;
    }
    
    const selectedDate = new Date(moveInDate);
    const today = new Date();
    if (selectedDate < today) {
      setMoveInDateError('تاريخ الانتقال يجب أن يكون في المستقبل');
      return false;
    }
    
    setMoveInDateError('');
    return true;
  };

  const handleSubmitBid = async () => {
    // Validate all fields
    const isBidValid = validateBidAmount();
    const isDepositValid = validateSecurityDeposit();
    const isDateValid = validateMoveInDate();

    if (!isBidValid || !isDepositValid || !isDateValid) {
      return;
    }

    setSubmitting(true);

    try {
      const bidData = {
        property_id: propertyId as string,
        bid_type: 'rental' as const,
        bid_amount: parseFloat(bidAmount),
        rental_duration_months: parseInt(rentalDuration),
        security_deposit_amount: parseFloat(securityDeposit),
        utilities_included: utilitiesIncluded,
        move_in_date: moveInDate,
        message: message.trim() || undefined
      };

      const result = await bidsApi.create(bidData);

      if (result.error) {
        Alert.alert('خطأ', result.error.message || 'حدث خطأ أثناء تقديم العرض');
      } else {
        Alert.alert(
          'تم تقديم العرض بنجاح',
          'سيتم مراجعة عرضك من قبل مدير العقارات وسيتم إشعارك بالنتيجة',
          [
            {
              text: 'حسناً',
              onPress: () => router.replace('/tenant/dashboard')
            }
          ]
        );
        
        // Automatically navigate back after a short delay
        setTimeout(() => {
          router.replace('/tenant/dashboard');
        }, 1500);
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع أثناء تقديم العرض');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  // Calculate total first year cost
  const calculateTotalCost = () => {
    const bid = parseFloat(bidAmount) || 0;
    const deposit = parseFloat(securityDeposit) || 0;
    const duration = parseInt(rentalDuration) || 12;
    const monthlyRent = bid / duration;
    const totalFirstYear = (monthlyRent * Math.min(duration, 12)) + deposit;
    return totalFirstYear;
  };

  if (propertyLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="تقديم عرض إيجار" 
          showBack={true}
          variant="dark"
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            جاري تحميل تفاصيل العقار...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (propertyError || !property?.data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="تقديم عرض إيجار" 
          showBack={true}
          variant="dark"
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            خطأ في تحميل تفاصيل العقار
          </Text>
          <Button mode="outlined" onPress={() => router.back()}>
            العودة
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const propertyData = property.data;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="تقديم عرض إيجار" 
        showBack={true}
        variant="dark"
      />

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Property Summary */}
          <Card style={[styles.propertyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.propertyHeader}>
                <Home size={24} color={theme.colors.primary} />
                <View style={styles.propertyInfo}>
                  <Text style={[styles.propertyTitle, { color: theme.colors.onSurface }]}>
                    {propertyData.title}
                  </Text>
                  <View style={styles.locationRow}>
                    <MapPin size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]}>
                      {propertyData.address}, {propertyData.city}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.propertyFeatures}>
                {propertyData.bedrooms && (
                  <View style={styles.featureItem}>
                    <Bed size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                      {propertyData.bedrooms} غرف
                    </Text>
                  </View>
                )}
                {propertyData.bathrooms && (
                  <View style={styles.featureItem}>
                    <Bath size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                      {propertyData.bathrooms} حمام
                    </Text>
                  </View>
                )}
                {propertyData.parking_spaces > 0 && (
                  <View style={styles.featureItem}>
                    <Car size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                      {propertyData.parking_spaces} مواقف
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.priceInfo}>
                <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
                  السعر المطلوب:
                </Text>
                <Text style={[styles.priceText, { color: theme.colors.primary }]}>
                  {formatPrice(propertyData.price)}
                </Text>
              </View>

              {propertyData.minimum_bid_amount && (
                <View style={styles.bidLimits}>
                  <Chip mode="outlined" style={styles.limitChip}>
                    الحد الأدنى: {formatPrice(propertyData.minimum_bid_amount)}
                  </Chip>
                  {propertyData.maximum_bid_amount && (
                    <Chip mode="outlined" style={styles.limitChip}>
                      الحد الأقصى: {formatPrice(propertyData.maximum_bid_amount)}
                    </Chip>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Bid Form */}
          <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                تفاصيل العرض
              </Text>

              {/* Bid Amount */}
              <View style={styles.formField}>
                <TextInput
                  label="مبلغ العرض السنوي (ريال سعودي)"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  onBlur={validateBidAmount}
                  mode="outlined"
                  keyboardType="numeric"
                  left={<TextInput.Icon icon={() => <DollarSign size={20} color={theme.colors.onSurfaceVariant} />} />}
                  error={!!bidAmountError}
                  style={styles.textInput}
                />
                {bidAmountError ? <HelperText type="error">{bidAmountError}</HelperText> : null}
              </View>

              {/* Rental Duration */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
                  مدة الإيجار (بالأشهر)
                </Text>
                <View style={styles.durationOptions}>
                  {['6', '12', '24'].map((duration) => (
                    <View key={duration} style={styles.radioOption}>
                      <RadioButton
                        value={duration}
                        status={rentalDuration === duration ? 'checked' : 'unchecked'}
                        onPress={() => setRentalDuration(duration)}
                      />
                      <Text style={[styles.radioText, { color: theme.colors.onSurface }]}>
                        {duration} شهر
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Security Deposit */}
              <View style={styles.formField}>
                <TextInput
                  label="مبلغ العربون (ريال سعودي)"
                  value={securityDeposit}
                  onChangeText={setSecurityDeposit}
                  onBlur={validateSecurityDeposit}
                  mode="outlined"
                  keyboardType="numeric"
                  left={<TextInput.Icon icon={() => <Shield size={20} color={theme.colors.onSurfaceVariant} />} />}
                  error={!!securityDepositError}
                  style={styles.textInput}
                />
                {securityDepositError ? <HelperText type="error">{securityDepositError}</HelperText> : null}
              </View>

              {/* Move-in Date */}
              <View style={styles.formField}>
                <TextInput
                  label="تاريخ الانتقال المرغوب (YYYY-MM-DD)"
                  value={moveInDate}
                  onChangeText={setMoveInDate}
                  onBlur={validateMoveInDate}
                  mode="outlined"
                  placeholder="2024-01-15"
                  left={<TextInput.Icon icon={() => <Calendar size={20} color={theme.colors.onSurfaceVariant} />} />}
                  error={!!moveInDateError}
                  style={styles.textInput}
                />
                {moveInDateError ? <HelperText type="error">{moveInDateError}</HelperText> : null}
              </View>

              {/* Utilities Switch */}
              <View style={styles.switchField}>
                <View style={styles.switchLabel}>
                  <Zap size={20} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.switchText, { color: theme.colors.onSurface }]}>
                    الخدمات متضمنة في الإيجار
                  </Text>
                </View>
                <Switch
                  value={utilitiesIncluded}
                  onValueChange={setUtilitiesIncluded}
                />
              </View>

              {/* Message */}
              <View style={styles.formField}>
                <TextInput
                  label="رسالة إضافية (اختياري)"
                  value={message}
                  onChangeText={setMessage}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  placeholder="اذكر أي معلومات إضافية تود إضافتها لعرضك..."
                  style={styles.textArea}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Cost Summary */}
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                ملخص التكاليف
              </Text>

              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: theme.colors.onSurfaceVariant }]}>
                  الإيجار الشهري:
                </Text>
                <Text style={[styles.costValue, { color: theme.colors.onSurface }]}>
                  {bidAmount ? formatPrice(parseFloat(bidAmount) / parseInt(rentalDuration)) : '-'}
                </Text>
              </View>

              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: theme.colors.onSurfaceVariant }]}>
                  العربون:
                </Text>
                <Text style={[styles.costValue, { color: theme.colors.onSurface }]}>
                  {securityDeposit ? formatPrice(parseFloat(securityDeposit)) : '-'}
                </Text>
              </View>

              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: theme.colors.onSurfaceVariant }]}>
                  مدة الإيجار:
                </Text>
                <Text style={[styles.costValue, { color: theme.colors.onSurface }]}>
                  {rentalDuration} شهر
                </Text>
              </View>

              <View style={[styles.costRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { color: theme.colors.primary }]}>
                  إجمالي السنة الأولى:
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                  {bidAmount && securityDeposit ? formatPrice(calculateTotalCost()) : '-'}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={handleSubmitBid}
            loading={submitting}
            disabled={submitting || !bidAmount || !securityDeposit || !moveInDate}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            {submitting ? 'جاري تقديم العرض...' : 'تقديم العرض'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  propertyCard: {
    marginVertical: 16,
    borderRadius: 16,
    elevation: 2,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
  },
  propertyFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
  },
  bidLimits: {
    flexDirection: 'row',
    gap: 8,
  },
  limitChip: {
    flex: 1,
  },
  formCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'right',
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  textArea: {
    backgroundColor: 'transparent',
    minHeight: 100,
  },
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  radioText: {
    fontSize: 14,
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    fontSize: 16,
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  submitContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  submitButton: {
    borderRadius: 12,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
}); 
