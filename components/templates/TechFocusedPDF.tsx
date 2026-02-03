import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { UserProfile } from '../../types';

const styles = StyleSheet.create({
    page: {
        paddingTop: 24,
        paddingBottom: 24,
        fontFamily: 'Courier',
        fontSize: 9,
        lineHeight: 1.4,
        backgroundColor: '#111827',
        color: '#f3f4f6',
    },
    // Add this for continuation pages
    pageContent: {
        paddingTop: 24,
    },
    header: {
        backgroundColor: '#1f2937',
        marginTop: -24, // Pull header up into page padding on first page
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    terminalDots: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotRed: { backgroundColor: '#ef4444' },
    dotYellow: { backgroundColor: '#eab308' },
    dotGreen: { backgroundColor: '#22c55e' },
    terminalPath: {
        fontSize: 8,
        color: '#6b7280',
        marginLeft: 12,
    },
    yamlLine: {
        fontSize: 9,
        marginBottom: 2,
    },
    yamlKey: { color: '#a78bfa' },
    yamlValue: { color: '#4ade80' },
    yamlNested: { color: '#60a5fa' },
    yamlLink: { color: '#22d3ee' },
    body: {
        padding: 24,
    },
    section: {
        marginBottom: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        color: '#9ca3af',
        fontSize: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
        gap: 4,
    },
    sectionIcon: {
        fontSize: 10,
        color: '#9ca3af',
    },
    codeBlock: {
        backgroundColor: '#1f2937',
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#374151',
    },
    text: {
        fontSize: 9,
        color: '#d1d5db',
        lineHeight: 1.5,
    },
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    skillTag: {
        fontSize: 8,
        backgroundColor: '#1f2937',
        color: '#22d3ee',
        padding: '4 8',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#374151',
    },
    expCard: {
        backgroundColor: '#1f2937',
        padding: 14,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#374151',
    },
    expHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    expRole: {
        fontSize: 10,
        fontFamily: 'Courier-Bold',
        color: '#4ade80',
    },
    expDate: {
        fontSize: 7,
        backgroundColor: '#374151',
        color: '#9ca3af',
        padding: '2 6',
        borderRadius: 3,
    },
    expCompany: {
        fontSize: 9,
        color: '#a78bfa',
        marginBottom: 6,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    bullet: {
        width: 10,
        fontSize: 9,
        color: '#6b7280',
    },
    bulletText: {
        flex: 1,
        fontSize: 8,
        color: '#d1d5db',
    },
    eduRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
        paddingVertical: 6,
    },
    eduName: {
        fontSize: 9,
        color: '#e5e7eb',
    },
    eduDegree: {
        fontSize: 8,
        color: '#9ca3af',
    },
    eduYear: {
        fontSize: 8,
        color: '#4ade80',
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

const TechFocusedPDF: React.FC<Props> = ({ data, slug }) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portfolioUrl = slug ? `${origin}/p/${slug}` : null;
    const portfolioDisplay = portfolioUrl ? portfolioUrl.replace(/^https?:\/\//, '') : '';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.terminalDots}>
                        <View style={[styles.dot, styles.dotRed]} />
                        <View style={[styles.dot, styles.dotYellow]} />
                        <View style={[styles.dot, styles.dotGreen]} />
                        <Text style={styles.terminalPath}>~/resume.yml</Text>
                    </View>
                    <Text style={styles.yamlLine}>
                        <Text style={styles.yamlKey}>name: </Text>
                        <Text style={styles.yamlValue}>"{data.fullName}"</Text>
                    </Text>
                    {data.location && (
                        <Text style={styles.yamlLine}>
                            <Text style={styles.yamlKey}>location: </Text>
                            <Text style={styles.yamlValue}>"{data.location}"</Text>
                        </Text>
                    )}
                    <Text style={styles.yamlLine}><Text style={styles.yamlKey}>contact:</Text></Text>
                    {data.email && (
                        <Text style={styles.yamlLine}>
                            <Text>  </Text>
                            <Text style={styles.yamlNested}>email: </Text>
                            <Text style={styles.yamlLink}>"{data.email}"</Text>
                        </Text>
                    )}
                    {data.phone && (
                        <Text style={styles.yamlLine}>
                            <Text>  </Text>
                            <Text style={styles.yamlNested}>phone: </Text>
                            <Text style={styles.yamlLink}>"{data.phone}"</Text>
                        </Text>
                    )}
                    {portfolioUrl && (
                        <Text style={styles.yamlLine}>
                            <Text>  </Text>
                            <Text style={styles.yamlNested}>portfolio: </Text>
                            <Link src={portfolioUrl} style={{ color: '#22d3ee' }}>"{portfolioDisplay}"</Link>
                        </Text>
                    )}
                    {data.links?.map((link, i) => (
                        <Text key={i} style={styles.yamlLine}>
                            <Text>  </Text>
                            <Text style={styles.yamlNested}>{link.platform?.toLowerCase() || 'link'}: </Text>
                            <Link src={ensureProtocol(link.url)} style={{ color: '#22d3ee' }}>
                                "{link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}"
                            </Link>
                        </Text>
                    ))}
                </View>

                <View style={styles.body}>
                    {/* Summary */}
                    {data.summary && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionIcon}>&gt;</Text>
                                <Text>$ cat about.md</Text>
                            </View>
                            <View style={styles.codeBlock}>
                                <Text style={styles.text}>{data.summary}</Text>
                            </View>
                        </View>
                    )}

                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionIcon}>#</Text>
                                <Text>$ echo $SKILLS</Text>
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
                                <Text style={styles.sectionIcon}>~</Text>
                                <Text>$ ls -la ./experience</Text>
                            </View>
                            {data.experience.map((exp) => (
                                <View key={exp.id} style={styles.expCard} wrap={false}>
                                    <View style={styles.expHeader}>
                                        <Text style={styles.expRole}>{exp.role}</Text>
                                        <Text style={styles.expDate}>{exp.startDate} → {exp.endDate}</Text>
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

                    {/* Other Experience */}
                    {data.otherExperience && data.otherExperience.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionIcon}>~</Text>
                                <Text>$ ls ./other</Text>
                            </View>
                            {data.otherExperience.map((exp) => (
                                <View key={exp.id} style={styles.eduRow} wrap={false}>
                                    <View>
                                        <Text style={styles.eduName}>{exp.role}</Text>
                                        <Text style={styles.eduDegree}>{exp.company}</Text>
                                    </View>
                                    <Text style={styles.eduYear}>{exp.startDate} → {exp.endDate}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionIcon}>&gt;</Text>
                                <Text>$ cat education.log</Text>
                            </View>
                            {data.education.map((edu) => (
                                <View key={edu.id} style={styles.eduRow}>
                                    <View>
                                        <Text style={styles.eduName}>{edu.institution}</Text>
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

export default TechFocusedPDF;
