import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { UserProfile } from '../../types';

const styles = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 30,
        paddingLeft: 35,
        paddingRight: 35,
        fontFamily: 'Times-Roman',
        fontSize: 10,
        lineHeight: 1.3,
        color: '#111827',
    },
    header: {
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#111827',
        paddingBottom: 10,
        marginBottom: 12,
    },
    name: {
        fontSize: 22,
        fontFamily: 'Times-Bold',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 6,
    },
    contactLine: {
        fontSize: 9,
        color: '#374151',
        textAlign: 'center',
    },
    section: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: 'Times-Bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        borderBottomWidth: 1,
        borderBottomColor: '#9ca3af',
        paddingBottom: 2,
        marginBottom: 6,
    },
    text: {
        fontSize: 9,
        color: '#1f2937',
        lineHeight: 1.4,
    },
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    skillTag: {
        fontSize: 8,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
        padding: '2 6',
        color: '#374151',
    },
    experienceItem: {
        marginBottom: 8,
    },
    expHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    expRole: {
        fontSize: 10,
        fontFamily: 'Times-Bold',
    },
    expDate: {
        fontSize: 8,
        color: '#4b5563',
        fontFamily: 'Times-Italic',
    },
    expCompany: {
        fontSize: 9,
        fontFamily: 'Times-Italic',
        color: '#374151',
        marginBottom: 3,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 2,
        marginLeft: 10,
    },
    bullet: {
        width: 8,
        fontSize: 9,
    },
    bulletText: {
        flex: 1,
        fontSize: 9,
        color: '#1f2937',
        lineHeight: 1.3,
    },
    educationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    eduInstitution: {
        fontSize: 9,
        fontFamily: 'Times-Bold',
    },
    eduDegree: {
        fontSize: 9,
        color: '#4b5563',
        fontFamily: 'Times-Italic',
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

const ProfessionalClassicPDF: React.FC<Props> = ({ data, slug }) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portfolioUrl = slug ? `${origin}/p/${slug}` : null;

    // Build links array for clickable rendering
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
                    <Text style={styles.name}>{data.fullName}</Text>
                    {/* Contact info line */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
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
                            <View key={exp.id} style={styles.experienceItem} wrap={false}>
                                <View style={styles.expHeader}>
                                    <Text style={styles.expRole}>{exp.role}</Text>
                                    <Text style={styles.expDate}>{exp.startDate} – {exp.endDate}</Text>
                                </View>
                                <Text style={styles.expCompany}>{exp.company}</Text>
                                {exp.description?.map((point, idx) => (
                                    <View key={idx} style={styles.bulletItem} wrap={false}>
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
                        <Text style={styles.sectionTitle}>Additional Experience</Text>
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
