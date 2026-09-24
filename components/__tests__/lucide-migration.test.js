import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const iconFiles = [
  "components/Login.jsx",
  "components/QuestionOption.jsx",
  "components/Header.jsx",
  "components/UserMenu.jsx",
  "components/Sidebar.jsx",
  "components/Dashboard/ExamSchedule.jsx",
  "components/Dashboard/ExamPlan.jsx",
];

const loadingButtonContracts = [
  [
    "components/Login.jsx",
    'aria-label={status === "loading" ? "Memproses login" : undefined}',
  ],
  [
    "pages/ujian-susulan/index.jsx",
    'aria-label={isLoading === "loading" ? "Memeriksa token ujian" : undefined}',
  ],
];

describe("Lucide icon migration", () => {
  test("control-icon files import named icons and contain no hand-authored svg", () => {
    for (const file of iconFiles) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("lucide-react");
      expect(source).not.toContain("<svg");
    }
  });

  test("loading-only submit states expose Indonesian accessible names", () => {
    for (const [file, contract] of loadingButtonContracts) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain(contract);
    }
  });
});
