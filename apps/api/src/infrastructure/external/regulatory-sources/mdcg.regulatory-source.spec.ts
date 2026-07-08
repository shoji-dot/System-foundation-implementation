import pdfParse from "pdf-parse";

import { MdcgRegulatorySource } from "./mdcg.regulatory-source";

// pdf-parseは実PDFバイナリを要求するため、fetchDocumentの検証時はモックに差し替える（PMDA specと同方針）。
jest.mock("pdf-parse");
const pdfParseMock = pdfParse as jest.MockedFunction<typeof pdfParse>;

// 実ページ(https://health.ec.europa.eu/.../guidance-mdcg-endorsed-documents-and-other-guidance_en、
// 2026-07-08にChrome DevToolsでDOM構造確認済み)を模したフィクスチャ: ヘッダー行(th)、
// 通常のMDCG番号+タイトル+日付の行、2列目タイトルが空でリンクテキストがタイトルを兼ねる行、
// PDF以外(xlsx)のため除外されるべき行。
const FIXTURE_HTML = `
<html>
  <body>
    <table>
      <tr><th>Document</th></tr>
      <tr>
        <td><a href="/document/download/aaaa1111-2222-3333-4444-555566667777_en?filename=mdcg_2025-5_en.pdf">MDCG 2025-5</a></td>
        <td>Questions &amp; Answers regarding performance studies of in vitro diagnostic medical devices</td>
        <td>June 2025</td>
      </tr>
      <tr>
        <td><a href="/document/download/bbbb2222-3333-4444-5555-666677778888_en?filename=md_mdcg_qa_conformity_assessment_en.pdf">Conformity assessment procedures for protective equipment</a></td>
        <td></td>
        <td>July 2020</td>
      </tr>
      <tr>
        <td><a href="/document/download/cccc3333-4444-5555-6666-777788889999_en?filename=mdcg_2026-3_en.xlsx">MDCG 2026-3</a></td>
        <td>2026 EMDN Version History</td>
        <td>April 2026</td>
      </tr>
    </table>
  </body>
</html>
`;

