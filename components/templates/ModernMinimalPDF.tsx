import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { UserProfile } from '../../types';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.5,
        color: '#1f2937',
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 24,
    },
    name: {
        fontSize: 28,
        fontWeight: 'light',
        letterSpacing: 1,
        marginBottom: 8,
        color: '#111827',
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 9,
        color: '#6b7280',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    link: {
        color: '#2563eb',
        textDecoration: 'none',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        color: '#2563eb',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 10,
        color: '#4b5563',
        lineHeight: 1.6,
    },
    twoColumn: {
        flexDirection: 'row',
        gap: 24,
    },
    leftColumn: {
        width: '30%',
    },
    rightColumn: {
        width: '70%',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    skillTag: {
        fontSize: 8,
        backgroundColor: '#f3f4f6',
        color: '#374151',
        padding: '3 8',
        borderRadius: 3,
    },
    educationItem: {
        marginBottom: 8,
    },
    eduInstitution: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
    },
    eduDegree: {
        fontSize: 9,
        color: '#4b5563',
    },
    eduYear: {
        fontSize: 8,
        color: '#9ca3af',
    },
    experienceItem: {
        marginBottom: 12,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: '#e5e7eb',
    },
    expHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    expRole: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
    },
    expDate: {
        fontSize: 8,
        color: '#9ca3af',
    },
    expCompany: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#4b5563',
        marginBottom: 4,
    },
    bulletContainer: {
        flexDirection: 'row',
        marginBottom: 2,
        paddingLeft: 4,
    },
    bullet: {
        width: 8,
        fontSize: 6,
        color: '#93c5fd',
    },
    bulletText: {
        flex: 1,
        fontSize: 9,
        color: '#4b5563',
        lineHeight: 1.4,
    },
});

interface Props {
    data: UserProfile;
    slug?: string;
}

const ModernMinimalPDF: React.FC<Props> = ({ data, slug }) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portfolioUrl = slug ? `${origin}/p/${slug}` : null;
    const portfolioDisplay = portfolioUrl ? portfolioUrl.replace(/^https?:\/\//, '') : '';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{data.fullName}</Text>
                    <View style={styles.contactRow}>
                        {data.location && <Text>{data.location}</Text>}
                        {data.email && <Text>• {data.email}</Text>}
                        {data.phone && <Text>• {data.phone}</Text>}
                        {portfolioUrl && (
                            <Link src={portfolioUrl} style={styles.link}>
                                • {portfolioDisplay}
                            </Link>
                        )}
                        {data.links?.map((link, i) => (
                            <Link key={i} src={link.url} style={styles.link}>
                                • {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                            </Link>
                        ))}
                    </View>
                </View>

                {/* Summary */}
                {data.summary && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.summaryText}>{data.summary}</Text>
                    </View>
                )}

                {/* Two Column Layout */}
                <View style={styles.twoColumn}>
                    {/* Left Column */}
                    <View style={styles.leftColumn}>
                        {/* Skills */}
                        {data.skills && data.skills.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Skills</Text>
                                <View style={styles.skillsContainer}>
                                    {data.skills.map((skill, index) => (
                                        <View key={index} style={styles.skillTag}>
                                            <Text>{skill}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Education */}
                        {data.education && data.education.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Education</Text>
                                {data.education.map((edu) => (
                                    <View key={edu.id} style={styles.educationItem}>
                                        <Text style={styles.eduInstitution}>{edu.institution}</Text>
                                        <Text style={styles.eduDegree}>{edu.degree}</Text>
                                        <Text style={styles.eduYear}>{edu.year}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Right Column */}
                    <View style={styles.rightColumn}>
                        {/* Experience */}
                        {data.experience && data.experience.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Experience</Text>
                                {data.experience.map((exp) => (
                                    <View key={exp.id} style={styles.experienceItem}>
                                        <View style={styles.expHeader}>
                                            <Text style={styles.expRole}>{exp.role}</Text>
                                            <Text style={styles.expDate}>{exp.startDate} – {exp.endDate}</Text>
                                        </View>
                                        <Text style={styles.expCompany}>{exp.company}</Text>
                                        {exp.description?.map((point, idx) => (
                                            <View key={idx} style={styles.bulletContainer}>
                                                <Text style={styles.bullet}>●</Text>
                                                <Text style={styles.bulletText}>{point}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Other Experience */}
                        {data.otherExperience && data.otherExperience.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Other Experience</Text>
                                {data.otherExperience.map((exp) => (
                                    <View key={exp.id} style={styles.experienceItem}>
                                        <View style={styles.expHeader}>
                                            <Text style={styles.expRole}>{exp.role}</Text>
                                            <Text style={styles.expDate}>{exp.startDate} – {exp.endDate}</Text>
                                        </View>
                                        <Text style={styles.expCompany}>{exp.company}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default ModernMinimalPDF;
