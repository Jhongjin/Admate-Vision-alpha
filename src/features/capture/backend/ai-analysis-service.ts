
export interface AiAnalysisResult {
    analysisText: string;
    metrics: {
        dailyTraffic: number;
        totalExposure: number;
        demographic: string;
        peakTime: string;
        score: number;
    };
    chartData: { label: string; value: number }[];
}

export async function generateAiAnalysis(params: {
    station: string;
    line: string;
    advertiserName: string;
    dateStr: string;
}): Promise<AiAnalysisResult> {
    // Mock AI Generation Logic directly in the service
    // In a real scenario, this would call Gemini API with a prompt.

    const { station, line, advertiserName, dateStr } = params;

    // Simulate processing time
    // await new Promise(resolve => setTimeout(resolve, 1000));

    const trafficBase = 120000 + Math.floor(Math.random() * 50000);
    const exposureBase = trafficBase * 6; // Approx 6 days equivalent? Or just multiplier

    const score = 85 + Math.floor(Math.random() * 14); // 85-99

    const analysisText = `${station} ${line}은 유동인구가 풍부한 핵심 역사로, ${advertiserName} 광고의 타겟인 2030 세대 및 직장인 비율이 높습니다.
특히 출퇴근 시간대에 높은 노출 효과를 기대할 수 있으며, 주변 상권과의 연계성도 우수하여 브랜드 인지도 상승 및 실질적인 전환 유도에 효과적인 위치로 분석됩니다.
지난 게재 기간 동안 안정적인 노출량을 기록하였으며, AdMate Vision AI 분석 결과 상위 ${100 - score}% 수준의 높은 "고효율 스팟"으로 평가됩니다.`;

    return {
        analysisText,
        metrics: {
            dailyTraffic: trafficBase,
            totalExposure: exposureBase,
            demographic: "2030 직장인 및 대학생",
            peakTime: "18:00 - 20:00 (퇴근 시간대)",
            score: score,
        },
        chartData: [
            { label: "08시", value: 60 + Math.floor(Math.random() * 20) },
            { label: "10시", value: 40 + Math.floor(Math.random() * 20) },
            { label: "12시", value: 70 + Math.floor(Math.random() * 20) },
            { label: "14시", value: 50 + Math.floor(Math.random() * 20) },
            { label: "16시", value: 55 + Math.floor(Math.random() * 20) },
            { label: "18시", value: 90 + Math.floor(Math.random() * 10) },
            { label: "20시", value: 80 + Math.floor(Math.random() * 20) },
            { label: "22시", value: 50 + Math.floor(Math.random() * 20) },
        ]
    };
}
