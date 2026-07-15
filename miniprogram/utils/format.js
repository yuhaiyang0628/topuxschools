function compactText(value, maxLength) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function programTags(program) {
  const tags = [];
  if (program.tags && program.tags.includes("portfolio")) tags.push("作品集");
  if (program.stem) tags.push("STEM");
  if (program.tags && program.tags.includes("no-gre")) tags.push("免 GRE");
  if (program.tags && program.tags.includes("rolling")) tags.push("滚动录取");
  return tags;
}

module.exports = {
  compactText,
  programTags
};
