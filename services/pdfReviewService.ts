import { pdf } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { reviewRenderedResume } from './openaiService';

export interface RenderedResumeReview {
    pageCount: number;
    extractedText?: string;
    warnings: Array<{
        code: string;
        severity: 'error' | 'warning' | 'info';
        message: string;
    }>;
}

const blobToBase64 = async (blob: Blob) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
    return dataUrl.split(',')[1] || '';
};

export const inspectRenderedResume = async (
    document: ReactElement,
    includeModelReview = true,
): Promise<{ blob: Blob; report: RenderedResumeReview }> => {
    const blob = await pdf(document).toBlob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const loaded = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= loaded.numPages; pageNumber += 1) {
        const page = await loaded.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => 'str' in item ? item.str : '').join(' ').replace(/\s+/g, ' ').trim());
    }

    const warnings: RenderedResumeReview['warnings'] = [];
    if (loaded.numPages > 2) {
        warnings.push({
            code: 'page_overflow',
            severity: 'error',
            message: `The rendered resume is ${loaded.numPages} pages; the maximum is 2.`,
        });
    }
    const lastPageWords = (pages.at(-1) || '').split(/\s+/).filter(Boolean).length;
    if (loaded.numPages > 1 && lastPageWords < 35) {
        warnings.push({
            code: 'orphan_page',
            severity: 'warning',
            message: `The final page contains only ${lastPageWords} words and may be an orphan page.`,
        });
    }
    if (pages.some((page) => page.length === 0)) {
        warnings.push({
            code: 'empty_extracted_page',
            severity: 'warning',
            message: 'At least one rendered page has no extractable text.',
        });
    }

    if (includeModelReview) {
        try {
            const modelReview = await reviewRenderedResume(await blobToBase64(blob));
            for (const warning of modelReview?.warnings || []) {
                if (!warnings.some((item) => item.code === warning.code && item.message === warning.message)) {
                    warnings.push(warning);
                }
            }
        } catch (error) {
            warnings.push({
                code: 'model_layout_review_unavailable',
                severity: 'info',
                message: error instanceof Error ? error.message : 'Model layout review was unavailable.',
            });
        }
    }

    return {
        blob,
        report: {
            pageCount: loaded.numPages,
            extractedText: pages.join('\n\n'),
            warnings,
        },
    };
};

export const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
