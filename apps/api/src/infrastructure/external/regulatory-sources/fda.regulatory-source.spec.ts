import { FdaRegulatorySource } from "./fda.regulatory-source";

// 実API(https://www.federalregister.gov/api/v1/documents.json ほか、2026-07-08確認)のレスポンス構造を
// 模したフィクスチャ。type="Rule"の項目はfetchListで除外されることを検証するために含める。
const SEARCH_RESPONSE_FIXTURE = {
  results: [
    {
      document_number: "2026-13519",
      title: "Agency Information Collection Activities; Premarket Approval of Medical Devices",
      type: "Notice",
      html_url: "https://www.federalregister.gov/documents/2026/07/06/2026-13519/example",
      publication_date: "2026-07-06",
    },
    {
      document_number: "2026-13140",
      title: "Medical Devices; Classification of the Monitor for Opioid Induced Impairment",
      type: "Rule",
      html_url: "https://www.federalregister.gov/documents/2026/06/30/2026-13140/example",
      publication_date: "2026-06-30",
    },
  ],
};

const DOCUMENT_DETAIL_FIXTURE = {
  raw_text_url:
    "https://www.federalregister.gov/documents/full_text/text/2026/07/06/2026-13519.txt",
};

describe("FdaRegulatorySource", () => {
  let source: FdaRegulatorySource;

  beforeEach(() => {
    source = new FdaRegulatorySource();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sets a stable sourceId for ingestion_jobs.source", () => {
    expect(source.sourceId).toBe("FDA_FEDERAL_REGISTER_DEVICE_NOTICES");
  });

  describe("fetchList", () => {
    it("requests the Federal Register API scoped to FDA, medical device, Notice type, and a recent publication_date window", async () => {
      let capturedUrl: string | undefined;
      jest.spyOn(global, "fetch").mockImplementation((url) => {
        capturedUrl = url as string;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(SEARCH_RESPONSE_FIXTURE),
        } as unknown as Response);
      });

      await source.fetchList();

      if (!capturedUrl) {
        throw new Error("fetchが呼び出されませんでした。");
      }
      const requestedUrl = new URL(capturedUrl);
      expect(requestedUrl.origin + requestedUrl.pathname).toBe(
        "https://www.federalregister.gov/api/v1/documents.json",
      );
      expect(requestedUrl.searchParams.getAll("conditions[agencies][]")).toEqual([
        "food-and-drug-administration",
      ]);
      expect(requestedUrl.searchParams.getAll("conditions[type][]")).toEqual(["NOTICE"]);
      expect(requestedUrl.searchParams.get("conditions[term]")).toBe("medical device");
      expect(requestedUrl.searchParams.get("conditions[publication_date][gte]")).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
    });

    it("maps Notice results to SourceListItem and filters out non-Notice types", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(SEARCH_RESPONSE_FIXTURE),
      } as unknown as Response);

      const items = await source.fetchList();

      expect(items).toEqual([
        {
          sourceDocId: "2026-13519",
          title: "Agency Information Collection Activities; Premarket Approval of Medical Devices",
          sourceUrl: "https://www.federalregister.gov/documents/2026/07/06/2026-13519/example",
          issuedAt: new Date(Date.UTC(2026, 6, 6)),
          noticeNumbers: [],
        },
      ]);
    });

    it("throws when the response is not ok", async () => {
      jest
        .spyOn(global, "fetch")
        .mockResolvedValue({ ok: false, status: 503 } as unknown as Response);

      await expect(source.fetchList()).rejects.toThrow();
    });
  });

  describe("fetchDocument", () => {
    it("fetches the document detail JSON, then the raw_text_url plain text body", async () => {
      const fetchMock = jest
        .spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(DOCUMENT_DETAIL_FIXTURE),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve("  本文テキスト  \n"),
        } as unknown as Response);

      const result = await source.fetchDocument({
        sourceDocId: "2026-13519",
        title: "テスト",
        sourceUrl: "https://www.federalregister.gov/documents/2026/07/06/2026-13519/example",
        issuedAt: null,
        noticeNumbers: [],
      });

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "https://www.federalregister.gov/api/v1/documents/2026-13519.json",
      );
      expect(fetchMock).toHaveBeenNthCalledWith(2, DOCUMENT_DETAIL_FIXTURE.raw_text_url);
      expect(result.rawContent).toBe("本文テキスト");
      expect(result.sourceDocId).toBe("2026-13519");
    });

    it("throws when the document detail response is not ok", async () => {
      jest
        .spyOn(global, "fetch")
        .mockResolvedValue({ ok: false, status: 404 } as unknown as Response);

      await expect(
        source.fetchDocument({
          sourceDocId: "0000000",
          title: "存在しない文書",
          sourceUrl: "https://www.federalregister.gov/documents/x",
          issuedAt: null,
          noticeNumbers: [],
        }),
      ).rejects.toThrow();
    });
  });

  describe("normalize", () => {
    it("maps to a US/NOTICE document with subtype null", async () => {
      const result = await source.normalize(
        {
          sourceDocId: "2026-13519",
          title: "テスト通知",
          sourceUrl: "https://www.federalregister.gov/documents/2026/07/06/2026-13519/example",
          issuedAt: new Date(Date.UTC(2026, 6, 6)),
          noticeNumbers: [],
        },
        {
          sourceDocId: "2026-13519",
          sourceUrl: "https://www.federalregister.gov/documents/2026/07/06/2026-13519/example",
          rawContent: "本文テキスト",
          fetchedAt: new Date(),
        },
      );

      expect(result).toEqual({
        jurisdiction: "US",
        type: "NOTICE",
        subtype: null,
        title: "テスト通知",
        docNumber: "2026-13519",
        effectiveDate: new Date(Date.UTC(2026, 6, 6)),
        sourceUrl: "https://www.federalregister.gov/documents/2026/07/06/2026-13519/example",
        fullText: "本文テキスト",
        contentHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
    });

    it("produces different contentHash values for different fullText", async () => {
      const item = {
        sourceDocId: "x",
        title: "t",
        sourceUrl: "https://www.federalregister.gov/documents/x",
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
