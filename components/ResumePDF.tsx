import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { UserProfile } from '../types';

const styles = StyleSheet.create({
    page: {
        padding: 25, // Reduced padding
        fontFamily: 'Helvetica',
        fontSize: 10, // Base font size
        lineHeight: 1.4, // Slightly tighter line height
        color: '#111827',
    },
    header: {
        marginBottom: 15,
        borderBottomWidth: 1.5, // Thinner border
        borderBottomColor: '#1f2937',
        paddingBottom: 10,
    },
    name: {
        fontSize: 26, // Reduced from 30 to avoid overlap/too huge
        fontFamily: 'Times-Roman',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8, // Tighter gap
        color: '#4b5563',
        fontSize: 9,
        alignItems: 'center',
        marginTop: 4, // Explicit separation
    },
    link: {
        textDecoration: 'none',
        color: '#2563eb',
    },
    linkText: {
        color: '#111827', // text-gray-900 (for non-link items)
    },
    separator: {
        marginLeft: 2,
        marginRight: 2,
        color: '#9ca3af',
    },
    section: {
        marginBottom: 12, // Reduced from 18
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: 'Times-Bold',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
        marginBottom: 6,
        paddingBottom: 2,
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    text: {
        marginBottom: 2,
        fontSize: 10,
        color: '#374151',
    },
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4, // Tighter
    },
    skillTag: {
        backgroundColor: '#f3f4f6',
        padding: '2 6',
        borderRadius: 4,
        fontSize: 9,
        color: '#1f2937',
        fontWeight: 'medium',
    },
    experienceItem: {
        marginBottom: 8, // Reduced from 12
    },
    experienceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 1,
    },
    role: {
        fontSize: 11, // Standard readable size
        fontFamily: 'Helvetica-Bold',
        fontWeight: 'bold',
    },
    company: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#374151',
        marginBottom: 2,
    },
    date: {
        fontSize: 9,
        color: '#4b5563',
        fontWeight: 'medium',
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 1.5,
        paddingLeft: 4,
    },
    bullet: {
        width: 10,
        fontSize: 10,
        color: '#374151',
    },
    bulletText: {
        flex: 1,
        fontSize: 10,
        color: '#374151',
        lineHeight: 1.3,
    },
    educationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2
    }
});

interface ResumePDFProps {
    data: UserProfile;
    slug?: string;
}

const ResumePDF: React.FC<ResumePDFProps> = ({ data, slug }) => {
    // Construct portfolio URL if slug is provided
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Strip protocol for cleaner look in print
    const portfolioUrl = slug ? `${origin}/p/${slug}` : null;
    const portfolioDisplay = portfolioUrl ? portfolioUrl.replace(/^https?:\/\//, '') : '';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{data.fullName}</Text>
                    <View style={styles.contactRow}>
                        {data.location && (
                            <Text>{data.location}</Text>
                        )}

                        {data.email && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {data.location && <Text style={styles.separator}>•</Text>}
                                <Text>{data.email}</Text>
                            </View>
                        )}

                        {data.phone && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {(data.location || data.email) && <Text style={styles.separator}>•</Text>}
                                <Text>{data.phone}</Text>
                            </View>
                        )}

                        {portfolioUrl && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {(data.location || data.email || data.phone) && <Text style={styles.separator}>•</Text>}
                                <Link src={portfolioUrl} style={styles.link}>{portfolioDisplay}</Link>
                            </View>
                        )}

                        {data.links && data.links.map((link, i) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {/* Always add separator if there are previous items */}
                                <Text style={styles.separator}>•</Text>
                                <Link src={link.url} style={styles.link}>
                                    {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                </Link>
                            </View>
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
                        {data.experience.map((exp, index) => (
                            <View key={exp.id || index} style={styles.experienceItem}>
                                <View style={styles.experienceHeader}>
                                    <Text style={styles.role}>{exp.role}</Text>
                                    <Text style={styles.date}>{exp.startDate} – {exp.endDate}</Text>
                                </View>
                                <Text style={styles.company}>{exp.company}</Text>
                                {exp.description && exp.description.map((desc, i) => (
                                    <View key={i} style={styles.bulletPoint}>
                                        <Text style={styles.bullet}>•</Text>
                                        <Text style={styles.bulletText}>{desc}</Text>
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
                        {data.otherExperience.map((exp, index) => (
                            <View key={exp.id || index} style={styles.experienceItem}>
                                <View style={styles.experienceHeader}>
                                    <Text style={styles.role}>{exp.role}</Text>
                                    <Text style={styles.date}>{exp.startDate} – {exp.endDate}</Text>
                                </View>
                                <Text style={styles.company}>{exp.company}</Text>
                                {exp.description && exp.description.map((desc, i) => (
                                    <View key={i} style={styles.bulletPoint}>
                                        <Text style={styles.bullet}>•</Text>
                                        <Text style={styles.bulletText}>{desc}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Education</Text>
                        {data.education.map((edu, index) => (
                            <View key={edu.id || index} style={styles.educationItem}>
                                <View>
                                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11 }}>{edu.institution}</Text>
                                    <Text style={{ fontSize: 10, color: '#374151' }}>{edu.degree}</Text>
                                </View>
                                <Text style={styles.date}>{edu.year}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default ResumePDF;
