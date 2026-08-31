import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentApi } from '../services/api';

export default function PrivacyPolicyScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const res = await contentApi.getPrivacyPolicy();
      if (res.data && res.data.privacy_policy) {
        setContent(res.data.privacy_policy);
      } else {
        setContent(fallbackPrivacyPolicy);
      }
    } catch (err) {
      console.warn('Could not fetch privacy policy from server, using local fallback:', err);
      setContent(fallbackPrivacyPolicy);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format/render paragraphs nicely with headers
  const renderPolicyText = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Document title
      if (trimmed === 'VINUH — PRIVACY POLICY, USER DISCLAIMER & TERMS OF USE') {
        return (
          <Text key={idx} style={[styles.docTitle, { color: colors.text }]}>
            {trimmed}
          </Text>
        );
      }
      
      // Main headers (e.g. "1. NATURE OF VINUH")
      const isHeader = /^\d+\.\s+[A-Z\s]+$/.test(trimmed);
      if (isHeader) {
        return (
          <Text key={idx} style={[styles.sectionHeader, { color: colors.primary }]}>
            {trimmed}
          </Text>
        );
      }
      
      // Subtitles or bold sections
      if (trimmed.startsWith('Effective Date:') || trimmed.startsWith('Last Updated:')) {
        return (
          <Text key={idx} style={[styles.metaText, { color: colors.textSecondary }]}>
            {trimmed}
          </Text>
        );
      }
      
      // Bullet points
      if (trimmed.startsWith('*')) {
        return (
          <View key={idx} style={styles.bulletRow}>
            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
            <Text style={[styles.bulletText, { color: colors.text }]}>
              {trimmed.substring(1).trim()}
            </Text>
          </View>
        );
      }
      
      // Standard paragraph
      if (trimmed.length > 0) {
        return (
          <Text key={idx} style={[styles.paragraph, { color: colors.text }]}>
            {trimmed}
          </Text>
        );
      }
      
      // Empty line / spacer
      return <View key={idx} style={{ height: 10 }} />;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colors.chip }]} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Terms</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 10, color: colors.textSecondary }}>Loading policy...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderPolicyText(content)}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  docTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 30,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
    opacity: 0.9,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 10,
  },
  bulletPoint: {
    fontSize: 16,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
});

