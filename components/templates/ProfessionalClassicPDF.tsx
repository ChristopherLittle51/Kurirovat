import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { UserProfile } from '../../types';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Times-Roman',
        fontSize: 10,
        lineHeight: 1.4,
        color: '#111827',
    },
    header: {
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#1f2937',
        paddingBottom: 16,
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontFamily: 'Times-Bold',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 8,
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        fontSize: 9,
        color: '#4b5563',
    },
    link: {
        color: '#1d4ed8',
        textDecoration: 'none',
    },
    section: {
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: 'Times-Bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
        paddingBottom: 3,
        marginBottom: 8,
    },
    text: {
        fontSize: 10,
        color: '#374151',
        lineHeight: 1.5,
    },
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    skillTag: {
        fontSize: 8,
        backgroundColor: '#f3f4f6',
        border: 1,
        borderColor: '#e5e7eb',
        padding: '3 6',
        borderRadius: 2,
        color: '#1f2937',
    },
    experienceItem: {
        marginBottom: 10,
    },
    expHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    expRole: {
        fontSize: 11,
        fontFamily: 'Times-Bold',
    },
    expDate: {
        fontSize: 8,
        color: '#6b7280',
        fontFamily: 'Times-Bold',
    },
    expCompany: {
        fontSize: 10,
        fontFamily: 'Times-Bold',
        color: '#374151',
        marginBottom: 4,
    },
    bulletList: {
        marginLeft: 12,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    bullet: {
        width: 8,
        fontSize: 10,
        color: '#374151',
    },
    bulletText: {
        flex: 1,
        fontSize: 10,
        color: '#374151',
    },
    educationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    eduInstitution: {
        fontSize: 10,
        fontFamily: 'Times-Bold',
    },
    eduDegree: {
        fontSize: 10,
        color: '#4b5563',
    },
});

interface Props {
    data: UserProfile;
    slug?: string;
}

const ProfessionalClassicPDF: React.FC<Props> = ({ data, slug }) => {
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
                            <Link src={portfolioUrl} style={styles.link}>• {portfolioDisplay}</Link>
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
                        <Text style={styles.sectionTitle}>Professional Summary</Text>
                        <Text style={styles.text}>{data.summary}</Text>
                    </View>
                )}

                {/* Skills */}
                {data.skills && data.skills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Core Competencies</Text>
                        <View style={styles.skillsRow}>
                            {data.skills.map((skill, index) => (
                                <View key={index} style={styles.skillTag}>
                                    <Text>{skill}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Experience</Text>
                        {data.experience.map((exp) => (
                            <View key={exp.id} style={styles.experienceItem}>
                                <View style={styles.expHeader}>
                                    <Text style={styles.expRole}>{exp.role}</Text>
                                    <Text style={styles.expDate}>{exp.startDate} – {exp.endDate}</Text>
                                </View>
                                <Text style={styles.expCompany}>{exp.company}</Text>
                                <View style={styles.bulletList}>
                                    {exp.description?.map((point, idx) => (
                                        <View key={idx} style={styles.bulletItem}>
                                            <Text style={styles.bullet}>•</Text>
                                            <Text style={styles.bulletText}>{point}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Other Experience */}
                {data.otherExperience && data.otherExperience.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Experience</Text>
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

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Education</Text>
                        {data.education.map((edu) => (
                            <View key={edu.id} style={styles.educationItem}>
                                <View>
                                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                                    <Text style={styles.eduDegree}>{edu.degree}</Text>
                                </View>
                                <Text style={styles.expDate}>{edu.year}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default ProfessionalClassicPDF;
