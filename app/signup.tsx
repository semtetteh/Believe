import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, GraduationCap, Mail, User, AtSign, Eye, EyeOff, Key, Check, Search, School } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, signUp, School as SchoolType } from '@/lib/supabase';

export default function SignUpScreen() {
  const { isDark } = useTheme();
  const { signUpStep, setSignUpStep, signUpData, updateSignUpData } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data, error } = await supabase.from('schools').select('*').order('name');
        
        if (error) {
          console.error('Error fetching schools:', error);
          return;
        }
        
        if (data) {
          setSchools(data);
          setFilteredSchools(data);
        }
      } catch (error) {
        console.error('Error in fetchSchools:', error);
      }
    };
    
    fetchSchools();
  }, []);
  
  // Filter schools based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSchools(schools);
    } else {
      const filtered = schools.filter(school => 
        school.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSchools(filtered);
    }
  }, [searchQuery, schools]);
  
  const handleBack = () => {
    if (signUpStep === 1) {
      router.back();
    } else {
      setSignUpStep(signUpStep - 1);
    }
  };
  
  const handleSchoolSelect = (school: SchoolType) => {
    updateSignUpData({ school: school.name });
    setSignUpStep(2);
  };
  
  const handleEmailSubmit = async () => {
    setError('');
    
    if (!signUpData.email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, you would send a verification code to the email
      // For this demo, we'll simulate it
      setTimeout(() => {
        setIsLoading(false);
        setSignUpStep(3);
      }, 1500);
    } catch (error) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleVerifyCode = () => {
    setError('');
    
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    
    // In a real app, you would verify the code with your backend
    // For this demo, we'll accept any code
    if (verificationCode.length < 4) {
      setError('Please enter a valid verification code');
      return;
    }
    
    setSignUpStep(4);
  };
  
  const handleProfileSubmit = () => {
    setError('');
    
    if (!signUpData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    if (!signUpData.username.trim()) {
      setError('Please choose a username');
      return;
    }
    
    // Basic username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(signUpData.username)) {
      setError('Username must be 3-20 characters and can only contain letters, numbers, and underscores');
      return;
    }
    
    setSignUpStep(5);
  };
  
  const handlePasswordSubmit = async () => {
    setError('');
    
    if (!signUpData.password.trim()) {
      setError('Please enter a password');
      return;
    }
    
    if (signUpData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (signUpData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signUp(
        signUpData.email,
        signUpData.password,
        {
          full_name: signUpData.fullName,
          username: signUpData.username,
          school: signUpData.school
        }
      );
      
      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      // Success - redirect to sign in
      Alert.alert(
        'Account Created',
        'Your account has been created successfully. Please sign in.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSignUpStep(1);
              router.replace('/');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Sign up error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderSchoolItem = ({ item }: { item: SchoolType }) => (
    <TouchableOpacity
      style={[
        styles.schoolItem,
        { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }
      ]}
      onPress={() => handleSchoolSelect(item)}
    >
      <View style={styles.schoolIcon}>
        <School size={24} color={isDark ? '#60A5FA' : '#3B82F6'} />
      </View>
      <View style={styles.schoolInfo}>
        <Text style={[styles.schoolName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          {item.name}
        </Text>
        {item.location && (
          <Text style={[styles.schoolLocation, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {item.location}
          </Text>
        )}
      </View>
      <ArrowRight size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <ArrowLeft size={24} color={isDark ? '#E5E7EB' : '#4B5563'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {signUpStep === 1 ? 'Select School' : 
             signUpStep === 2 ? 'Enter Email' : 
             signUpStep === 3 ? 'Verify Email' : 
             signUpStep === 4 ? 'Create Profile' : 'Create Password'}
          </Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View 
              key={step}
              style={[
                styles.progressStep,
                { 
                  backgroundColor: step <= signUpStep ? '#3B82F6' : (isDark ? '#374151' : '#E5E7EB'),
                  width: `${100 / 5}%`
                }
              ]}
            />
          ))}
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: School Selection */}
          {signUpStep === 1 && (
            <View style={[styles.formCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <View style={styles.stepIconContainer}>
                <GraduationCap size={32} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
              
              <Text style={[styles.formTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Select Your School
              </Text>
              
              <Text style={[styles.formDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Choose your school to connect with classmates and access school-specific resources.
              </Text>
              
              <View style={[
                styles.searchContainer,
                { backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderColor: isDark ? '#374151' : '#E5E7EB' }
              ]}>
                <Search size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                <TextInput
                  style={[styles.searchInput, { color: isDark ? '#E5E7EB' : '#1F2937' }]}
                  placeholder="Search for your school"
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              
              <FlatList
                data={filteredSchools}
                renderItem={renderSchoolItem}
                keyExtractor={(item) => item.id}
                style={styles.schoolsList}
                contentContainerStyle={styles.schoolsListContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                      No schools found matching "{searchQuery}"
                    </Text>
                  </View>
                }
              />
            </View>
          )}
          
          {/* Step 2: Email Input */}
          {signUpStep === 2 && (
            <View style={[styles.formCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <View style={styles.stepIconContainer}>
                <Mail size={32} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
              
              <Text style={[styles.formTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Enter Your Email
              </Text>
              
              <Text style={[styles.formDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                We'll send a verification code to this email to confirm it's yours.
              </Text>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#E5E7EB' : '#4B5563' }]}>
                  Email Address
                </Text>
                <View style={[
                  styles.inputContainer, 
                  { backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderColor: isDark ? '#374151' : '#E5E7EB' }
                ]}>
                  <Mail size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#E5E7EB' : '#1F2937' }]}
                    placeholder="Enter your email"
                    placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    value={signUpData.email}
                    onChangeText={(text) => updateSignUpData({ email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.nextButton, 
                  { backgroundColor: '#3B82F6' },
                  isLoading && { opacity: 0.7 }
                ]}
                onPress={handleEmailSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.nextButtonContent}>
                    <Text style={styles.nextButtonText}>Continue</Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
              
              <Text style={[styles.termsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </View>
          )}
          
          {/* Step 3: Email Verification */}
          {signUpStep === 3 && (
            <View style={[styles.formCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <View style={styles.stepIconContainer}>
                <Check size={32} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
              
              <Text style={[styles.formTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Verify Your Email
              </Text>
              
              <Text style={[styles.formDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                We've sent a verification code to {signUpData.email}. Please enter it below.
              </Text>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#E5E7EB' : '#4B5563' }]}>
                  Verification Code
                </Text>
                <View style={[
                  styles.inputContainer, 
                  { backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderColor: isDark ? '#374151' : '#E5E7EB' }
                ]}>
                  <TextInput
                    style={[styles.codeInput, { color: isDark ? '#E5E7EB' : '#1F2937' }]}
                    placeholder="Enter verification code"
                    placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.nextButton, 
                  { backgroundColor: '#3B82F6' }
                ]}
                onPress={handleVerifyCode}
              >
                <View style={styles.nextButtonContent}>
                  <Text style={styles.nextButtonText}>Verify</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resendButton}>
                <Text style={[styles.resendText, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>
                  Didn't receive a code? Resend
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Step 4: Profile Details */}
          {signUpStep === 4 && (
            <View style={[styles.formCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <View style={styles.stepIconContainer}>
                <User size={32} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
              
              <Text style={[styles.formTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Create Your Profile
              </Text>
              
              <Text style={[styles.formDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Tell us a bit about yourself. You can change these details later.
              </Text>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#E5E7EB' : '#4B5563' }]}>
                  Full Name
                </Text>
                <View style={[
                  styles.inputContainer, 
                  { backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderColor: isDark ? '#374151' : '#E5E7EB' }
                ]}>
                  <User size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#E5E7EB' : '#1F2937' }]}
                    placeholder="Enter your full name"
                    placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    value={signUpData.fullName}
                    onChangeText={(text) => updateSignUpData({ fullName: text })}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#E5E7EB' : '#4B5563' }]}>
                  Username
                </Text>
                <View style={[
                  styles.inputContainer, 
                  { backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderColor: isDark ? '#374151' : '#E5E7EB' }
                ]}>
                  <AtSign size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#E5E7EB' : '#1F2937' }]}
                    placeholder="Choose a username"
                    placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    value={signUpData.username}
                    onChangeText={(text) => updateSignUpData({ username: text })}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.nextButton, 
                  { backgroundColor: '#3B82F6' }
                ]}
                onPress={handleProfileSubmit}
              >
                <View style={styles.nextButtonContent}>
                  <Text style={styles.nextButtonText}>Continue</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Step 5: Password Creation */}
          {signUpStep === 5 && (
            <View style={[styles.formCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <View style={styles.stepIconContainer}>
                <Key size={32} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
              
              <Text style={[styles.formTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Create Password
              </Text>
              
              <Text style={[styles.formDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Create a secure password for your account.
              </Text>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#E5E7EB' : '#4B5563' }]}>
                  Password
                </Text>
                <View style={[
                  styles.inputContainer, 
                  { backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderColor: isDark ? '#374151' : '#E5E7EB' }
                ]}>
                  <Key size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#E5E7EB' : '#1F2937' }]}
                    placeholder="Create a password"
                    placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    value={signUpData.password}
                    onChangeText={(text) => updateSignUpData({ password: text })}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                    ) : (
                      <Eye size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#E5E7EB' : '#4B5563' }]}>
                  Confirm Password
                </Text>
                <View style={[
                  styles.inputContainer, 
                  { backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderColor: isDark ? '#374151' : '#E5E7EB' }
                ]}>
                  <Key size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#E5E7EB' : '#1F2937' }]}
                    placeholder="Confirm your password"
                    placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                    ) : (
                      <Eye size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.passwordRequirements}>
                <Text style={[styles.requirementsTitle, { color: isDark ? '#E5E7EB' : '#4B5563' }]}>
                  Password must:
                </Text>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: signUpData.password.length >= 8 ? '#10B981' : (isDark ? '#374151' : '#E5E7EB') }
                  ]} />
                  <Text style={[styles.requirementText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    Be at least 8 characters long
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: /[A-Z]/.test(signUpData.password) ? '#10B981' : (isDark ? '#374151' : '#E5E7EB') }
                  ]} />
                  <Text style={[styles.requirementText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    Contain at least one uppercase letter
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: /[0-9]/.test(signUpData.password) ? '#10B981' : (isDark ? '#374151' : '#E5E7EB') }
                  ]} />
                  <Text style={[styles.requirementText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    Contain at least one number
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.nextButton, 
                  { backgroundColor: '#3B82F6' },
                  isLoading && { opacity: 0.7 }
                ]}
                onPress={handlePasswordSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.nextButtonContent}>
                    <Text style={styles.nextButtonText}>Create Account</Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressStep: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  formDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  schoolsList: {
    maxHeight: 400,
  },
  schoolsListContent: {
    paddingVertical: 8,
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  schoolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  schoolLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  codeInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 8,
  },
  eyeButton: {
    padding: 4,
  },
  nextButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 16,
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  resendText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  passwordRequirements: {
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  requirementText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});