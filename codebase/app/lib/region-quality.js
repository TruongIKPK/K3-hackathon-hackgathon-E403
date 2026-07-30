// @ts-check

/** @typedef {{ x: number; y: number }} Point */
/** @typedef {"good" | "warning" | "blocked"} RegionQualityStatus */
/**
 * @typedef {{
 *   pointCount: number;
 *   boundingBoxArea: number;
 *   polygonArea: number;
 *   fillRatio: number;
 *   pathDensity: number;
 *   closureRatio: number;
 *   selfIntersections: number;
 * }} GeometryMetrics
 */
/**
 * @typedef {{
 *   status: RegionQualityStatus;
 *   score: number;
 *   title: string;
 *   summary: string;
 *   reasons: string[];
 *   metrics: GeometryMetrics;
 *   stage: "geometry" | "content";
 * }} RegionQualityAssessment
 */

const STOP_WORDS = new Set([
  "and", "are", "for", "from", "the", "this", "that", "with",
  "các", "cho", "của", "được", "là", "một", "những", "trong", "và", "với",
]);

/** @param {number} value */
function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** @param {RegionQualityStatus} status @param {number} score @param {string[]} reasons @param {GeometryMetrics} metrics @param {"geometry" | "content"} stage @returns {RegionQualityAssessment} */
function result(status, score, reasons, metrics, stage) {
  if (status === "blocked") {
    return {
      status,
      score: clampScore(score),
      title: "Cần khoanh lại",
      summary: "Vùng này chưa đủ tin cậy để đưa vào câu trả lời của AI.",
      reasons: [...new Set(reasons)].slice(0, 4),
      metrics,
      stage,
    };
  }
  if (status === "warning") {
    return {
      status,
      score: clampScore(score),
      title: "Nên kiểm tra",
      summary: "Vùng vẫn có thể dùng, nhưng nên xem lại crop hoặc nội dung OCR.",
      reasons: [...new Set(reasons)].slice(0, 4),
      metrics,
      stage,
    };
  }
  return {
    status,
    score: clampScore(score),
    title: "Vùng rõ",
    summary: "Hình khoanh và nội dung OCR đủ rõ để dùng làm ngữ cảnh.",
    reasons: [],
    metrics,
    stage,
  };
}

/** @param {Point} a @param {Point} b @param {Point} c */
function orientation(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/** @param {Point} a @param {Point} b @param {Point} c @param {Point} d */
function segmentsIntersect(a, b, c, d) {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);
  return first * second < -1e-9 && third * fourth < -1e-9;
}

/** @param {Point[]} points */
function countSelfIntersections(points) {
  if (points.length < 5) return 0;
  const stride = Math.max(1, Math.ceil(points.length / 90));
  const sampled = points.filter((_, index) => index % stride === 0);
  if (sampled[sampled.length - 1] !== points[points.length - 1]) sampled.push(points[points.length - 1]);
  let intersections = 0;

  for (let first = 0; first < sampled.length - 1; first += 1) {
    for (let second = first + 2; second < sampled.length - 1; second += 1) {
      if (first === 0 && second === sampled.length - 2) continue;
      if (segmentsIntersect(sampled[first], sampled[first + 1], sampled[second], sampled[second + 1])) {
        intersections += 1;
        if (intersections >= 12) return intersections;
      }
    }
  }
  return intersections;
}

/** @param {Point[]} points @returns {RegionQualityAssessment} */
export function assessRegionGeometry(points) {
  const safePoints = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const xs = safePoints.map((point) => point.x);
  const ys = safePoints.map((point) => point.y);
  const width = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
  const height = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
  const boundingBoxArea = width * height;

  let twiceArea = 0;
  let pathLength = 0;
  for (let index = 0; index < safePoints.length; index += 1) {
    const current = safePoints[index];
    const next = safePoints[(index + 1) % safePoints.length];
    twiceArea += current.x * next.y - next.x * current.y;
    if (index < safePoints.length - 1) pathLength += Math.hypot(next.x - current.x, next.y - current.y);
  }

  const polygonArea = Math.abs(twiceArea) / 2;
  const fillRatio = boundingBoxArea > 0 ? polygonArea / boundingBoxArea : 0;
  const diagonal = Math.hypot(width, height);
  const closureGap = safePoints.length > 1
    ? Math.hypot(safePoints[0].x - safePoints[safePoints.length - 1].x, safePoints[0].y - safePoints[safePoints.length - 1].y)
    : 1;
  const closureRatio = diagonal > 0 ? closureGap / diagonal : 1;
  const pathDensity = boundingBoxArea > 0 ? pathLength / Math.sqrt(boundingBoxArea) : 100;
  const selfIntersections = countSelfIntersections(safePoints);
  const metrics = {
    pointCount: safePoints.length,
    boundingBoxArea,
    polygonArea,
    fillRatio,
    pathDensity,
    closureRatio,
    selfIntersections,
  };

  let score = 100;
  let blocked = false;
  const reasons = [];

  if (safePoints.length < 5) {
    blocked = true;
    score -= 65;
    reasons.push("Đường khoanh quá ngắn để tạo thành một vùng rõ ràng.");
  }
  if (boundingBoxArea < 0.0015 || polygonArea < 0.0005) {
    blocked = true;
    score -= 55;
    reasons.push("Vùng khoanh quá nhỏ hoặc gần như không có diện tích.");
  } else if (boundingBoxArea < 0.006) {
    score -= 22;
    reasons.push("Vùng khá nhỏ; OCR có thể bỏ sót chữ.");
  }
  if (fillRatio < 0.035 || (fillRatio < 0.1 && pathDensity > 28)) {
    blocked = true;
    score -= 45;
    reasons.push("Nét vẽ có dạng ngoằn ngoèo, chưa bao quanh nội dung ổn định.");
  } else if (fillRatio < 0.14) {
    score -= 20;
    reasons.push("Biên vùng khá rối; hãy kiểm tra ảnh crop trước khi dùng.");
  }
  if (selfIntersections >= 5) {
    blocked = true;
    score -= 45;
    reasons.push("Đường khoanh tự cắt quá nhiều lần, có thể là nét thử thay vì vùng học.");
  } else if (selfIntersections >= 2) {
    score -= 18;
    reasons.push("Đường khoanh tự cắt; ảnh crop có thể bị thiếu mảng.");
  }
  if (pathDensity > 34) {
    blocked = true;
    score -= 35;
    reasons.push("Mật độ nét vẽ quá cao so với diện tích vùng.");
  } else if (pathDensity > 20) {
    score -= 16;
    reasons.push("Nét khoanh dài và phức tạp hơn bình thường.");
  }
  if (closureRatio > 0.72) {
    score -= 16;
    reasons.push("Điểm đầu và cuối cách xa nhau; vùng có thể khép chưa sát.");
  }
  if (boundingBoxArea > 0.72) {
    score -= 18;
    reasons.push("Vùng chiếm gần toàn slide; có thể lẫn nội dung không liên quan.");
  }

  if (blocked) return result("blocked", Math.min(score, 44), reasons, metrics, "geometry");
  if (reasons.length > 0 || score < 78) return result("warning", score, reasons, metrics, "geometry");
  return result("good", score, [], metrics, "geometry");
}

