import assert from "node:assert/strict";
import test from "node:test";
import {
  assessRegionContent,
  assessRegionGeometry,
  isRegionUsable,
} from "../app/lib/region-quality.js";

const cleanRectangle = [
  { x: 0.1, y: 0.15 },
  { x: 0.55, y: 0.15 },
  { x: 0.55, y: 0.42 },
  { x: 0.1, y: 0.42 },
  { x: 0.1, y: 0.15 },
];

test("accepts a clean freehand enclosure", () => {
  const assessment = assessRegionGeometry(cleanRectangle);
  assert.equal(assessment.status, "good");
  assert.ok(assessment.score >= 78);
  assert.equal(isRegionUsable({ quality: assessment }), true);
});

test("blocks a tiny scribble before spending an OCR request", () => {
  const assessment = assessRegionGeometry([
    { x: 0.1, y: 0.1 },
    { x: 0.105, y: 0.104 },
    { x: 0.101, y: 0.106 },
    { x: 0.106, y: 0.101 },
    { x: 0.1, y: 0.1 },
  ]);
  assert.equal(assessment.status, "blocked");
  assert.equal(isRegionUsable({ quality: assessment }), false);
  assert.equal(isRegionUsable({ quality: assessment, qualityOverride: true }), true);
});

test("keeps useful OCR grounded against slide text", () => {
  const geometry = assessRegionGeometry(cleanRectangle);
  const assessment = assessRegionContent(
    "Agent quan sát môi trường, lập kế hoạch và sử dụng công cụ để hoàn thành nhiệm vụ.",
    "Kiến trúc Agent gồm quan sát môi trường, lập kế hoạch, sử dụng công cụ và phản hồi.",
    geometry,
  );
  assert.equal(assessment.status, "good");
  assert.equal(assessment.stage, "content");
});

test("blocks empty or meaningless OCR output", () => {
  const geometry = assessRegionGeometry(cleanRectangle);
  const empty = assessRegionContent("", "Nội dung slide có ý nghĩa.", geometry);
  const noisy = assessRegionContent("@@@@ #### !!!!!", "Nội dung slide có ý nghĩa.", geometry);
  assert.equal(empty.status, "blocked");
  assert.equal(noisy.status, "blocked");
});
