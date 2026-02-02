import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { UserProfile } from '../../types';

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.4,
        color: '#111827',
    },
    header: {
        backgroundColor: '#6366f1',
        padding: 35,
        color: '#ffffff',
    },
    name: {
        fontSize: 28,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 10,
        color: '#ffffff',
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        fontSize: 9,
    },
    contactTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '4 10',
        borderRadius: 12,
        color: '#ffffff',
    },
    link: {
        color: '#ffffff',
        textDecoration: 'none',
    },
    body: {
        padding: 30,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    sectionIcon: {
        width: 14,
        height: 14,
        color: '#7c3aed',
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#1f2937',
    },
    text: {
        fontSize: 10,
        color: '#4b5563',
        lineHeight: 1.5,
        paddingLeft: 20,
    },
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        paddingLeft: 20,
    },
    skillTag: {
        fontSize: 9,
        backgroundColor: '#f5f3ff',
        border: 1,
        borderColor: '#c4b5fd',
        padding: '4 12',
        borderRadius: 12,
        color: '#6d28d9',
        fontFamily: 'Helvetica-Bold',
    },
    experienceCard: {
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 8,
        marginBottom: 10,
        marginLeft: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#7c3aed',
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
        backgroundColor: '#ede9fe',
        color: '#6d28d9',
        padding: '3 8',
        borderRadius: 10,
        fontFamily: 'Helvetica-Bold',
    },
    expCompany: {
        fontSize: 10,
        color: '#7c3aed',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 8,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    bullet: {
        width: 12,
        fontSize: 9,
        color: '#a78bfa',
    },
    bulletText: {
        flex: 1,
        fontSize: 9,
        color: '#4b5563',
    },
    educationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 20,
        marginBottom: 6,
    },
    eduInstitution: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#1f2937',
    },
    eduDegree: {
        fontSize: 9,
        color: '#4b5563',
    },
    eduYear: {
        fontSize: 9,
        color: '#7c3aed',
        fontFamily: 'Helvetica-Bold',
    },
});

interface Props {
    data: UserProfile;
    slug?: string;
}

const CreativeBoldPDF: React.FC<Props> = ({ data, slug }) => {
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
                        {data.location && (
                            <View style={styles.contactTag}><Text>{data.location}</Text></View>
                        )}
                        {data.email && (
                            <View style={styles.contactTag}><Text>{data.email}</Text></View>
                        )}
                        {data.phone && (
                            <View style={styles.contactTag}><Text>{data.phone}</Text></View>
                        )}
                        {portfolioUrl && (
                            <View style={styles.contactTag}>
                                <Link src={portfolioUrl} style={styles.link}>{portfolioDisplay}</Link>
                            </View>
                        )}
                        {data.links?.map((link, i) => (
                            <View key={i} style={styles.contactTag}>
                                <Link src={link.url} style={styles.link}>
                                    {link.platform || link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                </Link>
                            </View>
                        ))}
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
                                <View key={exp.id} style={styles.experienceCard}>
                                    <View style={styles.expHeader}>
                                        <Text style={styles.expRole}>{exp.role}</Text>
                                        <Text style={styles.expDate}>{exp.startDate} – {exp.endDate}</Text>
                                    </View>
                                    <Text style={styles.expCompany}>{exp.company}</Text>
                                    {exp.description?.map((point, idx) => (
                                        <View key={idx} style={styles.bulletItem}>
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
                                <View key={exp.id} style={styles.educationItem}>
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
