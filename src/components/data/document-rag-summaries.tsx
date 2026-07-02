"use client";

import { type ChangeEvent } from "react";
import {
  Field,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import { formatJsonLength } from "./data-view-shared";

export interface DocumentRagReadinessItem {
  artifact: string;
  detail: string;
  evidence: string;
  nextAction: string;
  status: "planned" | "ready";
}

export interface DocumentRagReadinessSummaryProps {
  chunks: DocumentRagChunkPreview[];
  onClearDraft: () => void;
  onCopyIngestionPacket: () => void;
  onCopyReadiness: () => void;
  onDocumentFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDocumentNameChange: (value: string) => void;
  onDocumentTextChange: (value: string) => void;
  onOpenInStudio: () => void;
  sourceName: string;
  text: string;
}

export interface DocumentRagChunkPreview {
  content: string;
  end: number;
  index: number;
  start: number;
}

export const documentRagChunkSize = 900;
export const documentRagMaxPreviewChunks = 4;

export const documentRagReadinessItems = [
  {
    artifact: "pgvector extension",
    detail: "Supabase schema draft already enables vector support.",
    evidence: "docs/database-schema.sql · create extension vector",
    nextAction: "Confirm embedding dimension and vector index before production.",
    status: "ready",
  },
  {
    artifact: "document_sources",
    detail: "Workspace-scoped source records are defined for upload, url, note, and integration.",
    evidence: "docs/database-schema.sql · document_sources",
    nextAction: "Bind the future upload UI to source metadata and owner workspace.",
    status: "ready",
  },
  {
    artifact: "document_chunks",
    detail: "Chunk rows can store content, metadata, order, and embedding vectors.",
    evidence: "docs/database-schema.sql · document_chunks",
    nextAction: "Add chunking and embedding jobs after the Supabase repository lands.",
    status: "ready",
  },
  {
    artifact: "ingestion gate",
    detail: "The app still needs a trusted parser and file-size/type policy before upload.",
    evidence: "future route handler",
    nextAction: "Accept text-like documents first, reject unsafe or oversized files early.",
    status: "planned",
  },
  {
    artifact: "retrieval gate",
    detail: "Prompt generation still needs a workspace-scoped retrieval contract.",
    evidence: "future prompt context adapter",
    nextAction: "Return cited chunks with source IDs before injecting context into prompts.",
    status: "planned",
  },
] satisfies DocumentRagReadinessItem[];

export function getDocumentRagStatusLabel(status: DocumentRagReadinessItem["status"]) {
  return status === "ready" ? "준비됨" : "설계 필요";
}

export function buildDocumentRagReadinessText() {
  const readyItems = documentRagReadinessItems.filter(
    (item) => item.status === "ready",
  );
  const plannedItems = documentRagReadinessItems.filter(
    (item) => item.status === "planned",
  );

  return [
    "# Prompt AI Studio Document RAG Readiness",
    "",
    `- Ready artifacts: ${readyItems.length}/${documentRagReadinessItems.length}`,
    `- Planned gates: ${plannedItems.length}`,
    "- Current scope: schema and operator readiness only; no document upload writes yet.",
    "",
    "## Readiness map",
    ...documentRagReadinessItems.map(
      (item) =>
        `- ${item.artifact}: ${getDocumentRagStatusLabel(item.status)} · ${item.detail} · evidence: ${item.evidence} · next: ${item.nextAction}`,
    ),
    "",
    "## Required gates before upload",
    "- Apply `docs/database-schema.sql` with pgvector enabled.",
    "- Keep uploads workspace-scoped through `document_sources.workspace_id`.",
    "- Split content into deterministic `document_chunks.chunk_index` rows.",
    "- Generate embeddings in a trusted server-side job, not in browser code.",
    "- Return cited source IDs and chunk indexes before using retrieved text in prompt context.",
  ].join("\n");
}

export function buildDocumentRagReadinessManualCopyText({
  reportText,
}: {
  reportText: string;
}) {
  const readyItems = documentRagReadinessItems.filter(
    (item) => item.status === "ready",
  );
  const plannedItems = documentRagReadinessItems.filter(
    (item) => item.status === "planned",
  );

  return [
    "# Prompt AI Studio 문서/RAG 준비도",
    "",
    "## 준비도 식별",
    `- 준비된 항목: ${readyItems.length}/${documentRagReadinessItems.length}`,
    `- 설계 필요 항목: ${plannedItems.length}개`,
    `- 리포트 길이: ${formatJsonLength(reportText)}`,
    "",
    "## 실행 전 gate 요약",
    "- pgvector schema exists, but upload execution is not enabled yet.",
    "- document_sources and document_chunks must stay workspace-scoped.",
    "- Embeddings should be generated server-side.",
    "- Retrieved chunks must keep source ID and chunk index citations.",
    "",
    "## Document RAG readiness",
    reportText,
  ].join("\n");
}

export function normalizeDocumentRagText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function createDocumentRagChunks(value: string): DocumentRagChunkPreview[] {
  const text = normalizeDocumentRagText(value);

  if (!text) {
    return [];
  }

  const chunks: DocumentRagChunkPreview[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const nextCursor = Math.min(cursor + documentRagChunkSize, text.length);
    const content = text.slice(cursor, nextCursor).trim();

    if (content) {
      chunks.push({
        content,
        end: nextCursor,
        index: chunks.length,
        start: cursor,
      });
    }

    cursor = nextCursor;
  }

  return chunks;
}

export function buildDocumentRagIngestionPacketText({
  chunks,
  sourceName,
  text,
}: {
  chunks: DocumentRagChunkPreview[];
  sourceName: string;
  text: string;
}) {
  const normalizedText = normalizeDocumentRagText(text);
  const resolvedSourceName = sourceName.trim() || "untitled-document";

  return [
    "# Prompt AI Studio Document RAG Ingestion Packet",
    "",
    "## Source",
    `- sourceName: ${resolvedSourceName}`,
    "- sourceType: upload",
    "- executionMode: local preview only",
    `- textLength: ${normalizedText.length}`,
    `- chunkSize: ${documentRagChunkSize}`,
    `- chunkCount: ${chunks.length}`,
    "",
    "## Gate",
    "- Do not write these rows until the Supabase repository and server-side embedding job are ready.",
    "- Store one `document_sources` row first, then write ordered `document_chunks` rows.",
    "- Generate embeddings server-side and keep source ID plus chunk index citations.",
    "- Reject unsafe or oversized files before this packet becomes an import job.",
    "",
    "## Chunk preview",
    ...chunks.slice(0, documentRagMaxPreviewChunks).map((chunk) =>
      [
        `### chunk ${chunk.index}`,
        `- range: ${chunk.start}-${chunk.end}`,
        "",
        chunk.content,
      ].join("\n"),
    ),
    chunks.length > documentRagMaxPreviewChunks
      ? `\n- ${chunks.length - documentRagMaxPreviewChunks} additional chunks omitted from preview.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildDocumentRagIngestionPacketManualCopyText({
  chunks,
  packetText,
  sourceName,
  text,
}: {
  chunks: DocumentRagChunkPreview[];
  packetText: string;
  sourceName: string;
  text: string;
}) {
  return [
    "# Prompt AI Studio 문서/RAG 수집 패킷",
    "",
    "## 패킷 식별",
    `- sourceName: ${sourceName.trim() || "untitled-document"}`,
    `- 원문 길이: ${normalizeDocumentRagText(text).length}자`,
    `- chunk 수: ${chunks.length}개`,
    `- 패킷 길이: ${formatJsonLength(packetText)}`,
    "",
    "## 실행 전 gate 요약",
    "- This packet is local preview only.",
    "- document_sources row must be created before document_chunks rows.",
    "- Embeddings must be generated server-side.",
    "- Retrieval must preserve source ID and chunk index citations.",
    "",
    "## Ingestion packet",
    packetText,
  ].join("\n");
}

export function buildDocumentRagStudioDraftInput({
  chunks,
  sourceName,
  text,
}: {
  chunks: DocumentRagChunkPreview[];
  sourceName: string;
  text: string;
}) {
  const normalizedText = normalizeDocumentRagText(text);
  const resolvedSourceName = sourceName.trim() || "untitled-document";

  return [
    `문서 이름: ${resolvedSourceName}`,
    `문서 길이: ${normalizedText.length}자`,
    `chunk 수: ${chunks.length}개`,
    "",
    "이 문서 맥락을 바탕으로 외부 AI에 전달할 전문 프롬프트를 작성해줘.",
    "프롬프트 언어는 AI가 문서 성격을 판단해 전체 영어 지시문 또는 한영 하이브리드로 선택해줘.",
    "반드시 source ID와 chunk index를 인용 기준으로 남기고, 문서에 없는 내용은 가정으로 분리해줘.",
    "",
    "## Chunk context",
    ...chunks.slice(0, documentRagMaxPreviewChunks).map((chunk) =>
      [
        `### chunk ${chunk.index}`,
        `range: ${chunk.start}-${chunk.end}`,
        "",
        chunk.content,
      ].join("\n"),
    ),
    chunks.length > documentRagMaxPreviewChunks
      ? `\n추가 chunk ${chunks.length - documentRagMaxPreviewChunks}개는 수집 패킷에서 확인해야 합니다.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function DocumentRagReadinessSummary({
  chunks,
  onClearDraft,
  onCopyIngestionPacket,
  onCopyReadiness,
  onDocumentFileChange,
  onDocumentNameChange,
  onDocumentTextChange,
  onOpenInStudio,
  sourceName,
  text,
}: DocumentRagReadinessSummaryProps) {
  const readyCount = documentRagReadinessItems.filter(
    (item) => item.status === "ready",
  ).length;
  const plannedCount = documentRagReadinessItems.length - readyCount;
  const normalizedText = normalizeDocumentRagText(text);
  const previewChunks = chunks.slice(0, documentRagMaxPreviewChunks);
  const studioDraftStatus =
    chunks.length > 0 ? "Studio 전송 가능" : "문서 원문 필요";
  const studioDraftSummaryItems = [
    {
      label: "프롬프트 언어",
      value: "자동 판단",
      detail: "전체 영어 또는 한영 하이브리드",
    },
    {
      label: "답변 언어",
      value: "입력 언어와 동일",
      detail: "Studio에서 필요 시 변경 가능",
    },
    {
      label: "전달 chunk",
      value:
        chunks.length > 0
          ? `${Math.min(chunks.length, documentRagMaxPreviewChunks)}/${chunks.length}개`
          : "0개",
      detail: "추가 chunk는 수집 패킷에서 확인",
    },
    {
      label: "인용 기준",
      value: "source ID + chunk index",
      detail: "문서 밖 내용은 가정으로 분리",
    },
  ];

  return (
    <div
      id="data-document-rag"
      className="scroll-mt-28 space-y-4 rounded-md border border-line bg-panel-strong px-4 py-4"
    >
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">문서/RAG 준비도</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            문서 업로드와 pgvector 검색을 바로 붙이기 전에 스키마, 수집,
            임베딩, 검색 인용 gate를 분리해 확인합니다.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onCopyReadiness}
        >
          RAG 준비도 복사
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-document-rag-summary-metrics"
      >
        <div className="min-w-0 rounded-md border border-line bg-surface px-3 py-3">
          <p className="text-xs text-muted">준비된 항목</p>
          <p className="mt-1 break-words font-mono text-sm text-soft">
            {readyCount}/{documentRagReadinessItems.length}
          </p>
        </div>
        <div className="min-w-0 rounded-md border border-line bg-surface px-3 py-3">
          <p className="text-xs text-muted">설계 필요</p>
          <p className="mt-1 break-words font-mono text-sm text-soft">
            {plannedCount}개
          </p>
        </div>
        <div className="min-w-0 rounded-md border border-line bg-surface px-3 py-3">
          <p className="text-xs text-muted">저장 단위</p>
          <p className="mt-1 break-words font-mono text-sm text-soft">
            document_sources
          </p>
        </div>
        <div className="min-w-0 rounded-md border border-line bg-surface px-3 py-3">
          <p className="text-xs text-muted">검색 단위</p>
          <p className="mt-1 break-words font-mono text-sm text-soft">
            document_chunks.embedding
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {documentRagReadinessItems.map((item) => (
          <div
            className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
            key={item.artifact}
          >
            <p className="text-xs font-semibold text-soft">{item.artifact}</p>
            <p className="mt-1 text-xs text-accent">
              {getDocumentRagStatusLabel(item.status)}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">{item.detail}</p>
            <p className="mt-2 break-words font-mono text-[11px] leading-5 text-muted">
              {item.evidence}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">
              {item.nextAction}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-md border border-line bg-surface px-3 py-3">
          <div>
            <p className="text-xs font-semibold text-soft">문서 입력</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              지금은 저장하지 않고 chunk 기준만 확인합니다.
            </p>
          </div>

          <Field label="문서 이름">
            <input
              className={inputClass}
              value={sourceName}
              onChange={(event) => onDocumentNameChange(event.target.value)}
              placeholder="company-guide.md"
            />
          </Field>

          <Field label="텍스트 파일">
            <input
              type="file"
              accept=".txt,.md,.json,text/plain,text/markdown,application/json"
              className="block w-full rounded-md border border-dashed border-line bg-panel-strong px-3 py-3 text-sm text-muted file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-background hover:border-accent"
              onChange={onDocumentFileChange}
            />
          </Field>

          <Field label="문서 원문">
            <textarea
              className={`${textareaClass} min-h-56 font-mono text-xs`}
              value={text}
              onChange={(event) => onDocumentTextChange(event.target.value)}
              placeholder="업로드할 문서 본문을 붙여넣으면 chunk preview가 생성됩니다."
            />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={primaryButtonClass}
              disabled={chunks.length === 0}
              onClick={onOpenInStudio}
            >
              Studio로 보내기
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={chunks.length === 0}
              onClick={onCopyIngestionPacket}
            >
              수집 패킷 복사
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={!sourceName && !text}
              onClick={onClearDraft}
            >
              입력 지우기
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-line bg-surface px-3 py-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-panel-strong px-3 py-3">
              <p className="text-xs text-muted">원문 길이</p>
              <p className="mt-1 font-mono text-sm text-soft">
                {normalizedText.length.toLocaleString("ko-KR")}자
              </p>
            </div>
            <div className="rounded-md border border-line bg-panel-strong px-3 py-3">
              <p className="text-xs text-muted">chunk 크기</p>
              <p className="mt-1 font-mono text-sm text-soft">
                {documentRagChunkSize.toLocaleString("ko-KR")}자
              </p>
            </div>
            <div className="rounded-md border border-line bg-panel-strong px-3 py-3">
              <p className="text-xs text-muted">chunk 수</p>
              <p className="mt-1 font-mono text-sm text-soft">
                {chunks.length.toLocaleString("ko-KR")}개
              </p>
            </div>
          </div>

          <div className="rounded-md border border-accent/30 bg-panel-strong px-3 py-3">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-soft">
                  Studio 전송 준비
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  문서 맥락을 외부 AI용 전문 프롬프트 초안으로 넘기기 전
                  적용할 기준입니다.
                </p>
              </div>
              <span className="shrink-0 rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent">
                {studioDraftStatus}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {studioDraftSummaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-line bg-surface px-3 py-3"
                >
                  <p className="text-xs text-muted">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold text-soft">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {previewChunks.length > 0 ? (
            <div className="space-y-2">
              {previewChunks.map((chunk) => (
                <div
                  className="rounded-md border border-line bg-panel-strong px-3 py-3"
                  key={chunk.index}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs text-accent">
                      chunk {chunk.index}
                    </p>
                    <p className="font-mono text-[11px] text-muted">
                      {chunk.start}-{chunk.end}
                    </p>
                  </div>
                  <p className="mt-2 max-h-20 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted">
                    {chunk.content}
                  </p>
                </div>
              ))}
              {chunks.length > previewChunks.length ? (
                <p className="text-xs text-muted">
                  나머지 {chunks.length - previewChunks.length}개 chunk는 수집
                  패킷에 요약됩니다.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-line bg-panel-strong px-3 py-10 text-center text-sm text-muted">
              문서 원문을 입력하면 chunk preview가 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
