import pdfParse from "pdf-parse";

import { PmdaRegulatorySource } from "./pmda.regulatory-source";

// pdf-parseは実PDFバイナリを要求するため、fetchDocumentのPDF分岐を検証する際はモックに差し替える。
jest.mock("pdf-parse");
const pdfParseMock = pdfParse as jest.MockedFunction<typeof pdfParse>;

// 実ページ(https://www.pmda.go.jp/safety/info-services/devices/0001.html, 2026-07-04確認)の
// 構造を模したフィクスチャ: ヘッダー行(th)、PDF直リンクの新しい通知、通知番号の無い/HTML詳細ページへの
// リンクの古い通知、1セルに複数リンクを含む行（添付等）。
const FIXTURE_HTML = `
<html>
  <body>
    <table>
      <tr>
        <th>発出年月日</th>
        <th>表題</th>
      </tr>
      <tr>
        <td>2026年3月19日</td>
        <td>
          <a href="https://www.pmda.go.jp/files/000280044.pdf">
            医療機器に接続するVPN装置等のネットワーク機器におけるサイバーセキュリティ対策の徹底について（注意喚起）[98.43KB]
          </a>
        </td>
      </tr>
      <tr>
        <td>2008年12月22日<br>医政研発第1222001号</td>
        <td><a href="/safety/info-services/devices/0103.html">VEPTRの適正使用について</a></td>
      </tr>
      <tr>
        <td>2022年5月26日<br>薬生機審発0526第1号<br>薬生安発0526第1号</td>
        <td>
          <a href="https://www.pmda.go.jp/files/000246568.pdf">自動体外式除細動器及び体表用除細動電極の適正使用に関する情報提供等の実施について[123.28KB]</a>
          <a href="https://www.pmda.go.jp/files/000246569.pdf">（別添）リーフレット[45.00KB]</a>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

describe("PmdaRegulatorySource", () => {
  let source: PmdaRegulatorySource;

  beforeEach(() => {
    source = new PmdaRegulatorySource();
  });

  it("sets a stable sourceId for ingestion_jobs.source", () => {
    expect(source.sourceId).toBe("PMDA_DEVICE_SAFETY_NOTICES");
  });

  describe("parseList", () => {
    it("skips the header row", () => {
      const items = source.parseList(FIXTURE_HTML);

      expect(items.some((item) => item.title === "表題")).toBe(false);
    });

    it("extracts a PDF-linked notice with sourceDocId derived from the filename, and no notice number", () => {
      const items = source.parseList(FIXTURE_HTML);

      expect(items).toContainEqual({
        sourceDocId: "000280044",
        title:
          "医療機器に接続するVPN装置等のネットワーク機器におけるサイバーセキュリティ対策の徹底について（注意喚起）[98.43KB]",
        sourceUrl: "https://www.pmda.go.jp/files/000280044.pdf",
        issuedAt: new Date(Date.UTC(2026, 2, 19)),
        noticeNumbers: [],
      });
    });

    it("resolves relative HTML sub-page links and parses a single notice number", () => {
      const items = source.parseList(FIXTURE_HTML);

      expect(items).toContainEqual({
        sourceDocId: "0103",
        title: "VEPTRの適正使用について",
        sourceUrl: "https://www.pmda.go.jp/safety/info-services/devices/0103.html",
        issuedAt: new Date(Date.UTC(2008, 11, 22)),
        noticeNumbers: ["医政研発第1222001号"],
      });
    });

    it("extracts multiple links within the same row as separate items, sharing the row's notice numbers", () => {
      const items = source.parseList(FIXTURE_HTML);

      expect(items).toContainEqual(
        expect.objectContaining({
          sourceDocId: "000246568",
          noticeNumbers: ["薬生機審発0526第1号", "薬生安発0526第1号"],
        }),
      );
      expect(items).toContainEqual(
        expect.objectContaining({
          sourceDocId: "000246569",
          noticeNumbers: ["薬生機審発0526第1号", "薬生安発0526第1号"],
        }),
      );
    });

    it("returns an empty list for a page with no table rows", () => {
      const items = source.parseList("<html><body>no notices</body></html>");

      expect(items).toEqual([]);
    });

    it("sets issuedAt to null when the date cell doesn't match the expected format", () => {
      const html = `
        <table>
          <tr><td>令和8年3月19日</td><td><a href="/files/000000001.pdf">不明形式の日付</a></td></tr>
        </table>
      `;

      const items = source.parseList(html);

      expect(items).toContainEqual(
        expect.objectContaining({ sourceDocId: "000000001", issuedAt: null }),
      );
    });
  });

  describe("fetchDocument", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("extracts PDF text via pdf-parse for .pdf URLs", async () => {
      pdfParseMock.mockResolvedValue({
        text: "  PDF本文  \n",
      } as Awaited<ReturnType<typeof pdfParse>>);
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        text: () => Promise.resolve(""),
      } as unknown as Response);

      const result = await source.fetchDocument({
        sourceDocId: "000280044",
        title: "テスト通知",
        sourceUrl: "https://www.pmda.go.jp/files/000280044.pdf",
        issuedAt: null,
        noticeNumbers: [],
      });

      expect(pdfParseMock).toHaveBeenCalled();
      expect(result.rawContent).toBe("PDF本文");
      expect(result.sourceDocId).toBe("000280044");
    });

    it("extracts HTML body text (tags stripped) for non-PDF URLs", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve("<html><body>  <p>本文</p>  <p>続き</p>  </body></html>"),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      } as unknown as Response);

      const result = await source.fetchDocument({
        sourceDocId: "0103",
        title: "テスト通知",
        sourceUrl: "https://www.pmda.go.jp/safety/info-services/devices/0103.html",
        issuedAt: null,
        noticeNumbers: [],
      });

      expect(result.rawContent).toBe("本文 続き");
    });

    it("throws when the response is not ok", async () => {
      jest
        .spyOn(global, "fetch")
        .mockResolvedValue({ ok: false, status: 404 } as unknown as Response);

      await expect(
        source.fetchDocument({
          sourceDocId: "000000000",
          title: "存在しない通知",
          sourceUrl: "https://www.pmda.go.jp/files/000000000.pdf",
          issuedAt: null,
          noticeNumbers: [],
        }),
      ).rejects.toThrow();
    });
  });

  describe("normalize", () => {
    it("maps to a JP/NOTICE document, joining multiple notice numbers into docNumber", async () => {
      const result = await source.normalize(
        {
          sourceDocId: "000246568",
          title: "自動体外式除細動器の適正使用について",
          sourceUrl: "https://www.pmda.go.jp/files/000246568.pdf",
          issuedAt: new Date(Date.UTC(2022, 4, 26)),
          noticeNumbers: ["薬生機審発0526第1号", "薬生安発0526第1号"],
        },
        {
          sourceDocId: "000246568",
          sourceUrl: "https://www.pmda.go.jp/files/000246568.pdf",
          rawContent: "本文テキスト",
          fetchedAt: new Date(),
        },
      );

      expect(result).toEqual({
        jurisdiction: "JP",
        type: "NOTICE",
        subtype: null,
        title: "自動体外式除細動器の適正使用について",
        docNumber: "薬生機審発0526第1号 / 薬生安発0526第1号",
        effectiveDate: new Date(Date.UTC(2022, 4, 26)),
        sourceUrl: "https://www.pmda.go.jp/files/000246568.pdf",
        fullText: "本文テキスト",
        contentHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
    });

    it("falls back to sourceDocId for docNumber when there are no notice numbers", async () => {
      const result = await source.normalize(
        {
          sourceDocId: "000280044",
          title: "VPN装置のサイバーセキュリティ対策について",
          sourceUrl: "https://www.pmda.go.jp/files/000280044.pdf",
          issuedAt: new Date(Date.UTC(2026, 2, 19)),
          noticeNumbers: [],
        },
        {
          sourceDocId: "000280044",
          sourceUrl: "https://www.pmda.go.jp/files/000280044.pdf",
          rawContent: "本文",
          fetchedAt: new Date(),
        },
      );

      expect(result.docNumber).toBe("000280044");
    });

    it("produces different contentHash values for different fullText", async () => {
      const item = {
        sourceDocId: "x",
        title: "t",
        sourceUrl: "https://www.pmda.go.jp/files/x.pdf",
        issuedAt: null,
        noticeNumbers: [],
      };

      const a = await source.normalize(item, {
        sourceDocId: "x",
        sourceUrl: item.sourceUrl,
        rawContent: "テキストA",
        fetchedAt: new Date(),
      });
      const b = await source.normalize(item, {
        sourceDocId: "x",
        sourceUrl: item.sourceUrl,
        rawContent: "テキストB",
        fetchedAt: new Date(),
      });

      expect(a.contentHash).not.toBe(b.contentHash);
    });
  });
});
