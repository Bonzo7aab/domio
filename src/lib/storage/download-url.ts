/** Append a download hint to a presigned storage URL. */
export function buildAttachmentDownloadUrl(url: string, filename: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}download=${encodeURIComponent(filename)}`;
}

/** Trigger a browser download for a remote file URL. */
export async function downloadFileFromUrl(url: string, filename: string): Promise<void> {
  const href = buildAttachmentDownloadUrl(url, filename);

  try {
    const response = await fetch(href);
    if (!response.ok) {
      throw new Error(`Download failed (${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
}
