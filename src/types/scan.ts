/**
 * Types for OMR scanning feature
 */

// Detected answer for a single question
export interface DetectedAnswer {
  questionNumber: number;
  selectedOption: string | null;
  multipleSelections: string[] | null;
  confidence: number;
  isValid: boolean;
}

// Student ID detection result
export interface DetectedStudentId {
  value: string | null;
  digits: {
    position: number;
    value: number | null;
    confidence: number;
  }[];
  confidence: number;
  isValid: boolean;
}

// Question grading result
export interface QuestionResult {
  questionNumber: number;
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
}

// Grading result
export interface GradingResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  invalidAnswers: number;
  score: number;
  percentage: number;
  questionResults: QuestionResult[];
}

// Complete scan result from API
export interface ScanResult {
  scanId: string;
  examId: string;
  classId?: string;
  scannedAt: string | Date;
  scannedBy: string;
  imageQuality: "excellent" | "good" | "fair" | "poor";
  alignmentSuccess: boolean;
  processingTimeMs: number;
  studentId: DetectedStudentId;
  answers: DetectedAnswer[];
  grading?: GradingResult;
  requiresReview: boolean;
  reviewReasons: string[];
  imageUrl?: string;
}

// Scan request payload
export interface ScanRequest {
  examId: string;
  imageBase64: string;
  options?: {
    autoRotate?: boolean;
    autoContrast?: boolean;
    denoise?: boolean;
    bubbleFillThreshold?: number;
    confidenceThreshold?: number;
    debug?: boolean;
  };
}

// Scan API response
export interface ScanResponse {
  success: boolean;
  result?: ScanResult;
  error?: string;
  errorCode?: string;
}

// Batch scan response
export interface BatchScanResponse {
  success: boolean;
  batch: {
    totalScanned: number;
    successful: number;
    failed: number;
    requiresReview: number;
    results: ScanResult[];
    errors: {
      imageIndex: number;
      error: string;
    }[];
  };
}

// Scan result for display in list
export interface ScanResultSummary {
  scanId: string;
  examId: string;
  examTitle: string;
  studentId: string | null;
  score: number;
  percentage: number;
  totalQuestions: number;
  scannedAt: string;
  imageQuality: string;
  requiresReview: boolean;
  reviewReasons: string[];
}

// Manual correction
export interface ManualCorrection {
  scanId: string;
  corrections: {
    questionNumber: number;
    correctedAnswer: string | null;
  }[];
  studentIdCorrection?: string;
  reviewedBy: string;
  notes?: string;
}

// Camera state for scanning UI
export interface CameraState {
  isReady: boolean;
  hasPermission: boolean;
  error: string | null;
  facingMode: "user" | "environment";
}

// Scan session state
export interface ScanSession {
  examId: string;
  examTitle: string;
  classId: string;
  className: string;
  answerKey: Record<number, string>;
  scannedCount: number;
  results: ScanResult[];
  errors: string[];
}