describe("MdcgRegulatorySource", () => {
  let source: MdcgRegulatorySource;

  beforeEach(() => {
    source = new MdcgRegulatorySource();
  });

  it("sets a stable sourceId for ingestion_jobs.source", () => {
    expect(source.sourceId).toBe("EU_MDCG_GUIDANCE");
  });

  describe("parseList", () => {
    it("skips the header row", () => {
      const items = source.parseList(FIXTURE_HTML);

      expect(items.some((item) => item.title === "Document")).toBe(false);
    });

    it("extracts a normal row, using the label cell as a notice number and the title cell as the title", () => {
      const items = source.parseList(FIXTURE_HTML);

      expect(items).toContainEqual({
        sourceDocId: "aaaa1111-2222-3333-4444-555566667777",
        title:
          "Questions & Answers regarding performance studies of in vitro diagnostic medical devices",
        sourceUrl:
          "https://health.ec.europa.eu/document/download/aaaa1111-2222-3333-4444-555566667777_en?filename=mdcg_2025-5_en.pdf",
        issuedAt: new Date(Date.UTC(2025, 5, 1)),
        noticeNumbers: ["MDCG 2025-5"],
      });
    });

    it("falls back to the link cell's own text as the title when the title cell is empty, with no notice number", () => {
      const items = source.parseList(FIXTURE_HTML);

      expect(items).toContainEqual({
        sourceDocId: "bbbb2222-3333-4444-5555-666677778888",
        title: "Conformity assessment procedures for protective equipment",
        sourceUrl:
          "https://health.ec.europa.eu/document/download/bbbb2222-3333-4444-5555-666677778888_en?filename=md_mdcg_qa_conformity_assessment_en.pdf",
        issuedAt: new Date(Date.UTC(2020, 6, 1)),
        noticeNumbers: [],
      });
    });

    it("filters out non-PDF documents (e.g. xlsx)", () => {
      const items = source.parseList(FIXTURE_HTML);

      expect(
        items.some((item) => item.sourceDocId === "cccc3333-4444-5555-6666-777788889999"),
      ).toBe(false);
      expect(items).toHaveLength(2);
    });

    it("returns an empty list for a page with no table rows", () => {
      const items = source.parseList("<html><body>no guidance</body></html>");

      expect(items).toEqual([]);
    });

    it("sets issuedAt to null when the date cell doesn't match the expected format", () => {
      const html = `
        <table>
          <tr>
            <td><a href="/document/download/dddd4444-5555-6666-7777-888899990000_en?filename=mdcg_x_en.pdf">MDCG X</a></td>
            <td>不明形式の日付</td>
            <td>2025年6月</td>
          </tr>
        </table>
      `;

      const items = source.parseList(html);

      expect(items).toContainEqual(
        expect.objectContaining({
          sourceDocId: "dddd4444-5555-6666-7777-888899990000",
          issuedAt: null,
        }),
      );
    });
  });

  describe("fetchDocument", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("extracts PDF text via pdf-parse", async () => {
      pdfParseMock.mockResolvedValue({
        text: "  MDCGガイダンス本文  \n",
      } as Awaited<ReturnType<typeof pdfParse>>);
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      } as unknown as Response);

      const result = await source.fetchDocument({
        sourceDocId: "aaaa1111-2222-3333-4444-555566667777",
        title: "テスト",
        sourceUrl:
          "https://health.ec.europa.eu/document/download/aaaa1111-2222-3333-4444-555566667777_en?filename=mdcg_2025-5_en.pdf",
        issuedAt: null,
        noticeNumbers: [],
      });

      expect(pdfParseMock).toHaveBeenCalled();
      expect(result.rawContent).toBe("MDCGガイダンス本文");
    });

    it("throws when the response is not ok", async () => {
      jest
        .spyOn(global, "fetch")
        .mockResolvedValue({ ok: false, status: 404 } as unknown as Response);

      await expect(
        source.fetchDocument({
          sourceDocId: "0000",
          title: "存在しない文書",
          sourceUrl: "https://health.ec.europa.eu/document/download/0000_en",
          issuedAt: null,
          noticeNumbers: [],
        }),
      ).rejects.toThrow();
    });
  });

  describe("normalize", () => {
    it("maps to an EU/GUIDANCE document, using the notice number as docNumber when present", async () => {
      const result = await source.normalize(
        {
          sourceDocId: "aaaa1111-2222-3333-4444-555566667777",
          title: "テストガイダンス",
          sourceUrl: "https://health.ec.europa.eu/document/download/aaaa_en?filename=x.pdf",
          issuedAt: new Date(Date.UTC(2025, 5, 1)),
          noticeNumbers: ["MDCG 2025-5"],
        },
        {
          sourceDocId: "aaaa1111-2222-3333-4444-555566667777",
          sourceUrl: "https://health.ec.europa.eu/document/download/aaaa_en?filename=x.pdf",
          rawContent: "本文テキスト",
          fetchedAt: new Date(),
        },
      );

      expect(result).toEqual({
        jurisdiction: "EU",
        type: "GUIDANCE",
        subtype: null,
        title: "テストガイダンス",
        docNumber: "MDCG 2025-5",
        effectiveDate: new Date(Date.UTC(2025, 5, 1)),
        sourceUrl: "https://health.ec.europa.eu/document/download/aaaa_en?filename=x.pdf",
        fullText: "本文テキスト",
        contentHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
    });

    it("falls back to sourceDocId for docNumber when there are no notice numbers", async () => {
      const result = await source.normalize(
        {
          sourceDocId: "bbbb2222-3333-4444-5555-666677778888",
          title: "タイトルのみの文書",
          sourceUrl: "https://health.ec.europa.eu/document/download/bbbb_en?filename=x.pdf",
          issuedAt: new Date(Date.UTC(2020, 6, 1)),
          noticeNumbers: [],
        },
        {
          sourceDocId: "bbbb2222-3333-4444-5555-666677778888",
          sourceUrl: "https://health.ec.europa.eu/document/download/bbbb_en?filename=x.pdf",
          rawContent: "本文",
          fetchedAt: new Date(),
        },
      );

      expect(result.docNumber).toBe("bbbb2222-3333-4444-5555-666677778888");
    });
  });
});
