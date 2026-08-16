export interface FeatureContribution {
    word: string;
    weight: number;
}

export interface LabelAnalysis {
    probability: number;
    top_features: FeatureContribution[];
}

export interface AnalysisResponse {
    text: string;
    max_risk_score: number;
    detections: Record<string, LabelAnalysis>;
    model_version: string;
}

export interface AnalysisRequest {
    text: string;
}
