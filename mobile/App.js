import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    StatusBar,
    ScrollView,
    Platform,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, runTransaction } from 'firebase/database';
import { db, isFirebaseConfigured } from './firebaseConfig';

const LOCAL_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://demo-app-backend-rn4k.onrender.com';
const STORAGE_KEY_VOTED = 'VOTING_DEMO_HAS_VOTED';
const STORAGE_KEY_OPTION = 'VOTING_DEMO_SELECTED_OPTION';

export default function App() {
    // Navigation & Voting State
    const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'confirmation'
    const [selectedOption, setSelectedOption] = useState(null); // 'seniorCitizen' | 'governmentServant'
    const [hasVoted, setHasVoted] = useState(false);
    const [votedOptionName, setVotedOptionName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoadingStorage, setIsLoadingStorage] = useState(true);

    // Check persistent device storage on load to enforce single vote
    useEffect(() => {
        checkVotedStatus();
    }, []);

    const checkVotedStatus = async () => {
        try {
            const voted = await AsyncStorage.getItem(STORAGE_KEY_VOTED);
            const savedOption = await AsyncStorage.getItem(STORAGE_KEY_OPTION);
            if (voted === 'true') {
                setHasVoted(true);
                setVotedOptionName(savedOption === 'seniorCitizen' ? 'Senior Citizen' : 'Government Servant');
                setCurrentScreen('confirmation');
            }
        } catch (err) {
            console.error('Error reading storage:', err);
        } finally {
            setIsLoadingStorage(false);
        }
    };

    const handleSelectOption = (option) => {
        if (isSubmitting || hasVoted) return;
        setErrorMessage('');
        setSelectedOption(option);
    };

    const handleVoteSubmit = async () => {
        if (!selectedOption || isSubmitting || hasVoted) return;

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            if (isFirebaseConfigured) {
                // Firebase Cloud DB
                const optionRef = ref(db, `votes/${selectedOption}`);
                await runTransaction(optionRef, (currentValue) => {
                    return (currentValue || 0) + 1;
                });
            } else {
                // Local Backend Server
                const response = await fetch(`${LOCAL_BACKEND_URL}/api/vote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ option: selectedOption })
                });
                if (!response.ok) {
                    throw new Error('Server request failed');
                }
            }

            // Record vote locally on device to prevent multiple votes
            await AsyncStorage.setItem(STORAGE_KEY_VOTED, 'true');
            await AsyncStorage.setItem(STORAGE_KEY_OPTION, selectedOption);

            setHasVoted(true);
            setVotedOptionName(selectedOption === 'seniorCitizen' ? 'Senior Citizen' : 'Government Servant');
            setIsSubmitting(false);
            setCurrentScreen('confirmation');
        } catch (error) {
            console.error('Vote submission error:', error);
            setIsSubmitting(false);
            setErrorMessage('Unable to submit vote. Please check network connection and try again.');
        }
    };

    // Demo helper: allows clearing local device state for testing
    const handleResetDeviceVote = async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY_VOTED);
            await AsyncStorage.removeItem(STORAGE_KEY_OPTION);
            setHasVoted(false);
            setSelectedOption(null);
            setVotedOptionName('');
            setErrorMessage('');
            setCurrentScreen('home');
        } catch (err) {
            console.error('Error clearing local vote:', err);
        }
    };

    if (isLoadingStorage) {
        return (
            <SafeAreaView style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#2563EB" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

            {/* Top Professional Header Bar */}
            <View style={styles.topNavbar}>
                <View style={styles.navBrand}>
                    <View style={styles.navLogoDot} />
                    <Text style={styles.navBrandText}>E-VOTING SYSTEM</Text>
                </View>
                <View style={styles.securityBadge}>
                    <Text style={styles.securityBadgeText}>OFFICIAL DEMO</Text>
                </View>
            </View>

            {currentScreen === 'home' && !hasVoted ? (
                <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>

                    {/* Section Header */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.categoryTitle}>NATIONAL BALLOT DEMO</Text>
                        <Text style={styles.mainTitle}>Cast Your Vote</Text>
                        <Text style={styles.subtitle}>
                            Select your eligible category below. Only one vote per device is permitted.
                        </Text>
                    </View>

                    {/* Voting Options (Clean Professional Cards - No Emojis) */}
                    <View style={styles.optionsContainer}>

                        {/* Option 1: Senior Citizen */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => handleSelectOption('seniorCitizen')}
                            style={[
                                styles.optionCard,
                                selectedOption === 'seniorCitizen' && styles.optionCardSelected
                            ]}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[
                                    styles.iconBox,
                                    selectedOption === 'seniorCitizen' && styles.iconBoxSelected
                                ]}>
                                    <Text style={[
                                        styles.iconBoxCode,
                                        selectedOption === 'seniorCitizen' && styles.iconBoxCodeSelected
                                    ]}>
                                        SC
                                    </Text>
                                </View>

                                {selectedOption === 'seniorCitizen' ? (
                                    <View style={styles.checkBadge}>
                                        <Text style={styles.checkBadgeText}>✓ SELECTED</Text>
                                    </View>
                                ) : (
                                    <View style={styles.radioOuter}>
                                        <View style={styles.radioInner} />
                                    </View>
                                )}
                            </View>

                            <Text style={[
                                styles.optionTitle,
                                selectedOption === 'seniorCitizen' && styles.optionTitleSelected
                            ]}>
                                Senior Citizen
                            </Text>

                            <Text style={styles.optionSubtext}>
                                Verified senior citizens voting category
                            </Text>
                        </TouchableOpacity>

                        {/* Option 2: Government Servant */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => handleSelectOption('governmentServant')}
                            style={[
                                styles.optionCard,
                                selectedOption === 'governmentServant' && styles.optionCardSelected
                            ]}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[
                                    styles.iconBox,
                                    selectedOption === 'governmentServant' && styles.iconBoxSelected
                                ]}>
                                    <Text style={[
                                        styles.iconBoxCode,
                                        selectedOption === 'governmentServant' && styles.iconBoxCodeSelected
                                    ]}>
                                        GS
                                    </Text>
                                </View>

                                {selectedOption === 'governmentServant' ? (
                                    <View style={styles.checkBadge}>
                                        <Text style={styles.checkBadgeText}>✓ SELECTED</Text>
                                    </View>
                                ) : (
                                    <View style={styles.radioOuter}>
                                        <View style={styles.radioInner} />
                                    </View>
                                )}
                            </View>

                            <Text style={[
                                styles.optionTitle,
                                selectedOption === 'governmentServant' && styles.optionTitleSelected
                            ]}>
                                Government Servant
                            </Text>

                            <Text style={styles.optionSubtext}>
                                Government employees & officials category
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Error Banner */}
                    {errorMessage ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}

                    {/* Vote Action Footer */}
                    <View style={styles.footerContainer}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            disabled={!selectedOption || isSubmitting}
                            onPress={handleVoteSubmit}
                            style={[
                                styles.voteButton,
                                (!selectedOption || isSubmitting) && styles.voteButtonDisabled
                            ]}
                        >
                            {isSubmitting ? (
                                <View style={styles.loadingRow}>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={styles.voteButtonText}>RECORDING VOTE...</Text>
                                </View>
                            ) : (
                                <Text style={styles.voteButtonText}>SUBMIT VOTE</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.securityNoteRow}>
                            <Text style={styles.lockIcon}>🔒</Text>
                            <Text style={styles.disclaimerText}>
                                Encrypted & Anonymous • Single Vote Per Device Enforced
                            </Text>
                        </View>
                    </View>

                </ScrollView>
            ) : (
                /* Confirmation & Single Vote Protection Screen */
                <View style={styles.confirmationContainer}>
                    <View style={styles.confirmationCard}>
                        <View style={styles.successIconCircle}>
                            <Text style={styles.successCheckIcon}>✓</Text>
                        </View>

                        <Text style={styles.confirmationTitle}>Vote Submitted</Text>
                        <Text style={styles.confirmationSubtitle}>
                            Thank you for voting.
                        </Text>

                        <View style={styles.statusBox}>
                            <Text style={styles.statusBoxLabel}>VOTING STATUS</Text>
                            <Text style={styles.statusBoxValue}>VOTE RECORDED SUCCESSFULLY</Text>
                            <Text style={styles.statusBoxDesc}>
                                Your device has registered 1 vote. Duplicate voting from this device is disabled.
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoRowIcon}>ℹ️</Text>
                            <Text style={styles.infoRowText}>
                                To maintain ballot integrity, this app prevents submitting multiple votes from the same device.
                            </Text>
                        </View>

                        {/* Clear Local Vote Button for Demo Testing */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleResetDeviceVote}
                            style={styles.resetLocalButton}
                        >
                            <Text style={styles.resetLocalButtonText}>CLEAR LOCAL DEVICE VOTE (TEST DEMO)</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    topNavbar: {
        height: 56,
        backgroundColor: '#1E293B',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20
    },
    navBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    navLogoDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2563EB'
    },
    navBrandText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#F8FAFC',
        letterSpacing: 1.5
    },
    securityBadge: {
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(37, 99, 235, 0.4)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12
    },
    securityBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#60A5FA',
        letterSpacing: 1
    },
    scrollContainer: {
        paddingHorizontal: 24,
        paddingVertical: 24,
        minHeight: '90%',
        justifyContent: 'space-between'
    },
    headerContainer: {
        marginVertical: 12
    },
    categoryTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#38BDF8',
        letterSpacing: 2,
        marginBottom: 6
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: '#94A3B8',
        lineHeight: 22
    },
    optionsContainer: {
        gap: 16,
        marginVertical: 20
    },
    optionCard: {
        backgroundColor: '#1E293B',
        borderRadius: 18,
        padding: 20,
        borderWidth: 2,
        borderColor: '#334155'
    },
    optionCardSelected: {
        borderColor: '#2563EB',
        backgroundColor: '#1E293B'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconBoxSelected: {
        backgroundColor: '#2563EB',
        borderColor: '#3B82F6'
    },
    iconBoxCode: {
        fontSize: 15,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1
    },
    iconBoxCodeSelected: {
        color: '#FFFFFF'
    },
    checkBadge: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20
    },
    checkBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#64748B',
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'transparent'
    },
    optionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#F8FAFC',
        marginBottom: 4
    },
    optionTitleSelected: {
        color: '#60A5FA'
    },
    optionSubtext: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '400'
    },
    errorBanner: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderRadius: 12,
        padding: 14,
        marginVertical: 10
    },
    errorText: {
        color: '#FCA5A5',
        fontSize: 13,
        fontWeight: '600'
    },
    footerContainer: {
        marginTop: 20,
        marginBottom: 12,
        alignItems: 'center'
    },
    voteButton: {
        width: '100%',
        backgroundColor: '#2563EB',
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    voteButtonDisabled: {
        backgroundColor: '#334155'
    },
    voteButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1.5
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    securityNoteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 14
    },
    lockIcon: {
        fontSize: 12
    },
    disclaimerText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500'
    },
    confirmationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#0F172A'
    },
    confirmationCard: {
        width: '100%',
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155'
    },
    successIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderWidth: 2,
        borderColor: '#22C55E',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18
    },
    successCheckIcon: {
        fontSize: 36,
        color: '#4ADE80',
        fontWeight: '900'
    },
    confirmationTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
        textAlign: 'center'
    },
    confirmationSubtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 20
    },
    statusBox: {
        width: '100%',
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        marginBottom: 16
    },
    statusBoxLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#38BDF8',
        letterSpacing: 1.5,
        marginBottom: 4
    },
    statusBoxValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#22C55E',
        letterSpacing: 1,
        marginBottom: 6
    },
    statusBoxDesc: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20
    },
    infoRowIcon: {
        fontSize: 14
    },
    infoRowText: {
        flex: 1,
        fontSize: 12,
        color: '#93C5FD',
        lineHeight: 16
    },
    resetLocalButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)'
    },
    resetLocalButtonText: {
        color: '#FCA5A5',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1
    }
});
