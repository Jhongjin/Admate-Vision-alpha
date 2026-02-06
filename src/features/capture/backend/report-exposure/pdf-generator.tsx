/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
    renderToStream,
} from "@react-pdf/renderer";
import type { AiAnalysisResult } from "../ai-analysis-service";

// Register Korean Font (NanumGothic)
Font.register({
    family: "NanumGothic",
    src: "https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Regular.ttf",
});

Font.register({
    family: "NanumGothicBold",
    src: "https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Bold.ttf",
});

const styles = StyleSheet.create({
    page: {
        fontFamily: "NanumGothic",
        padding: 40,
        backgroundColor: "#ffffff",
        fontSize: 9,
        color: "#334155", // slate-700
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0", // slate-200
        paddingBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: "NanumGothicBold",
        color: "#1e293b", // slate-800
    },
    headerSub: {
        fontSize: 9,
        color: "#64748b", // slate-500
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: "NanumGothicBold",
        color: "#334155",
        marginBottom: 6,
        borderLeftWidth: 3,
        borderLeftColor: "#4f46e5", // indigo-600
        paddingLeft: 6,
    },
    card: {
        backgroundColor: "#f8fafc", // slate-50
        padding: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    row: {
        flexDirection: "row",
        gap: 10,
    },
    metricBox: {
        flex: 1,
        padding: 8,
        backgroundColor: "#f1f5f9", // slate-100
        borderRadius: 4,
    },
    metricLabel: {
        fontSize: 7,
        color: "#64748b",
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 10,
        fontFamily: "NanumGothicBold",
        color: "#0f172a",
    },
    analysisText: {
        fontSize: 9,
        lineHeight: 1.5,
        color: "#334155",
        textAlign: "justify",
    },
    chartContainer: {
        height: 100,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 4,
        marginTop: 10,
        paddingBottom: 2,
        borderBottomWidth: 1,
        borderBottomColor: "#cbd5e1",
    },
    barCol: {
        flex: 1,
        alignItems: "center",
        gap: 2,
    },
    bar: {
        width: "100%",
        backgroundColor: "#6366f1", // indigo-500
        borderRadius: 2,
    },
    barLabel: {
        fontSize: 7,
        color: "#64748b",
        marginTop: 2,
    },
    imageGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    imageContainer: {
        width: "48%", // 2 columns
        height: 150,
        backgroundColor: "#f1f5f9",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 10,
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: "center",
        fontSize: 8,
        color: "#94a3b8",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        paddingTop: 10,
    },
});

export interface ReportPdfParams {
    advertiserName: string;
    station: string;
    line: string;
    dateStr: string;
    aiAnalysis: AiAnalysisResult | null;
    imageBase64s?: string[];
    exposure?: {
        totalExposure: number;
        dailyFlow: number;
    };
}

const ReportDocument: React.FC<ReportPdfParams> = ({
    advertiserName,
    station,
    line,
    dateStr,
    aiAnalysis,
    imageBase64s,
    exposure,
}) => {
    const formattedDate =
        dateStr.length === 8
            ? `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`
            : dateStr;

    const chartData = aiAnalysis?.chartData || [];
    const maxVal = Math.max(...chartData.map((d) => d.value), 1);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSub}>AdMate Vision AI Analysis</Text>
                        <Text style={styles.headerTitle}>광고 성과 & 인사이트 리포트</Text>
                    </View>
                    <View>
                        <Text style={styles.headerSub}>{formattedDate}</Text>
                    </View>
                </View>

                {/* Basic Info */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>광고주</Text>
                            <Text style={styles.metricValue}>{advertiserName}</Text>
                        </View>
                        <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>위치</Text>
                            <Text style={styles.metricValue}>
                                {station} ({line})
                            </Text>
                        </View>
                        <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>총 노출(추정)</Text>
                            <Text style={styles.metricValue}>
                                {aiAnalysis?.metrics?.totalExposure
                                    ? (aiAnalysis.metrics.totalExposure / 10000).toFixed(1) + "만"
                                    : exposure?.totalExposure
                                        ? (exposure.totalExposure / 10000).toFixed(1) + "만"
                                        : "-"}
                                명
                            </Text>
                        </View>
                        <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>AdMate Score</Text>
                            <Text style={[styles.metricValue, { color: "#4f46e5" }]}>
                                {aiAnalysis?.metrics?.score ?? "-"}점
                            </Text>
                        </View>
                    </View>
                </View>

                {/* AI Analysis Text */}
                {aiAnalysis?.analysisText && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>AI 분석 리포트</Text>
                        <View style={styles.card}>
                            <Text style={styles.analysisText}>{aiAnalysis.analysisText}</Text>
                        </View>
                    </View>
                )}

                {/* Traffic Chart */}
                {chartData.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>시간대별 유동인구 추이</Text>
                        <View style={styles.chartContainer}>
                            {chartData.map((d, i) => {
                                const heightPct = (d.value / maxVal) * 100;
                                return (
                                    <View key={i} style={styles.barCol}>
                                        <View style={[styles.bar, { height: `${heightPct}%` }]} />
                                        <Text style={styles.barLabel}>{d.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Images */}
                {imageBase64s && imageBase64s.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>현장 촬영 증빙</Text>
                        <View style={styles.imageGrid}>
                            {imageBase64s.slice(0, 4).map((base64, idx) => {
                                const src = base64.startsWith("data:")
                                    ? base64
                                    : `data:image/jpeg;base64,${base64}`;
                                return (
                                    <View key={idx} style={styles.imageContainer}>
                                        <Image src={src} style={styles.image} />
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer}>
                    © 2026 Kt Nasmedia AdMate Vision. AI-Powered Advertisement Analysis System.
                </Text>
            </Page>
        </Document>
    );
};

export async function generateReportPdf(params: ReportPdfParams): Promise<Buffer> {
    const stream = await renderToStream(<ReportDocument {...params} />);
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}
