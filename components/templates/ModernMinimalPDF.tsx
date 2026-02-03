import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { UserProfile } from '../../types';

const styles = StyleSheet.create({
    page: {
        paddingTop: 40,
        paddingBottom: 40,
        paddingLeft: 40,
        paddingRight: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.4,
        color: '#1f2937',
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb',
        paddingBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
        paddingLeft: 12,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    name: {
        fontSize: 26,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: -0.5,
        color: '#111827',
    },
    contactText: {
        fontSize: 9,
        color: '#4b5563',
        textAlign: 'right',
        marginBottom: 1,
    },
    linkText: {
        fontSize: 9,
        color: '#2563eb',
        textAlign: 'right',
        marginBottom: 1,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: '#2563eb',
        marginBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb',
        paddingBottom: 4,
    },
    summaryText: {
        fontSize: 9,
        color: '#4b5563',
        lineHeight: 1.5,
    },
    twoColumn: {
        flexDirection: 'row',
    },
    leftColumn: {
        width: '30%',
        paddingRight: 20,
    },
    rightColumn: {
        width: '70%',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    skillTag: {
        fontSize: 8,
        backgroundColor: '#f3f4f6',
        color: '#374151',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 3,
        marginRight: 4,
        marginBottom: 4,
    },
    experienceItem: {
        marginBottom: 12,
        paddingLeft: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#dbeafe',
    },
    expHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 2,
    },
    expRole: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        flex: 1,
    },
    expDate: {
        fontSize: 8,
        color: '#6b7280',
    },
    expCompany: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#4b5563',
        marginBottom: 4,
    },
    bulletContainer: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    bullet: {
        width: 10,
        fontSize: 9,
        color: '#2563eb',
    },
    bulletText: {
        flex: 1,
        fontSize: 9,
        color: '#374151',
        lineHeight: 1.4,
    },
    educationItem: {
        marginBottom: 8,
    },
    eduInstitution: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
    },
    eduDegree: {
        fontSize: 8,
        color: '#4b5563',
    },
    eduYear: {
        fontSize: 8,
        color: '#9ca3af',
    },
});

interface Props {
    data: UserProfile;
    slug?: string;
}

// Helper to build contact string
const buildContactString = (data: UserProfile): string => {
    const parts: string[] = [];
    if (data.location) parts.push(data.location);
    if (data.email) parts.push(data.email);
    if (data.phone) parts.push(data.phone);
    return parts.join('  ·  ');
};

// Helper to build links array - ensures URLs have protocol for clickability
const buildLinksArray = (data: UserProfile, portfolioUrl: string | null): { url: string; label: string }[] => {
    const links: { url: string; label: string }[] = [];
    if (portfolioUrl) {
        links.push({ url: portfolioUrl, label: portfolioUrl.replace(/^https?:\/\//, '') });
    }
    if (data.links) {
        data.links.forEach(link => {
            // Ensure URL has protocol
            let url = link.url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            links.push({
                url: url,
                label: link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')
            });
        });
    }
    return links;
};


const ModernMinimalPDF: React.FC<Props> = ({ data, slug }) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portfolioUrl = slug ? `${origin}/p/${slug}` : null;

    const contactString = buildContactString(data);
    const linksArray = buildLinksArray(data, portfolioUrl);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header - Two Column Layout */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.name}>{data.fullName}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        {data.email && (
                            <Link src={`mailto:${data.email}`} style={{ textDecoration: 'none' }}>
                                <Text style={styles.contactText}>{data.email}</Text>
                            </Link>
                        )}
                        {data.phone && (
                            <Link src={`tel:${data.phone.replace(/\D/g, '')}`} style={{ textDecoration: 'none' }}>
                                <Text style={styles.contactText}>{data.phone}</Text>
                            </Link>
                        )}
                        {data.location && <Text style={styles.contactText}>{data.location}</Text>}
                        {linksArray.map((link, i) => (
                            <Link key={i} src={link.url} style={{ textDecoration: 'none' }}>
                                <Text style={styles.linkText}>{link.label}</Text>
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
                                    <View key={exp.id} style={styles.experienceItem} wrap={false}>
                                        <View style={styles.expHeader}>
                                            <Text style={styles.expRole}>{exp.role}</Text>
                                            <Text style={styles.expDate}>{exp.startDate} – {exp.endDate}</Text>
                                        </View>
                                        <Text style={styles.expCompany}>{exp.company}</Text>
                                        {exp.description?.map((point, idx) => (
                                            <View key={idx} style={styles.bulletContainer}>
                                                <Text style={styles.bullet}>•</Text>
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
                                    <View key={exp.id} style={styles.experienceItem} wrap={false}>
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