const fallbackPrivacyPolicy = `VINUH — PRIVACY POLICY, USER DISCLAIMER & TERMS OF USE

Effective Date: 26/08/2026

Vinuh (“Vinuh”, “we”, “us”, “our”) is an educational micro-learning platform operated by ( Vertical seed studios Pvt ltd.,], having its registered office at 303, Divyashakthi Bhavan, Srinivasa Nagar west, Ameerpet, Hyderabad-500038 .
This Privacy Policy, User Disclaimer and Terms of Use (“Policy”) explains how Vinuh collects, uses, stores and protects information, and the terms under which users access and use the Vinuh application, website and related services (“Services”).

By registering, accessing or using Vinuh, you acknowledge that you have read and understood this Policy and agree to the applicable Terms of Use. If you do not agree, please do not use the Services.

1. NATURE OF VINUH

Vinuh provides short-form educational and learning content, including audio lessons, videos, study materials, learning resources, assessments, recommendations, career-related information and other educational content.

Vinuh is intended as a supplementary learning platform and does not replace a school, college, teacher, tutor, educational institution, professional adviser or officially prescribed curriculum.

Content may be updated, modified, corrected, replaced or removed at any time.

2. INFORMATION WE MAY COLLECT

Depending on the features used, Vinuh may collect:
* Name or display name;
* Mobile number and/or email address;
* Age or age category and educational level/class;
* Login and authentication information;
* Subscription and transaction-related information;
* Learning activity, course selections, lesson completion and progress;
* Device, application and technical information reasonably required to operate, secure and improve the Services;
* Customer-support communications and information voluntarily provided by the user;
* Notification and communication preferences.

Vinuh will seek to collect only information reasonably necessary for providing, securing, improving and administering the Services.

Payment card, banking or other financial credentials may be processed by authorised payment providers or applicable app-store billing systems. Vinuh does not ordinarily require or store complete payment-card credentials.

3. HOW WE USE INFORMATION

We may use information to:
* Create and manage user accounts;
* Provide educational content and Services;
* Maintain learning progress and preferences;
* Process subscriptions and payments;
* Provide customer support;
* Send essential service-related communications;
* Improve content, functionality, performance and user experience;
* Detect, prevent and investigate fraud, misuse, security incidents and unauthorised activity;
* Maintain technical, operational and security records;
* Comply with applicable laws, regulations, court orders and lawful governmental requests;
* Exercise or defend the Company’s legal rights;
* Provide personalised learning recommendations where such processing is permitted and appropriately disclosed.

We will not use personal data for purposes materially different from those disclosed to the user without an appropriate legal basis, notice or consent where required.

4. OPTIONAL COMMUNICATIONS

Users may receive essential communications relating to their account, subscription, security or Services.

Promotional communications, marketing messages and optional learning reminders may be controlled through available preferences or communication settings, subject to applicable law and technical limitations.

Withdrawal from optional marketing communications will not affect the user’s ability to use the core Services.

5. CHILDREN AND STUDENTS

Vinuh may be used by school and college students.

Where applicable law requires parental or lawful-guardian consent before processing a child’s personal data, Vinuh will implement an appropriate consent or verification mechanism.

Vinuh does not knowingly seek to exploit children’s personal data, use children’s information for inappropriate purposes, or expose children to content or practices prohibited by applicable law.

Where legally applicable, Vinuh will take appropriate measures concerning parental consent, children’s data, behavioural monitoring, targeted advertising and other child-specific requirements.

Parents or lawful guardians who believe that a child’s personal data has been provided to Vinuh without appropriate authorisation may contact us using the details provided below.

6. SHARING OF INFORMATION

Vinuh does not sell personal or sensitive user data.

Information may be shared with trusted service providers strictly as reasonably necessary to operate the Services, including providers for:
* Cloud hosting and storage;
* Authentication and OTP services;
* Payment and subscription processing;
* Analytics and performance monitoring;
* Customer support;
* Notifications and communications;
* Security, fraud prevention and technical infrastructure.

Such providers may process information on behalf of Vinuh and are expected to maintain appropriate confidentiality and security.

Information may also be disclosed where reasonably necessary to comply with applicable law, lawful governmental or regulatory requests, court orders, protect users or the public, investigate fraud or security incidents, enforce our Terms, or protect the Company’s legal rights.

In the event of a merger, acquisition, restructuring, financing, sale of assets or similar corporate transaction, relevant information may be transferred subject to applicable law and appropriate safeguards.

7. THIRD-PARTY SERVICES AND LINKS

Vinuh may use or integrate third-party technologies, software development kits, payment services, analytics tools, authentication providers, hosting providers and other external services.

Third-party services may have their own privacy policies and terms. Vinuh is not responsible for independent privacy practices, content, security or policies of third parties beyond the Company’s reasonable control.

Users should review the relevant third-party terms where applicable.

8. EDUCATIONAL DISCLAIMER

Vinuh makes reasonable efforts to provide useful, accurate and educational content. However:
* Educational content may contain errors, omissions, outdated information or differences of interpretation;
* Content may be prepared by teachers, subject experts, contributors, editors or technology-assisted systems;
* Vinuh does not guarantee that every lesson, answer, explanation or recommendation is error-free or suitable for every learner;
* Examination patterns, syllabi, regulations, career information and educational requirements may change;
* Users should verify important academic, examination, admission, financial, career or other consequential information from authoritative sources.

Vinuh shall not be responsible for academic results, examination scores, admissions, employment outcomes, career decisions or other consequences arising solely from reliance on content available through the Services.

9. AI-ASSISTED OR TECHNOLOGY-ASSISTED CONTENT

Where technology, automation or artificial intelligence is used in creating, processing, translating, recommending or presenting educational material, such output may contain inaccuracies or unintended errors.

AI-assisted content is provided for educational and informational purposes and should be independently verified where accuracy is important.

Vinuh does not represent that AI-assisted material is equivalent to professional human advice or officially issued educational material.

10. AVAILABILITY OF SERVICES

Vinuh aims to provide reliable and continuous access but does not guarantee that the Services will always be available, uninterrupted, secure or error-free.

Services may occasionally be suspended, restricted or modified due to maintenance, technical problems, upgrades, security issues, third-party service failures, internet/network problems, force majeure events or other circumstances beyond reasonable control.

Vinuh may add, modify, suspend or discontinue features or content at any time.

11. USER RESPONSIBILITIES

Users agree to:
* Provide reasonably accurate information;
* Keep account credentials confidential;
* Not share, copy, reproduce, redistribute, commercially exploit or unlawfully record Vinuh content;
* Not attempt to bypass security, subscription restrictions or access controls;
* Not reverse engineer, interfere with or misuse the application or Services;
* Not upload or transmit unlawful, harmful, abusive or infringing material;
* Use the Services only for lawful purposes.

The Company may restrict or terminate accounts involved in serious misuse, fraud, unlawful activity, infringement, security abuse or violation of these Terms.

12. INTELLECTUAL PROPERTY

All Vinuh software, branding, logos, names, interface elements, original audio/video content, text, graphics, designs, compilations and other proprietary material are owned by or licensed to the Company unless expressly stated otherwise.

Access to Vinuh does not transfer ownership or intellectual-property rights to the user.

Users receive a limited, personal, non-exclusive, non-transferable and revocable right to access the Services for permitted purposes.

Unauthorised copying, recording, reproduction, distribution, commercialisation or public exploitation may result in suspension, termination and/or legal action.

13. SUBSCRIPTIONS AND PAYMENTS

Where Vinuh offers paid subscriptions:
* Prices, duration and features will be displayed before purchase;
* Payment may be processed through the applicable app-store/payment-provider billing systems;
* Subscription renewal and cancellation will be governed by the applicable billing platform’s rules;
* Users are responsible for reviewing subscription terms before purchase;
* Refunds, where applicable, will be governed by the applicable app-store/payment-provider policies and applicable law;
* Deleting the Vinuh application does not necessarily cancel an active subscription.

14. REFUNDS

Unless otherwise required by applicable law, refunds for purchases made through Google Play, Apple App Store or another payment platform may be subject to that platform’s refund policies and procedures.

Where payment is processed directly by Vinuh or its authorised payment provider, refund requests will be handled in accordance with the applicable published refund policy and law.

15. DATA SECURITY

Vinuh will take reasonable technical and organisational measures designed to protect personal data against unauthorised access, loss, misuse, alteration, disclosure or destruction.

However, no internet service, application, server, transmission or storage system can be guaranteed to be completely secure.

Users acknowledge that they use internet-based Services at their own risk and should maintain appropriate security on their devices and accounts.

16. DATA RETENTION

Vinuh will retain personal data only for as long as reasonably necessary for the purposes for which it was collected, to provide the Services, maintain legitimate business and security records, resolve disputes, comply with legal obligations, prevent fraud or enforce agreements.

When personal data is no longer required, it may be deleted, anonymised or securely disposed of in accordance with applicable law and our retention practices.

Certain information may need to be retained for legitimate legal, accounting, security, fraud-prevention or regulatory purposes even after an account is closed.

17. USER RIGHTS AND DATA REQUESTS

Subject to applicable law, users may have rights relating to their personal data, including rights to:
* Access or obtain information about processing;
* Correct or update inaccurate information;
* Withdraw consent where processing is based on consent;
* Request deletion of personal data where legally applicable;
* Raise privacy-related grievances;
* Exercise other rights available under applicable data-protection law.

Requests may be submitted through [PRIVACY EMAIL / WEBSITE LINK].

Vinuh may need to verify the identity or authority of the requester before processing a request.

18. ACCOUNT DELETION

Users may request deletion of their Vinuh account through:
In-app: Profile → Settings → Delete Account
Web: [ACCOUNT DELETION URL]

Upon a valid deletion request, Vinuh will delete or anonymise associated personal data as required by applicable law and its retention obligations.

Certain information may be retained where required or permitted for legal compliance, security, fraud prevention, dispute resolution, accounting or other legitimate purposes.

19. PRIVACY CONTACT / GRIEVANCES

For privacy questions, complaints, requests or concerns, contact:
Privacy Contact: [NAME / DESIGNATION]
Email: [PRIVACY EMAIL]
Company: [LEGAL COMPANY NAME]
Address: [REGISTERED OFFICE ADDRESS]

We will endeavour to respond to privacy-related requests within the period prescribed by applicable law.

20. LIMITATION OF LIABILITY

To the maximum extent permitted by applicable law, Vinuh and the Company shall not be liable for indirect, incidental, consequential, special or unforeseeable losses arising from use of or inability to use the Services.

The Company does not guarantee educational, academic, examination, employment, financial or career outcomes from use of Vinuh.

Nothing in this Policy is intended to exclude or limit liability that cannot lawfully be excluded or limited under applicable law.

21. INDEMNITY

To the maximum extent permitted by applicable law, users agree to indemnify and hold harmless the Company, its directors, officers, employees, contractors, licensors and service providers from claims, losses, liabilities, damages, costs or expenses arising from the user’s unlawful use of the Services, violation of these Terms, infringement of third-party rights, fraud, misuse or breach of applicable law.

22. CHANGES TO THIS POLICY

Vinuh may update this Policy from time to time to reflect changes in the Services, technology, law, regulatory requirements or business practices.

The updated version will be made available through the Vinuh application and/or website with the revised effective date.

Where applicable law requires renewed notice or consent for a material change, Vinuh will provide such notice or obtain such consent.

23. GOVERNING LAW

This Policy shall be governed by the laws of India.

Subject to applicable law, disputes relating to the Services shall be subject to the jurisdiction of the courts at [HYDERABAD, TELANGANA], unless another jurisdiction is mandatorily prescribed by applicable law.

24. ACCEPTANCE

By creating an account, accessing or using Vinuh, the user confirms that they have read and understood this Policy and agree to the applicable Terms of Use.

If the user does not agree with the applicable terms or privacy practices, they should discontinue use of the Services.

⸻

QUICK PRIVACY NOTICE

What we collect: Account, contact, subscription, learning-progress and necessary technical information.

Why: To provide Vinuh, manage accounts and subscriptions, improve the learning experience, maintain security and comply with law.

Who we share with: Only relevant service providers and other parties where reasonably necessary, legally required or otherwise permitted.

Do we sell personal data? No.

Can you delete your account? Yes, subject to legally permitted retention requirements.

Privacy contact: [EMAIL]

Full Privacy Policy: Available in the Vinuh app and at [vinuh.in]

Last Updated: 26/08/2026`;