/** @param {string} value @returns {string[]} */
function textTokens(value) {
  return (value.toLocaleLowerCase("vi-VN").match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/** @param {string} markdown */
function plainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} markdown
 * @param {string} slideText
 * @param {RegionQualityAssessment} geometryAssessment
 * @returns {RegionQualityAssessment}
 */
export function assessRegionContent(markdown, slideText, geometryAssessment) {
  const content = plainText(markdown);
  const tokens = textTokens(content);
  const slideTokens = new Set(textTokens(slideText));
  const alphanumericCount = (content.match(/[\p{L}\p{N}]/gu) ?? []).length;
  const nonSpaceCount = (content.match(/\S/g) ?? []).length;
  const alphanumericRatio = nonSpaceCount > 0 ? alphanumericCount / nonSpaceCount : 0;
  const overlapCount = new Set(tokens.filter((token) => slideTokens.has(token))).size;
  const uniqueRegionTokens = new Set(tokens).size;
  const overlapRatio = uniqueRegionTokens > 0 ? overlapCount / uniqueRegionTokens : 0;
  const slidePlainText = plainText(slideText);
  const slideCoverage = slidePlainText.length > 0 ? content.length / slidePlainText.length : 0;

  let score = geometryAssessment.score;
  let blocked = geometryAssessment.status === "blocked";
  const reasons = [...geometryAssessment.reasons];

  if (!content) {
    blocked = true;
    score -= 65;
    reasons.push("OCR không tìm thấy văn bản trong vùng.");
  } else {
    if (content.length < 10 || tokens.length < 2) {
      blocked = true;
      score -= 45;
      reasons.push("Nội dung OCR quá ít để xác định ý nghĩa của vùng.");
    } else if (content.length < 36 || tokens.length < 5) {
      score -= 20;
      reasons.push("Nội dung OCR khá ngắn; nên đối chiếu lại ảnh crop.");
    }
    if (alphanumericRatio < 0.25) {
      blocked = true;
      score -= 40;
      reasons.push("OCR chủ yếu là ký tự nhiễu hoặc dấu rời rạc.");
    } else if (alphanumericRatio < 0.48 || /(.)\1{5,}/u.test(content)) {
      score -= 18;
      reasons.push("OCR có nhiều ký tự bất thường; bạn có thể sửa text trước khi hỏi.");
    }
    if (slideTokens.size >= 8 && tokens.length >= 4 && overlapRatio < 0.12) {
      score -= 18;
      reasons.push("Text OCR ít khớp với nội dung text của slide; có thể crop nhầm hoặc OCR sai.");
    }
    if (geometryAssessment.metrics.boundingBoxArea > 0.48 && slideCoverage > 0.72) {
      score -= 16;
      reasons.push("Vùng lấy phần lớn nội dung slide; hãy kiểm tra xem có lẫn hàng hoặc cột bên cạnh không.");
    }
  }

  if (blocked) return result("blocked", Math.min(score, 44), reasons, geometryAssessment.metrics, "content");
  if (reasons.length > 0 || score < 78) return result("warning", score, reasons, geometryAssessment.metrics, "content");
  return result("good", score, [], geometryAssessment.metrics, "content");
}

/** @param {{ quality?: RegionQualityAssessment; qualityOverride?: boolean }} region */
export function isRegionUsable(region) {
  return region.qualityOverride === true || region.quality?.status !== "blocked";
}
