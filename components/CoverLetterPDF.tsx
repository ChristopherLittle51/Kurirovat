import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { UserProfile, JobDescription } from '../types';

const styles = StyleSheet.create({
    page: {
        paddingTop: 40,
        paddingBottom: 40,
        paddingLeft: 40,
        paddingRight: 40,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.5,
        color: '#1f2937',
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 20,
    },
    name: {
        fontSize: 24,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    contactInfo: {
        flexDirection: 'column',
        gap: 2,
    },
    contactText: {
        fontSize: 10,
        color: '#4b5563',
    },
    date: {
        fontSize: 10,
        color: '#4b5563',
        marginBottom: 20,
    },
    recipientBlock: {
        marginBottom: 20,
    },
    recipientName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        marginBottom: 2,
    },
    recipientCompany: {
        fontSize: 11,
        color: '#374151',
    },
    content: {
        fontSize: 11,
        color: '#374151',
        lineHeight: 1.6,
        marginBottom: 30,
        fontFamily: 'Times-Roman',
    },
    signOff: {
        marginTop: 20,
    },
    signOffText: {
        fontSize: 11,
        color: '#374151',
        marginBottom: 30,
    },
    signatureName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
    }
});

interface Props {
    resume: UserProfile;
    jobDescription: JobDescription;
    coverLetterContent: string;
}

const CoverLetterPDF: React.FC<Props> = ({ resume, jobDescription, coverLetterContent }) => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Sanitize phone number for link
    const phoneLink = resume.phone ? `tel:${resume.phone.replace(/\D/g, '')}` : undefined;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{resume.fullName}</Text>
                    <View style={styles.contactInfo}>
                        {resume.location && <Text style={styles.contactText}>{resume.location}</Text>}
                        {resume.email && (
                            <Link src={`mailto:${resume.email}`} style={{ textDecoration: 'none' }}>
                                <Text style={styles.contactText}>{resume.email}</Text>
                            </Link>
                        )}
                        {resume.phone && (
                            <Link src={phoneLink} style={{ textDecoration: 'none' }}>
                                <Text style={styles.contactText}>{resume.phone}</Text>
                            </Link>
                        )}
                        {resume.links && resume.links.length > 0 && (
                            <Link src={resume.links[0].url} style={{ textDecoration: 'none' }}>
                                <Text style={styles.contactText}>{resume.links[0].url}</Text>
                            </Link>
                        )}
                    </View>
                </View>

                {/* Date */}
                <Text style={styles.date}>{today}</Text>

                {/* Recipient */}
                <View style={styles.recipientBlock}>
                    <Text style={styles.recipientName}>Hiring Manager</Text>
                    <Text style={styles.recipientCompany}>{jobDescription.companyName}</Text>
                </View>

                {/* Body Content */}
                <View style={styles.content}>
                    <Text>{coverLetterContent}</Text>
                </View>

                {/* Sign-off */}
                <View style={styles.signOff}>
                    <Text style={styles.signOffText}>Sincerely,</Text>
                    <Text style={styles.signatureName}>{resume.fullName}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default CoverLetterPDF;
