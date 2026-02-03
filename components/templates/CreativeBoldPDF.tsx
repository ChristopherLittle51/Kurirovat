import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { UserProfile } from '../../types';

const styles = StyleSheet.create({
    page: {
        paddingTop: 0,
        paddingBottom: 30,
        paddingLeft: 0,
        paddingRight: 0,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.4,
        color: '#111827',
    },
    // Header with gradient-like effect using solid indigo
    header: {
        backgroundColor: '#4f46e5',
        paddingTop: 30,
        paddingBottom: 25,
        paddingLeft: 35,
        paddingRight: 35,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    name: {
        fontSize: 28,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    contactText: {
        fontSize: 9,
        color: '#c7d2fe',
        marginBottom: 3,
    },
    linkText: {
        fontSize: 9,
        color: '#ffffff',
        marginBottom: 3,
    },
    // Body content
    body: {
        paddingTop: 20,
        paddingLeft: 35,
        paddingRight: 35,
    },
    section: {
        marginBottom: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#4f46e5',
        paddingLeft: 10,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    text: {
        fontSize: 10,
        color: '#4b5563',
        lineHeight: 1.5,
        paddingLeft: 14,
    },
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        paddingLeft: 14,
    },
    skillTag: {
        fontSize: 9,
        backgroundColor: '#f5f3ff',
        borderWidth: 1,
        borderColor: '#c4b5fd',
        padding: '4 10',
        borderRadius: 4,
        color: '#4f46e5',
        fontFamily: 'Helvetica-Bold',
    },
    experienceCard: {
        backgroundColor: '#f9fafb',
        padding: 14,
        borderRadius: 8,
        marginBottom: 10,
        marginLeft: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    expHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    expRole: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
    },
    expDate: {
        fontSize: 8,
        backgroundColor: '#e0e7ff',
        color: '#4f46e5',
        padding: '3 8',
        borderRadius: 4,
        fontFamily: 'Helvetica-Bold',
    },
    expCompany: {
        fontSize: 10,
        color: '#4f46e5',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 6,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    bullet: {
        width: 10,
        fontSize: 9,
        color: '#818cf8',
    },
    bulletText: {
        flex: 1,
        fontSize: 9,
        color: '#374151',
        lineHeight: 1.4,
    },
    educationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 14,
        marginBottom: 6,
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
        fontSize: 9,
        color: '#4f46e5',
        fontFamily: 'Helvetica-Bold',
    },
});

interface Props {
    data: UserProfile;
    slug?: string;
}

// Helper to ensure URL has protocol
const ensureProtocol = (url: string): string => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
};

const CreativeBoldPDF: React.FC<Props> = ({ data, slug }) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portfolioUrl = slug ? `${origin}/p/${slug}` : null;

    // Build links array
    const linksArray: { url: string; label: string }[] = [];
    if (portfolioUrl) {
        linksArray.push({ url: portfolioUrl, label: portfolioUrl.replace(/^https?:\/\//, '') });
    }
    if (data.links) {
        data.links.forEach(link => {
            linksArray.push({
                url: ensureProtocol(link.url),
                label: link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')
            });
        });
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.name}>{data.fullName}</Text>
                        </View>
                        <View style={styles.headerRight}>
                            {data.email && (
                                <Link src={`mailto:${data.email}`}>
                                    <Text style={styles.contactText}>{data.email}</Text>
                                </Link>
                            )}
                            {data.phone && (
                                <Link src={`tel:${data.phone.replace(/\D/g, '')}`}>
                                    <Text style={styles.contactText}>{data.phone}</Text>
                                </Link>
                            )}
                            {data.location && <Text style={styles.contactText}>{data.location}</Text>}
                            {linksArray.map((link, i) => (
                                <Link key={i} src={link.url}>
                                    <Text style={styles.linkText}>{link.label}</Text>
                                </Link>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.body}>
                    {/* Summary */}
                    {data.summary && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>About Me</Text>
                            </View>
                            <Text style={styles.text}>{data.summary}</Text>
                        </View>
                    )}

                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Skills</Text>
                            </View>
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
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Experience</Text>
                            </View>
                            {data.experience.map((exp) => (
                                <View key={exp.id} style={styles.experienceCard} wrap={false}>
                                    <View style={styles.expHeader}>
                                        <Text style={styles.expRole}>{exp.role}</Text>
                                        <Text style={styles.expDate}>{exp.startDate} – {exp.endDate}</Text>
                                    </View>
                                    <Text style={styles.expCompany}>{exp.company}</Text>
                                    {exp.description?.map((point, idx) => (
                                        <View key={idx} style={styles.bulletItem} wrap={false}>
                                            <Text style={styles.bullet}>▸</Text>
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
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Other Experience</Text>
                            </View>
                            {data.otherExperience.map((exp) => (
                                <View key={exp.id} style={styles.educationItem} wrap={false}>
                                    <View>
                                        <Text style={styles.eduInstitution}>{exp.role}</Text>
                                        <Text style={styles.eduDegree}>{exp.company}</Text>
                                    </View>
                                    <Text style={styles.eduYear}>{exp.startDate} – {exp.endDate}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Education</Text>
                            </View>
                            {data.education.map((edu) => (
                                <View key={edu.id} style={styles.educationItem}>
                                    <View>
                                        <Text style={styles.eduInstitution}>{edu.institution}</Text>
                                        <Text style={styles.eduDegree}>{edu.degree}</Text>
                                    </View>
                                    <Text style={styles.eduYear}>{edu.year}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    );
};

export default CreativeBoldPDF;
