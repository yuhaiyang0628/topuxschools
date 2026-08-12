function isCloudFile(value) {
  return /^cloud:\/\//i.test(String(value || ""));
}

async function resolveCloudImageBlocks(blocks) {
  const fileIds = [...new Set((blocks || [])
    .filter((block) => block.type === "image")
    .map((block) => block.fileID || block.miniSrc || block.src)
    .filter(isCloudFile))];
  if (!fileIds.length || !wx.cloud || typeof wx.cloud.getTempFileURL !== "function") return blocks;

  try {
    const response = await wx.cloud.getTempFileURL({ fileList: fileIds });
    const urls = new Map((response.fileList || []).map((file) => [file.fileID, file.tempFileURL]));
    return blocks.map((block) => {
      if (block.type !== "image") return block;
      const fileId = block.fileID || block.miniSrc || block.src;
      return urls.has(fileId) ? { ...block, miniSrc: urls.get(fileId) } : block;
    });
  } catch (error) {
    console.warn("[Top UX Schools] Cloud article images could not be resolved.", error);
    return blocks;
  }
}

async function resolveCloudImages(images) {
  const blocks = (images || []).map((image) => ({
    ...image,
    type: "image",
    src: image.fileID || image.mini || image.src
  }));
  const resolved = await resolveCloudImageBlocks(blocks);
  return resolved.map(({ type, src, miniSrc, ...image }) => ({
    ...image,
    previewUrl: miniSrc || src || ""
  }));
}

module.exports = { isCloudFile, resolveCloudImageBlocks, resolveCloudImages };
