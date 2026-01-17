import { describe, expect, it } from "vitest";
import { sliceContentLines } from "./slice-content-lines";

describe("sliceContentLines", () => {
  const multiLineContent = "line 1\nline 2\nline 3\nline 4\nline 5";
  const emptyContent = "";

  describe("success cases", () => {
    it("slices content with both startLine and endLine", () => {
      const result = sliceContentLines({
        content: multiLineContent,
        startLine: 2,
        endLine: 4,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.text).toBe("line 2\nline 3\nline 4");
      }
    });

    it("slices single line when startLine equals endLine", () => {
      const result = sliceContentLines({
        content: multiLineContent,
        startLine: 3,
        endLine: 3,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.text).toBe("line 3");
      }
    });

    it("slices from startLine to end when endLine is not provided", () => {
      const result = sliceContentLines({
        content: multiLineContent,
        startLine: 3,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.text).toBe("line 3\nline 4\nline 5");
      }
    });

    it("slices from beginning to endLine when startLine is not provided", () => {
      const result = sliceContentLines({
        content: multiLineContent,
        endLine: 3,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.text).toBe("line 1\nline 2\nline 3");
      }
    });

    it("returns all content when neither startLine nor endLine is provided", () => {
      const result = sliceContentLines({
        content: multiLineContent,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.text).toBe(multiLineContent);
      }
    });

    it("handles content with trailing newline", () => {
      const contentWithTrailingNewline = "line 1\nline 2\n";
      const result = sliceContentLines({
        content: contentWithTrailingNewline,
        startLine: 1,
        endLine: 2,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.text).toBe("line 1\nline 2");
      }
    });

    it("handles content with empty lines", () => {
      const contentWithEmptyLines = "line 1\n\nline 3\n\nline 5";
      const result = sliceContentLines({
        content: contentWithEmptyLines,
        startLine: 2,
        endLine: 4,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.text).toBe("\nline 3\n");
      }
    });

    it("handles empty content as a single empty line", () => {
      const result = sliceContentLines({
        content: emptyContent,
        startLine: 1,
        endLine: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.text).toBe("");
      }
    });

    it("handles empty content with no line numbers", () => {
      // Empty content is treated as one line (empty string)
      const result = sliceContentLines({
        content: emptyContent,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.text).toBe("");
      }
    });
  });

  describe("error cases", () => {
    it("returns error when startLine is less than 1", () => {
      const result = sliceContentLines({
        content: multiLineContent,
        startLine: 0,
        endLine: 3,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("Line range is out of bounds.");
      }
    });

    it("returns error when endLine is less than 1", () => {
      const result = sliceContentLines({
        content: multiLineContent,
        startLine: 1,
        endLine: 0,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("Line range is out of bounds.");
      }
    });

    it("returns error when startLine is greater than total lines", () => {
      const result = sliceContentLines({
        content: multiLineContent,
        startLine: 6,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("Line range is out of bounds.");
      }
    });

    it("returns error when endLine is greater than total lines", () => {
      const result = sliceContentLines({
        content: multiLineContent,
        endLine: 6,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("Line range is out of bounds.");
      }
    });

    it("returns error when startLine is greater than endLine", () => {
      const result = sliceContentLines({
        content: multiLineContent,
        startLine: 4,
        endLine: 2,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe(
          "startLine cannot be greater than endLine.",
        );
      }
    });

    it("returns error for empty content when requesting line 2", () => {
      const result = sliceContentLines({
        content: emptyContent,
        startLine: 2,
        endLine: 2,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("Line range is out of bounds.");
      }
    });
  });
});
