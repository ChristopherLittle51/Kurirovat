import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { UserProfile } from '../../types';

const styles = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 30,
        paddingLeft: 40,
        paddingRight: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.35,
        color: '#000000',
    },
    // --- Header ---
    header: {
        textAlign: 'center',
        marginBottom: 10,
    },
    name: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
        color: '#000000',
    },
    contactLine: {
        fontSize: 9,
        color: '#333333',
        textAlign: 'center',
        lineHeight: 1.4,
    },
    headerDivider: {
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
        marginTop: 8,
        marginBottom: 10,
    },
    // --- Sections ---
    section: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        borderBottomWidth: 1,
        borderBottomColor: '#666666',
        paddingBottom: 2,
        marginBottom: 5,
        color: '#000000',
    },
    // --- Summary ---
    summaryText: {
        fontSize: 9.5,
        color: '#222222',
        lineHeight: 1.4,
    },
    // --- Skills (comma-separated plain text) ---
    skillsText: {
        fontSize: 9.5,
        color: '#222222',
        lineHeight: 1.5,
    },
    // --- Experience ---
    experienceItem: {
        marginBottom: 7,
    },
    expHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    expRole: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#000000',
    },
    expDate: {
        fontSize: 9,
        color: '#333333',
    },
    expCompany: {
        fontSize: 9.5,
        color: '#333333',
        marginBottom: 3,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 2,
        marginLeft: 8,
    },
    bullet: {
        width: 8,
        fontSize: 9,
        color: '#333333',
    },
    bulletText: {
        flex: 1,
        fontSize: 9.5,
        color: '#222222',
        lineHeight: 1.35,
    },
    // --- Education ---
    educationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 3,
    },
    eduInstitution: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#000000',
    },
    eduDegree: {
        fontSize: 9.5,
        color: '#333333',
    },
    eduYear: {
        fontSize: 9,
        color: '#333333',
    },
});

interface Props {
    data: UserProfile;
    slug?: string;
}

const ensureProtocol = (url: string): string => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
};

const ATSOptimizedPDF: React.FC<Props> = ({ data, slug }) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portfolioUrl = slug ? `${origin}/p/${slug}` : null;

    // Build contact parts as pipe-separated line
    const contactParts: string[] = [];
    if (data.location) contactParts.push(data.location);

    // Build links for clickable rendering
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
                {/* Header — Name centered */}
                <View style={styles.header}>
                    <Text style={styles.name}>{data.fullName}</Text>

                    {/* Contact info: Location | Email | Phone */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {data.location && <Text style={styles.contactLine}>{data.location}</Text>}
                        {data.location && (data.email || data.phone) && <Text style={styles.contactLine}>  |  </Text>}
                        {data.email && (
                            <Link src={`mailto:${data.email}`}>
                                <Text style={styles.contactLine}>{data.email}</Text>
                            </Link>
                        )}
                        {data.email && data.phone && <Text style={styles.contactLine}>  |  </Text>}
                        {data.phone && (
                            <Link src={`tel:${data.phone.replace(/\D/g, '')}`}>
                                <Text style={styles.contactLine}>{data.phone}</Text>
                            </Link>
                        )}
                    </View>

                    {/* Links line */}
                    {linksArray.length > 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 2 }}>
                            {linksArray.map((link, i) => (
                                <View key={i} style={{ flexDirection: 'row' }}>
                                    <Link src={link.url}>
                                        <Text style={styles.contactLine}>{link.label}</Text>
                                    </Link>
                                    {i < linksArray.length - 1 && <Text style={styles.contactLine}>  |  </Text>}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Divider */}
                <View style={styles.headerDivider} />

                {/* Professional Summary */}
                {data.summary && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Summary</Text>
                        <Text style={styles.summaryText}>{data.summary}</Text>
                    </View>
                )}

                {/* Core Competencies — comma-separated plain text */}
                {data.skills && data.skills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Core Competencies</Text>
                        <Text style={styles.skillsText}>{data.skills.join('  |  ')}</Text>
                    </View>
                )}

                {/* Professional Experience */}
                {data.experience && data.experience.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Experience</Text>
                        {data.experience.map((exp) => (
                            <View key={exp.id} style={styles.experienceItem} wrap={false}>
                                <View style={styles.expHeader}>
                                    <Text style={styles.expRole}>{exp.role}</Text>
                                    <Text style={styles.expDate}>{exp.startDate} - {exp.endDate}</Text>
                                </View>
                                <Text style={styles.expCompany}>{exp.company}</Text>
                                {exp.description?.map((point, idx) => (
                                    <View key={idx} style={styles.bulletItem} wrap={false}>
                                        <Text style={styles.bullet}>-</Text>
                                        <Text style={styles.bulletText}>{point}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                )}

                {/* Additional Experience */}
                {data.otherExperience && data.otherExperience.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Experience</Text>
                        {data.otherExperience.map((exp) => (
                            <View key={exp.id} style={styles.experienceItem} wrap={false}>
                                <View style={styles.expHeader}>
                                    <Text style={styles.expRole}>{exp.role}</Text>
                                    <Text style={styles.expDate}>{exp.startDate} - {exp.endDate}</Text>
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
                                <Text style={styles.eduYear}>{edu.year}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default ATSOptimizedPDF;
