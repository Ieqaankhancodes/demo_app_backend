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
    TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://demo-app-backend-rn4k.onrender.com';
const STORAGE_KEY_VOTER = 'E_VOTING_CURRENT_VOTER';

export default function App() {
    // App Screens: 'auth' | 'alreadyVoted' | 'voting' | 'confirmation'
    const [screen, setScreen] = useState('auth');
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

    // Inputs
    const [nameInput, setNameInput] = useState('');
    const [voterIdInput, setVoterIdInput] = useState('');
    const [dobInput, setDobInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');

    // State
    const [currentVoter, setCurrentVoter] = useState(null);
    const [selectedParty, setSelectedParty] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoadingStorage, setIsLoadingStorage] = useState(true);

    useEffect(() => {
        checkLocalVoterState();
    }, []);

    const checkLocalVoterState = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY_VOTER);
            if (stored) {
                const parsed = JSON.parse(stored);
                setCurrentVoter(parsed);
                if (parsed.hasVoted) {
                    setScreen('alreadyVoted');
                } else {
                    setScreen('voting');
                }
            }
        } catch (err) {
            console.error('Storage error:', err);
        } finally {
            setIsLoadingStorage(false);
        }
    };

    // Auto-fill demo helper
    const handleAutoFill = () => {
        setNameInput('Rahul Sharma');
        setVoterIdInput('ABC01');
        setDobInput('01012005');
        setPasswordInput('01012005');
    };

    // Account Creation
    const handleRegister = async () => {
        if (!voterIdInput || !dobInput || !nameInput) {
            setErrorMessage('Name, Voter ID, and Date of Birth are required.');
            return;
        }
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await fetch(`${LOCAL_BACKEND_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: nameInput,
                    voterId: voterIdInput,
                    dob: dobInput,
                    password: passwordInput || dobInput
                })
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Registration failed.');
            }

            setSuccessMessage(data.message || 'Account created! Please login to vote.');
            setAuthMode('login');
        } catch (err) {
            setErrorMessage(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Login & Citizen Verification
    const handleLogin = async () => {
        if (!voterIdInput || !dobInput) {
            setErrorMessage('Voter ID and Date of Birth are required.');
            return;
        }
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await fetch(`${LOCAL_BACKEND_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: nameInput,
                    voterId: voterIdInput,
                    dob: dobInput,
                    password: passwordInput || dobInput
                })
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Login & Verification failed.');
            }

            const voterData = data.voter;
            setCurrentVoter(voterData);
            await AsyncStorage.setItem(STORAGE_KEY_VOTER, JSON.stringify(voterData));

            if (data.alreadyVoted || voterData.hasVoted) {
                setScreen('alreadyVoted');
            } else {
                setScreen('voting');
            }
        } catch (err) {
            setErrorMessage(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cast Vote
    const handleVoteSubmit = async () => {
        if (!selectedParty || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const response = await fetch(`${LOCAL_BACKEND_URL}/api/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voterId: currentVoter ? currentVoter.voterId : voterIdInput,
                    party: selectedParty
                })
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                if (data.alreadyVoted) {
                    setScreen('alreadyVoted');
                    return;
                }
                throw new Error(data.error || 'Unable to record vote.');
            }

            const updatedVoter = { ...currentVoter, hasVoted: true };
            setCurrentVoter(updatedVoter);
            await AsyncStorage.setItem(STORAGE_KEY_VOTER, JSON.stringify(updatedVoter));

            setScreen('confirmation');
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset local voter for testing
    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY_VOTER);
            setCurrentVoter(null);
            setSelectedParty('');
            setErrorMessage('');
            setSuccessMessage('');
            setScreen('auth');
        } catch (err) {
            console.error('Logout error:', err);
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

            {/* Navbar */}
            <View style={styles.topNavbar}>
                <View style={styles.navBrand}>
                    <View style={styles.navLogoDot} />
                    <Text style={styles.navBrandText}>E-VOTING SYSTEM</Text>
                </View>
                <View style={styles.securityBadge}>
                    <Text style={styles.securityBadgeText}>VERIFIED CITIZEN</Text>
                </View>
            </View>

            {/* SCREEN 1: AUTHENTICATION / ACCOUNT CREATION */}
            {screen === 'auth' && (
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <View style={styles.cardContainer}>
                        <Text style={styles.categoryTitle}>NATIONAL E-VOTING PORTAL</Text>
                        <Text style={styles.mainTitle}>
                            {authMode === 'login' ? 'Voter Login' : 'Create Account'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {authMode === 'login'
                                ? 'Verify your voter eligibility with Voter ID & Date of Birth.'
                                : 'First-time voters can create an account using Voter ID.'}
                        </Text>

                        {/* Mode Switcher */}
                        <View style={styles.modeTabContainer}>
                            <TouchableOpacity
                                onPress={() => { setAuthMode('login'); setErrorMessage(''); }}
                                style={[styles.modeTab, authMode === 'login' && styles.modeTabActive]}
                            >
                                <Text style={[styles.modeTabText, authMode === 'login' && styles.modeTabTextActive]}>LOGIN</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => { setAuthMode('register'); setErrorMessage(''); }}
                                style={[styles.modeTab, authMode === 'register' && styles.modeTabActive]}
                            >
                                <Text style={[styles.modeTabText, authMode === 'register' && styles.modeTabTextActive]}>CREATE ACCOUNT</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Quick Fill Button */}
                        <TouchableOpacity style={styles.autoFillBtn} onPress={handleAutoFill}>
                            <Text style={styles.autoFillBtnText}>💡 Auto-Fill Demo Credentials (ABC01 / 01012005)</Text>
                        </TouchableOpacity>

                        {errorMessage ? (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                            </View>
                        ) : null}

                        {successMessage ? (
                            <View style={styles.successBanner}>
                                <Text style={styles.successText}>✅ {successMessage}</Text>
                            </View>
                        ) : null}

                        {/* Inputs */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Name : ___</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor="#64748B"
                                value={nameInput}
                                onChangeText={setNameInput}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Unique Voter ID: (e.g. ABC01)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ABC01"
                                placeholderTextColor="#64748B"
                                value={voterIdInput}
                                onChangeText={setVoterIdInput}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Date of Birth (Password) [Format: DDMMYYYY]</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="01012005"
                                placeholderTextColor="#64748B"
                                keyboardType="number-pad"
                                maxLength={8}
                                value={dobInput}
                                onChangeText={setDobInput}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Password (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Password or leave blank"
                                placeholderTextColor="#64748B"
                                secureTextEntry
                                value={passwordInput}
                                onChangeText={setPasswordInput}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            disabled={isSubmitting}
                            onPress={authMode === 'login' ? handleLogin : handleRegister}
                            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {authMode === 'login' ? 'LOGIN & VERIFY CITIZEN' : 'CREATE ACCOUNT'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {/* SCREEN 2 & 5: PREVENT DUPLICATE VOTING ("ALREADY VOTED") */}
            {screen === 'alreadyVoted' && (
                <View style={styles.centerContainer}>
                    <View style={styles.alertCard}>
                        <Text style={styles.alertIcon}>⚠️</Text>
                        <Text style={styles.alertTitle}>Already Voted</Text>
                        <Text style={styles.alertMessage}>
                            Your vote has already been recorded. You cannot vote again.
                        </Text>
                        <Text style={styles.alertSubtext}>
                            “Vote already cast. You cannot vote again.”
                        </Text>

                        <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
                            <Text style={styles.secondaryButtonText}>LOG OUT & RETURN TO LOGIN</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* SCREEN 3: VOTING PAGE (PARTY A, B, C, D) */}
            {screen === 'voting' && (
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.votingHeader}>
                        <Text style={styles.categoryTitle}>NATIONAL BALLOT</Text>
                        <Text style={styles.mainTitle}>Select Your Party</Text>
                        <Text style={styles.subtitle}>
                            Citizen: {currentVoter ? currentVoter.name : 'Voter'} ({currentVoter ? currentVoter.voterId : ''})
                        </Text>
                    </View>

                    {errorMessage ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}

                    {/* Party Cards */}
                    <View style={styles.partyGrid}>
                        {[
                            { id: 'partyA', name: 'Party A', tag: '⭕ Party A' },
                            { id: 'partyB', name: 'Party B', tag: '⭕ Party B' },
                            { id: 'partyC', name: 'Party C', tag: '⭕ Party C' },
                            { id: 'partyD', name: 'Party D', tag: '⭕ Party D' }
                        ].map((party) => (
                            <TouchableOpacity
                                key={party.id}
                                activeOpacity={0.85}
                                onPress={() => setSelectedParty(party.id)}
                                style={[
                                    styles.partyCard,
                                    selectedParty === party.id && styles.partyCardSelected
                                ]}
                            >
                                <View style={styles.partyCardRow}>
                                    <Text style={[styles.partyTitle, selectedParty === party.id && styles.partyTitleSelected]}>
                                        {party.tag}
                                    </Text>
                                    <View style={[styles.radio, selectedParty === party.id && styles.radioSelected]}>
                                        {selectedParty === party.id && <View style={styles.radioInner} />}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Action */}
                    <TouchableOpacity
                        disabled={!selectedParty || isSubmitting}
                        onPress={handleVoteSubmit}
                        style={[
                            styles.primaryButton,
                            (!selectedParty || isSubmitting) && styles.buttonDisabled
                        ]}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>CAST VOTE</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* SCREEN 4: CONFIRMATION */}
            {screen === 'confirmation' && (
                <View style={styles.centerContainer}>
                    <View style={styles.successCard}>
                        <Text style={styles.checkIcon}>✅</Text>
                        <Text style={styles.confirmTitle}>Vote successfully cast!</Text>
                        <Text style={styles.confirmSubtitle}>Thank you for voting.</Text>

                        <Text style={styles.confirmNote}>
                            The system has marked Voter ID ({currentVoter ? currentVoter.voterId : ''}) as “Voted” so duplicate voting is prevented.
                        </Text>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleLogout}>
                            <Text style={styles.primaryButtonText}>DONE & LOG OUT</Text>
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
        paddingVertical: 24
    },
    cardContainer: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#334155'
    },
    categoryTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#38BDF8',
        letterSpacing: 2,
        marginBottom: 6
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 6
    },
    subtitle: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 20,
        marginBottom: 16
    },
    modeTabContainer: {
        flexDirection: 'row',
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16
    },
    modeTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8
    },
    modeTabActive: {
        backgroundColor: '#2563EB'
    },
    modeTabText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8'
    },
    modeTabTextActive: {
        color: '#FFFFFF'
    },
    autoFillBtn: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
        alignItems: 'center'
    },
    autoFillBtnText: {
        color: '#93C5FD',
        fontSize: 12,
        fontWeight: '700'
    },
    formGroup: {
        marginBottom: 14
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        color: '#CBD5E1',
        marginBottom: 6
    },
    input: {
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#FFFFFF',
        fontSize: 14
    },
    primaryButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 12
    },
    buttonDisabled: {
        backgroundColor: '#334155'
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1
    },
    secondaryButton: {
        backgroundColor: '#334155',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 16,
        alignItems: 'center'
    },
    secondaryButtonText: {
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: '800'
    },
    errorBanner: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
    },
    errorText: {
        color: '#FCA5A5',
        fontSize: 12,
        fontWeight: '600'
    },
    successBanner: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.4)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
    },
    successText: {
        color: '#86EFAC',
        fontSize: 12,
        fontWeight: '600'
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 24
    },
    alertCard: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F59E0B'
    },
    alertIcon: {
        fontSize: 48,
        marginBottom: 12
    },
    alertTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#F59E0B',
        marginBottom: 8
    },
    alertMessage: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 6
    },
    alertSubtext: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center'
    },
    votingHeader: {
        marginBottom: 20
    },
    partyGrid: {
        gap: 14,
        marginBottom: 24
    },
    partyCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#334155'
    },
    partyCardSelected: {
        borderColor: '#2563EB',
        backgroundColor: '#1E293B'
    },
    partyCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    partyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#F8FAFC'
    },
    partyTitleSelected: {
        color: '#60A5FA'
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#64748B',
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioSelected: {
        borderColor: '#2563EB',
        backgroundColor: '#2563EB'
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFFFFF'
    },
    successCard: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#22C55E'
    },
    checkIcon: {
        fontSize: 48,
        marginBottom: 12
    },
    confirmTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#22C55E',
        marginBottom: 4,
        textAlign: 'center'
    },
    confirmSubtitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center'
    },
    confirmNote: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20
    }
});
